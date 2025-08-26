using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Comments.Commands.DeleteComment;

public class DeleteCommentHandler : IRequestHandler<DeleteCommentCommand, bool>
{
    private readonly IUnitOfWork _uow;

    public DeleteCommentHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<bool> Handle(DeleteCommentCommand request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<Comment>();
        var comment = await repo.GetByIdAsync(request.Id, false, cancellationToken);

        if (comment == null || comment.IsDeleted)
            return false;

        if (comment.AuthorId != request.AuthorId)
            return false;

        comment.IsDeleted = true;
        repo.Update(comment);

        await _uow.SaveChangesAsync(cancellationToken);
        return true;
    }
}
