using MediatR;

namespace BlogProject.Application.Features.Comments.Commands.DeleteComment;

public class DeleteCommentCommand : IRequest<bool>
{
    public Guid Id { get; set; }        // Silinecek yorum
    public Guid AuthorId { get; set; }  // Sadece kendi yorumunu silebilsin
}
