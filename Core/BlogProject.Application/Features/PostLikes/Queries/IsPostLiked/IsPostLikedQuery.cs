using MediatR;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Serialization;

namespace BlogProject.Application.Features.PostLikes.Queries.IsPostLiked;

public class IsPostLikedQuery : IRequest<bool>
{
    [SwaggerSchema("Kontrol edilecek postun Id'si")]
    public Guid PostId { get; set; }

    [SwaggerSchema("Kontrol yapan kullanıcının Id'si (JWT'den gelecek)")]
    [JsonIgnore] // Body’de gözükmesin
    public Guid UserId { get; set; }
}
