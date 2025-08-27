using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Application.Features.PostLikes.Queries.GetPostLikes;

public class GetPostLikesHandler : IRequestHandler<GetPostLikesQuery, int>
{
    private readonly IUnitOfWork _uow;

    public GetPostLikesHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<int> Handle(GetPostLikesQuery request, CancellationToken cancellationToken)
    {
        return await _uow.Repository<PostLike>()
            .ListAsync(l => l.PostId == request.PostId, true, cancellationToken)
            .ContinueWith(t => t.Result.Count, cancellationToken);
    }
}
