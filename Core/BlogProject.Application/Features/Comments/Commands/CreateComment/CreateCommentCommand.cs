using MediatR;

namespace BlogProject.Application.Features.Comments.Commands.CreateComment;

public class CreateCommentCommand : IRequest<Guid>
{
    public Guid PostId { get; set; }
    public Guid AuthorId { get; set; } // JWT’den gelecek
    public string Content { get; set; } = string.Empty;
}
