using MediatR;

namespace BlogProject.Application.Features.Comments.Queries.GetByPostId;

public class GetCommentsByPostIdQuery : IRequest<List<CommentDto>>
{
    public Guid PostId { get; set; }
}
