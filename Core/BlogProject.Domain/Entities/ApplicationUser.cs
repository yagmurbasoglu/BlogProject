using BlogProject.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace BlogProject.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    // Görünen ad (zorunlu değil)
    public string? DisplayName { get; set; }

    // Kayıt tarihi
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigations
    public ICollection<Post> Posts { get; set; } = new List<Post>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<PostLike> Likes { get; set; } = new List<PostLike>();
}
