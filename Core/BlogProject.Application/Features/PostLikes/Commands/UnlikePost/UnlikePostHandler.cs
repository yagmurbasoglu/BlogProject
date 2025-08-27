using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Application.Features.PostLikes.Commands.UnlikePost;

public class UnlikePostHandler : IRequestHandler<UnlikePostCommand, bool>
{
    private readonly IUnitOfWork _uow;

    public UnlikePostHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<bool> Handle(UnlikePostCommand request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<PostLike>();

        var like = await repo.FirstOrDefaultAsync(
            l => l.PostId == request.PostId && l.UserId == request.UserId,
            null, false, cancellationToken);

        if (like == null)
            return false; // zaten beğenmemiş

        repo.Remove(like);
        await _uow.SaveChangesAsync(cancellationToken);

        return true;
    }
}
