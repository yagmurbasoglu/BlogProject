using MediatR;

namespace BlogProject.Application.Features.Comments.Queries
{
    public class GetCommentsWithPaginationQuery : IRequest<PaginatedCommentsDto>
    {
        public Guid PostId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 5;
    }
}
