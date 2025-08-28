using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.PostLikes.Queries.IsPostLiked;

public class IsPostLikedHandler : IRequestHandler<IsPostLikedQuery, bool>
{
    private readonly IUnitOfWork _uow;

    public IsPostLikedHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<bool> Handle(IsPostLikedQuery request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<PostLike>();

        var like = await repo.FirstOrDefaultAsync(
            l => l.PostId == request.PostId && l.UserId == request.UserId,
            null, true, cancellationToken);

        return like != null;
    }
}
