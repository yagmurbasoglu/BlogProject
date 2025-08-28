using MediatR;

namespace BlogProject.Application.Features.PostLikes.Queries.GetPostLikes;

public class GetPostLikesQuery : IRequest<List<PostLikeDto>>
{
    public Guid PostId { get; set; }
}
