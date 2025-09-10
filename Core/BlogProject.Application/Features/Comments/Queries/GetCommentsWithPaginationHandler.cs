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
            var commentsQuery = _uow.Repository<Comment>().Query()
                .Where(c => c.PostId == request.PostId && !c.IsDeleted);

            var usersQuery = _uow.Repository<ApplicationUser>().Query();

            // toplam sayıyı al
            var totalCount = await commentsQuery.CountAsync(cancellationToken);

            // join ile comment + userName çek
            var comments = await commentsQuery
                .OrderByDescending(c => c.CreatedAtUtc)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Join(
                    usersQuery,
                    c => c.AuthorId,
                    u => u.Id,
                    (c, u) => new CommentDto
                    {
                        Id = c.Id,
                        Content = c.Content,
                        AuthorId = c.AuthorId,
                        CreatedAtUtc = c.CreatedAtUtc,
                        AuthorName = u.UserName,
                        IsDeleted = c.IsDeleted,
                    }
                )
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
