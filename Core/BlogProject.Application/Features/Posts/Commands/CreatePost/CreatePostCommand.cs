using MediatR;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Swashbuckle.AspNetCore.Annotations;

namespace BlogProject.Application.Features.Posts.Commands.CreatePost;

public class CreatePostCommand : IRequest<Guid>
{
    [SwaggerSchema("Kategori Id'si (Categories tablosundan seçilir)")]
    public Guid CategoryId { get; set; }

    [SwaggerSchema("Post başlığı")]
    public string Title { get; set; } = string.Empty;

    [SwaggerSchema("Post içeriği")]
    public string Content { get; set; } = string.Empty;

    // 🔒 Swagger'da gözükmeyecek, ama controller/handler içinde kullanılabilecek
    [JsonIgnore]
    public Guid AuthorId { get; set; }
}
