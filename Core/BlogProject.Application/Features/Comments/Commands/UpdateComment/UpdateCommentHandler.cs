using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Comments.Commands.UpdateComment;

public class UpdateCommentHandler : IRequestHandler<UpdateCommentCommand, bool>
{
    private readonly IUnitOfWork _uow;

    public UpdateCommentHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<bool> Handle(UpdateCommentCommand request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<Comment>();
        var comment = await repo.GetByIdAsync(request.Id, false, cancellationToken);

        if (comment == null || comment.IsDeleted)
            return false;

        // Sadece kendi yorumunu güncelleyebilsin
        if (comment.AuthorId != request.AuthorId)
            return false;

        comment.Content = request.Content;
        repo.Update(comment);

        await _uow.SaveChangesAsync(cancellationToken);
        return true;
    }
}
