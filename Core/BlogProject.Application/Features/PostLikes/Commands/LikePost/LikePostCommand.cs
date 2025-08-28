using BlogProject.Application.Features.PostLikes.Queries;
using MediatR;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Serialization;

namespace BlogProject.Application.Features.PostLikes.Commands.LikePost;

public class LikePostCommand : IRequest<PostLikeDto>
{
    [SwaggerSchema("Beğenilen postun Id'si")]
    public Guid PostId { get; set; }

    [SwaggerSchema("Beğenen kullanıcının Id'si (JWT'den gelecek)")]
    [JsonIgnore] // Body’de gözükmesin
    public Guid UserId { get; set; }
}
