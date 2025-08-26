using MediatR;
using System.ComponentModel.DataAnnotations;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Serialization;

namespace BlogProject.Application.Features.Posts.Commands.DeletePost;

public class DeletePostCommand : IRequest<bool>
{
    [SwaggerSchema("Silinecek post'un Id'si")]
    public Guid Id { get; set; }

    // 🔒 Swagger'da gözükmeyecek, ama controller/handler içinde kullanılabilecek
    [JsonIgnore]
    public Guid UserId { get; set; }
}
