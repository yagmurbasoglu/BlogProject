using MediatR;

namespace BlogProject.Application.Features.Posts.Queries
{
    public class GetPostsWithPaginationQuery : IRequest<PaginatedPostsDto>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
