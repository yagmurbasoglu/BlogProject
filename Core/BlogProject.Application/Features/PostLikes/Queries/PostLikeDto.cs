using Swashbuckle.AspNetCore.Annotations;

namespace BlogProject.Application.Features.PostLikes.Queries;

public class PostLikeDto
{
    [SwaggerSchema("Beğeni Id'si")]
    public Guid Id { get; set; }

    [SwaggerSchema("Beğenilen post Id'si")]
    public Guid PostId { get; set; }

    [SwaggerSchema("Beğenen kullanıcı Id'si")]
    public Guid UserId { get; set; }

    [SwaggerSchema("Beğeni tarihi (UTC)")]
    public DateTime CreatedAtUtc { get; set; }
}
