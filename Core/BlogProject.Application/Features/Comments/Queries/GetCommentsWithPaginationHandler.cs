using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Application.Features.Comments.Queries
{
    public class GetCommentsWithPaginationHandler : IRequestHandler<GetCommentsWithPaginationQuery, PaginatedCommentsDto>
    {
        private readonly IUnitOfWork _uow;

        public GetCommentsWithPaginationHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<PaginatedCommentsDto> Handle(GetCommentsWithPaginationQuery request, CancellationToken cancellationToken)
        {
            var repo = _uow.Repository<Comment>();

            var query = repo.Query()
                .Where(c => c.PostId == request.PostId)
                .OrderByDescending(c => c.CreatedAtUtc);

            var totalCount = await query.CountAsync(cancellationToken);

            var comments = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            return new PaginatedCommentsDto
            {
                Items = comments,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };
        }
    }
}
