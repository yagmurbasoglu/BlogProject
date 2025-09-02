using BlogProject.Domain.Entities;

namespace BlogProject.Application.Features.Posts.Queries
{
    public class PaginatedPostsDto
    {
        public List<Post> Items { get; set; } = new();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }

        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }
}
