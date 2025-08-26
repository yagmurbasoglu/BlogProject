using BlogProject.Application.Interfaces;
using BlogProject.Application.Features.Comments.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;
using BlogProject.Domain.Entities;

namespace BlogProject.Application.Features.Comments.Queries.GetByPostId;

public class GetCommentsByPostIdHandler : IRequestHandler<GetCommentsByPostIdQuery, List<CommentDto>>
{
    private readonly IUnitOfWork _uow;

    public GetCommentsByPostIdHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<CommentDto>> Handle(GetCommentsByPostIdQuery request, CancellationToken cancellationToken)
    {
        var comments = await _uow.Repository<Comment>()
            .ListAsync(c => c.PostId == request.PostId && !c.IsDeleted, true, cancellationToken);

        return comments
            .OrderByDescending(c => c.CreatedAtUtc) // en yeni en üstte
            .Select(c => new CommentDto
            {
                Id = c.Id,
                Content = c.Content,
                AuthorId = c.AuthorId,
                CreatedAtUtc = c.CreatedAtUtc
            })
            .ToList();
    }

}
