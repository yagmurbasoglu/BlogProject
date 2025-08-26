using MediatR;
using System.ComponentModel.DataAnnotations;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Serialization;

namespace BlogProject.Application.Features.Posts.Commands.UpdatePost;

public class UpdatePostCommand : IRequest<bool>
{  

    [JsonIgnore]
    [SwaggerSchema("Güncellenecek post'un Id'si")]
    public Guid Id { get; set; }

    // 🔒 Swagger'da gözükmeyecek, ama controller/handler içinde kullanılabilecek
    [JsonIgnore]
    public Guid UserId { get; set; }

    [SwaggerSchema("Yeni başlık (opsiyonel)")]
    public string Title { get; set; } = string.Empty;

    [SwaggerSchema("Yeni içerik (opsiyonel)")]
    public string Content { get; set; } = string.Empty;
}
