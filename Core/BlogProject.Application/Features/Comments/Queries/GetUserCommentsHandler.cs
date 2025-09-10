using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Application.Features.Comments.Queries
{
    public class GetUserCommentsHandler : IRequestHandler<GetUserCommentsQuery, List<CommentDto>>
    {
        private readonly IUnitOfWork _uow;

        public GetUserCommentsHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<List<CommentDto>> Handle(GetUserCommentsQuery request, CancellationToken cancellationToken)
        {
            var usersQuery = _uow.Repository<ApplicationUser>().Query();

            var comments = await _uow.Repository<Comment>().Query()
                .Where(c => c.AuthorId == request.UserId && !c.IsDeleted) // ✅ sadece silinmemişler
                .OrderByDescending(c => c.CreatedAtUtc)
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
                        IsDeleted = c.IsDeleted
                    }
                )
                .ToListAsync(cancellationToken);

            return comments;
        }
    }
}
