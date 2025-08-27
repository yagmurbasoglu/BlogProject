using MediatR;

namespace BlogProject.Application.Features.PostLikes.Queries.GetPostLikes;

public class GetPostLikesQuery : IRequest<int>
{
    public Guid PostId { get; set; }
}
