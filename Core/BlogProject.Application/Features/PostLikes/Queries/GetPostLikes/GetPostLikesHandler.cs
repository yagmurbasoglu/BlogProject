using AutoMapper;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.PostLikes.Queries.GetPostLikes;

public class GetPostLikesHandler : IRequestHandler<GetPostLikesQuery, List<PostLikeDto>>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public GetPostLikesHandler(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<List<PostLikeDto>> Handle(GetPostLikesQuery request, CancellationToken cancellationToken)
    {
        var likes = await _uow.Repository<PostLike>()
            .ListAsync(l => l.PostId == request.PostId, true, cancellationToken);

        return _mapper.Map<List<PostLikeDto>>(likes);
    }
}
