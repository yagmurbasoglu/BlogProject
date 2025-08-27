using MediatR;

namespace BlogProject.Application.Features.PostLikes.Commands.UnlikePost;

public class UnlikePostCommand : IRequest<bool>
{
    public Guid PostId { get; set; }
    public Guid UserId { get; set; } // JWT’den gelecek
}
