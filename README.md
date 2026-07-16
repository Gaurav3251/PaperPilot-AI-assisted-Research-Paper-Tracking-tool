# PaperPilot - AI Assisted Research Paper Tracker

> A production-oriented full-stack application to organize research papers, notes, and AI-powered similar-paper / keyphrase workflows.

---

## Features
- **Paper management**: add papers with title, abstract, authors, links, and status.
- **Status workflow in UI**: track papers through stages like **ToRead → Reading → Used in Literature Review → Cited**.
- **Collections & tags**: group papers into collections and manage tags for fast filtering.
- **Notes workspace**: keep notes alongside your reading pipeline.
- **AI-assisted tag generation (“Suggest Tags”)**: generates tags for paper based its abstract using **YAKE (Yet Another Keyword Extractor) and Sentence Transformer**
- **Clean architecture backend**: separation of API, application services, domain entities, and infrastructure.

---

## Stack
- Frontend: React + Vite
- Backend: ASP.NET Core 8 Web API 
- Database: PostgreSQL
- AI Service: Python FastAPI

## Architecture
- `backend/` API, application services, domain entities, infrastructure/data access
- `frontend/` landing page and authenticated paper-tracker UI
- `ml-service/` embedding/keyphrase service consumed by backend

---

## Local Development / Run Instructions

### Start Backend (ASP.NET Core)
1. Open a terminal in the project root.
2. Run:
   - `cd backend/src/API`
   - `dotnet run`

Backend exposes the API under routes like `/api/...` (example: `/api/auth/forgot-password`).

### Start Frontend (React/Vite)
1. Open a new terminal in the project root.
2. Run:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

Frontend will start on the Vite dev server. Ensure `VITE_API_URL` in your frontend environment points to your backend base URL (including `/api` if applicable for your deployment).

### Start ML Service (FastAPI)
1. Open a new terminal in the project root.
2. Run:
   - `cd ml-service`
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app --reload --port 8000`

The backend calls this service for AI-assisted tag suggestions.

## Quick API Notes
- Password reset:
  - `POST /api/auth/forgot-password` → `{ token }`
  - `POST /api/auth/reset-password` → `{ email, token, newPassword }`
- Tag suggestions:
  - Frontend calls: `POST /api/papers/suggest-tags`
  - Backend calls `ml-service` and returns `{ tags: [...] }`

## Email (SMTP) setup — free options
The backend needs *some* SMTP provider to send password-reset emails; there's no way around configuring one, but two free options work well for personal projects:

**Option — Gmail (simplest for a single developer/tester)**
1. Enable 2-Step Verification on the Gmail account.
2. Create an "App Password" at https://myaccount.google.com/apppasswords (choose "Mail" as the app).
3. Set in `appsettings.Development.json` (or environment variables / user-secrets in production):
   - `Smtp:Host` = `smtp.gmail.com`
   - `Smtp:Port` = `587`
   - `Smtp:User` = your Gmail address
   - `Smtp:Password` = the 16-character app password (not your normal Gmail password)
   - `Smtp:FromEmail` = your Gmail address
4. Gmail's free tier allows roughly 500 emails/day — plenty for development and small-scale use.

**NOTE:** Never commit real SMTP credentials — use `dotnet user-secrets` locally or environment variables in deployment.

---

## License
See [LICENSE](LICENSE.txt)
