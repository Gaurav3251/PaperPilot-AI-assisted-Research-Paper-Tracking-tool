from fastapi import FastAPI
from pydantic import BaseModel
import yake
import re
from typing import List, Tuple

# Sentence Transformers is already installed (per user).
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI(title="Research Paper Tracker ML Service")

# Candidate extraction
extractor = yake.KeywordExtractor(lan="en", n=3, top=30, dedupLim=0.85)

# These are overly generic academic words/phrases that frequently become garbage tags.
STOP_TERMS = {
    "paper", "approach", "method", "analysis", "results", "study", "system", "model",
    "using", "based", "comparison", "comparative", "proposed", "work", "framework",
    "we", "our", "them", "they", "this", "that", "these", "those",
    "via", "through", "into", "from", "with", "without",
    "using", "employ", "employing", "developed", "develop", "utilize", "utilized",
    "show", "shows", "present", "presents", "include", "includes",
    "final", "finally",
}

# Remove clause-like / urgency fragments that YAKE can surface as "keywords"
# due to token overlap (e.g., "requires timely", "prevent death").
BAD_PATTERNS = [
    r"\brequires?\b",
    r"\brequires?\b",
    r"\bprevent(s|ed|ing)?\b",
    r"\bdeath\b",
    r"\blong[-\s]?term\b",
    r"\bdisabilit(y|ies)\b",
    r"\bcondition(s)?\b",
    r"\btime[-\s]?sensitive\b",
]

DOMAIN_HINTS = {
    # ML/vision
    "attention", "attention gate", "ensemble", "confidence weighted ensemble", "temperature",
    "temperature scaling", "segmentation", "segmentation guided", "lesion", "lesion probability",
    "probability map", "spatial priors", "classification", "classifier", "fusion",
    # Imaging
    "ct", "ct imaging", "computed tomography", "brain ct", "brain",
    # Common architectures (optional; low priority if not present)
    "swin", "swin-unet", "swin unet", "unet", "swinunet",
    "cnn", "resnet", "vit", "transformer",
}

class KeyphraseRequest(BaseModel):
    text: str

class KeyphraseResponse(BaseModel):
    tags: List[str]

_model = None

def _get_model():
    global _model
    if _model is None:
        # Small and fast; robust for semantic reranking.
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def _normalize(s: str) -> str:
    s = s or ""
    s = re.sub(r"[^a-zA-Z0-9\-\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s

def _is_bad_phrase(p: str) -> bool:
    if not p or len(p) < 3:
        return True
    if p in STOP_TERMS:
        return True
    # too short to be meaningful once normalized
    if len(p) < 3:
        return True
    # avoid long clause fragments (keeps phrases)
    if p.count(" ") > 3:
        return True
    # avoid common clause fragments / urgency medical phrases
    for pat in BAD_PATTERNS:
        if re.search(pat, p):
            return True
    return False

def _mmr_select(
    candidates: List[str],
    candidate_vecs: np.ndarray,
    query_vec: np.ndarray,
    k: int = 10,
    lambda_param: float = 0.7,
) -> List[str]:
    """
    Maximal Marginal Relevance:
    - pick items that are similar to query (relevance)
    - but dissimilar to already-selected items (diversity)
    """
    if not candidates:
        return []

    # cosine similarity
    def cos(a, b):
        a_norm = a / (np.linalg.norm(a) + 1e-9)
        b_norm = b / (np.linalg.norm(b) + 1e-9)
        return float(np.dot(a_norm, b_norm))

    selected = []
    selected_idx = set()

    # start with best relevance
    sims_to_query = [cos(candidate_vecs[i], query_vec) for i in range(len(candidates))]
    best = int(np.argmax(sims_to_query))
    selected.append(candidates[best])
    selected_idx.add(best)

    while len(selected) < min(k, len(candidates)):
        best_score = -1e9
        best_i = None
        for i in range(len(candidates)):
            if i in selected_idx:
                continue
            relevance = sims_to_query[i]
            redundancy = max(
                cos(candidate_vecs[i], candidate_vecs[j]) for j in selected_idx
            )
            score = lambda_param * relevance - (1 - lambda_param) * redundancy
            if score > best_score:
                best_score = score
                best_i = i

        if best_i is None:
            break
        selected.append(candidates[best_i])
        selected_idx.add(best_i)

    return selected

@app.get('/health')
def health():
    return {'status': 'ok'}

@app.post('/keyphrases', response_model=KeyphraseResponse)
def keyphrases(req: KeyphraseRequest):
    raw: List[Tuple[str, float]] = extractor.extract_keywords(req.text or "")
    text = req.text or ""

    # Keep acronyms (e.g., ASL, CNN). Filter out too-short acronyms.
    acronyms = set(re.findall(r"\b[A-Z]{2,}\b", text))
    acronyms = {_normalize(ac) for ac in acronyms if len(ac) >= 2}

    # YAKE scoring: lower is usually better. Your existing code used inverted filtering.
    # We'll keep candidates primarily by cleaning + quality filters, then rerank.
    candidates: List[str] = []
    seen = set()

    for phrase, _score in raw:
        cleaned = _normalize(phrase)

        if _is_bad_phrase(cleaned):
            continue
        if cleaned in seen:
            continue
        # Remove stop-like tokens that become fragments after cleaning
        if any(t in cleaned.split() for t in ("requires", "death", "disability")):
            continue

        # Prefer 1-3 word phrases; allow 3 if domain-ish.
        if cleaned.count(" ") > 2:
            if cleaned not in DOMAIN_HINTS and not any(h in cleaned for h in DOMAIN_HINTS):
                continue

        seen.add(cleaned)
        candidates.append(cleaned)

    # Add acronyms after we filter normal phrases.
    for ac in acronyms:
        if not ac or _is_bad_phrase(ac):
            continue
        if ac not in seen:
            seen.add(ac)
            candidates.append(ac)

    # If nothing survives filtering, fall back to top raw after normalization.
    if not candidates:
        for phrase, _ in raw[:10]:
            cleaned = _normalize(phrase)
            if not _is_bad_phrase(cleaned) and cleaned not in seen:
                candidates.append(cleaned)
                seen.add(cleaned)

    # Semantic rerank + diversity using sentence-transformers.
    # This makes output robust across different paper topics/wording.
    model = _get_model()
    query_vec = model.encode([text], normalize_embeddings=True)[0]
    cand_vecs = model.encode(candidates, normalize_embeddings=True)

    # Ensure domain hints are not completely lost:
    # We'll boost by adding them early if present in candidates.
    boosted = []
    boost_set = set()
    for h in DOMAIN_HINTS:
        hl = h.lower()
        for c in candidates:
            if hl == c and c not in boost_set:
                boosted.append(c)
                boost_set.add(c)

    remaining = [c for c in candidates if c not in boost_set]
    if boosted:
        # Rerank remaining via MMR; start selection with boosted items.
        selected_tail = _mmr_select(
            remaining,
            cand_vecs[[candidates.index(c) for c in remaining]],
            query_vec,
            k=10 - len(boosted),
            lambda_param=0.65,
        )
        final = (boosted + selected_tail)[:10]
    else:
        final = _mmr_select(candidates, cand_vecs, query_vec, k=10, lambda_param=0.7)

    # Final cleanup: remove anything too generic again.
    final = [t for t in final if not _is_bad_phrase(t)]
    # Dedup while preserving order
    out = []
    seen2 = set()
    for t in final:
        if t not in seen2:
            seen2.add(t)
            out.append(t)

    return KeyphraseResponse(tags=out)
