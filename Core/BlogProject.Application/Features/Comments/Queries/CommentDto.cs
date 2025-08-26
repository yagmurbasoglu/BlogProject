using Swashbuckle.AspNetCore.Annotations;

namespace BlogProject.Application.Features.Comments.Queries;

public class CommentDto
{
    [SwaggerSchema("Yorum Id'si")]
    public Guid Id { get; set; }

    [SwaggerSchema("Yorum içeriği")]
    public string Content { get; set; } = string.Empty;

    [SwaggerSchema("Yorumu yapan kullanıcı Id'si")]
    public Guid AuthorId { get; set; }

    [SwaggerSchema("Yorumun yapıldığı tarih (UTC)")]
    public DateTime CreatedAtUtc { get; set; }
}
