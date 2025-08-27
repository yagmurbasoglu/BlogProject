using MediatR;
using System.Text.Json.Serialization;

namespace BlogProject.Application.Features.Comments.Commands.UpdateComment;

public class UpdateCommentCommand : IRequest<bool>
{
    [JsonIgnore] // Body’de gözükmesin
    public Guid Id { get; set; }          // Hangi yorum güncellenecek
    [JsonIgnore] // Body’de gözükmesin
    public Guid AuthorId { get; set; }    // Sadece kendi yorumunu güncelleyebilsin
    public string Content { get; set; } = string.Empty;
}
