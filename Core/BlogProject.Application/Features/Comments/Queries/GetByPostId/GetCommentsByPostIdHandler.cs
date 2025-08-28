using AutoMapper;
using BlogProject.Application.Interfaces;
using BlogProject.Application.Features.Comments.Queries;
using MediatR;
using BlogProject.Domain.Entities;

namespace BlogProject.Application.Features.Comments.Queries.GetByPostId;

public class GetCommentsByPostIdHandler : IRequestHandler<GetCommentsByPostIdQuery, List<CommentDto>>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public GetCommentsByPostIdHandler(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<List<CommentDto>> Handle(GetCommentsByPostIdQuery request, CancellationToken cancellationToken)
    {
        var comments = await _uow.Repository<Comment>()
            .ListAsync(c => c.PostId == request.PostId && !c.IsDeleted, true, cancellationToken);

        // AutoMapper + OrderBy
        return _mapper.Map<List<CommentDto>>(
            comments.OrderByDescending(c => c.CreatedAtUtc).ToList()
        );
    }
}
