using BlogProject.Application.Features.PostLikes.Queries;
using MediatR;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Serialization;

namespace BlogProject.Application.Features.PostLikes.Commands.UnlikePost;

public class UnlikePostCommand : IRequest<PostLikeDto>
{
    [SwaggerSchema("Beğeniyi kaldırmak istediğiniz postun Id'si")]
    public Guid PostId { get; set; }

    [SwaggerSchema("Beğeniyi kaldıran kullanıcının Id'si (JWT'den gelecek)")]
    [JsonIgnore] // Body’de gözükmesin
    public Guid UserId { get; set; }
}
