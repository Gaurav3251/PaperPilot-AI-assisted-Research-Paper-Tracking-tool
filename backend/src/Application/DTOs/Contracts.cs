namespace Application.DTOs;

public record RegisterRequest(string Email, string Password, string FullName, string? Role);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record AuthResponse(string Token, string Email, string FullName, string Role);
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);
public record PaperQueryParams(
    int Page = 1,
    int PageSize = 10,
    string? Q = null,
    string? Status = null,
    string? Author = null,
    int? Year = null,
    string? Tag = null
);

public record PaperDto(
    Guid Id,
    string Title,
    string? Abstract,
    string? Authors,
    int? Year,
    string? Venue,
    string? Status,
    int Priority,
    bool AiGenerated,
    IReadOnlyList<string> Tags
);

public record CreatePaperDto(
    string Title,
    string? Abstract,
    string? Authors,
    int? Year,
    string? Venue,
    string? Doi,
    string? PaperUrl,
    string? PdfUrl,
    int Priority,
    Guid? CategoryId,
    List<string>? Tags
);

public record UpdatePaperDto(
    string Title,
    string? Abstract,
    string? Authors,
    int? Year,
    string? Venue,
    string? Doi,
    string? PaperUrl,
    string? PdfUrl,
    string Status,
    int Priority,
    Guid? CategoryId,
    List<string>? Tags
);

public record SuggestTagsRequest(string Text);
public record SuggestTagsResponse(IReadOnlyList<string> Tags);

public record NoteDto(Guid Id, Guid PaperId, string Content, DateTime CreatedAt);
public record CreateNoteDto(Guid PaperId, string Content);
