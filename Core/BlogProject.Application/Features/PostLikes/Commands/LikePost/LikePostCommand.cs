using MediatR;

namespace BlogProject.Application.Features.PostLikes.Commands.LikePost;

public class LikePostCommand : IRequest<bool>
{
    public Guid PostId { get; set; }
    public Guid UserId { get; set; } // JWT’den gelecek
}
