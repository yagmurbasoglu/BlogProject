using BlogProject.Application.Common.Exceptions;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Application.Features.PostLikes.Commands.LikePost;

public class LikePostHandler : IRequestHandler<LikePostCommand, bool>
{
    private readonly IUnitOfWork _uow;

    public LikePostHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<bool> Handle(LikePostCommand request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<PostLike>();

        // aynı user + post için zaten like var mı kontrol et
        var exists = await repo.FirstOrDefaultAsync(
            l => l.PostId == request.PostId && l.UserId == request.UserId,
            null, true, cancellationToken);

        if (exists != null)
            throw new AppValidationException("You already liked this post"); // zaten beğenmiş

        var like = new PostLike
        {
            PostId = request.PostId,
            UserId = request.UserId
        };

        await repo.AddAsync(like, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return true;
    }
}
