using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Application.Features.Posts.Queries
{
    public class GetPostsWithPaginationHandler : IRequestHandler<GetPostsWithPaginationQuery, PaginatedPostsDto>
    {
        private readonly IUnitOfWork _uow;

        public GetPostsWithPaginationHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<PaginatedPostsDto> Handle(GetPostsWithPaginationQuery request, CancellationToken cancellationToken)
        {
            var repo = _uow.Repository<Post>();

            // ❌ var query = repo.GetAll().OrderByDescending(x => x.CreatedAt);
            // ✅ Doğru kullanım:
            var query = repo.Query()
    .Where(x => x.DeletedAtUtc == null)
    .OrderByDescending(x => x.CreatedAtUtc);


            var totalCount = await query.CountAsync(cancellationToken);

            var posts = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            return new PaginatedPostsDto
            {
                Items = posts,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };
        }

    }
}
