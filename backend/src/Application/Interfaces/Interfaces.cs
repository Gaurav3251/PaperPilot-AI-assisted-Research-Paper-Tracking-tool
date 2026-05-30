using Application.DTOs;

namespace Application.Interfaces;

public interface ITokenService
{
    string CreateToken(Guid userId, string email, string role);
}

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<string> GeneratePasswordResetTokenAsync(ForgotPasswordRequest request);
    Task ResetPasswordAsync(ResetPasswordRequest request);
}

public interface IMlService
{
    Task<IReadOnlyList<string>> SuggestTagsAsync(string text);
}

public interface IPaperService
{
    Task<PagedResult<PaperDto>> GetAllAsync(Guid userId, PaperQueryParams query);
    Task<PaperDto?> GetByIdAsync(Guid userId, Guid paperId);
    Task<PaperDto> CreateAsync(Guid userId, CreatePaperDto dto);
    Task<PaperDto?> UpdateAsync(Guid userId, Guid paperId, UpdatePaperDto dto);
    Task<bool> DeleteAsync(Guid userId, Guid paperId);
    Task<IReadOnlyList<string>> SuggestTagsAsync(Guid userId, string text);
    Task<PaperDto?> UploadPdfAsync(Guid userId, Guid paperId, string fileUrl);
}

public interface INoteService
{
    Task<IReadOnlyList<NoteDto>> GetByPaperAsync(Guid userId, Guid paperId);
    Task<NoteDto?> AddAsync(Guid userId, CreateNoteDto dto);
}
