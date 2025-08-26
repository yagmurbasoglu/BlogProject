using MediatR;

namespace BlogProject.Application.Features.Comments.Commands.UpdateComment;

public class UpdateCommentCommand : IRequest<bool>
{
    public Guid Id { get; set; }          // Hangi yorum güncellenecek
    public Guid AuthorId { get; set; }    // Sadece kendi yorumunu güncelleyebilsin
    public string Content { get; set; } = string.Empty;
}
