using BlogProject.Domain.Entities;

namespace BlogProject.Application.Features.Comments.Queries
{
    public class PaginatedCommentsDto
    {
        public List<CommentDto> Items { get; set; } = new();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }

        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }
}
