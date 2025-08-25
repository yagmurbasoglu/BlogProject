using BlogProject.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<PostLike> PostLikes => Set<PostLike>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // Category (1) ─ (∞) Post 
        b.Entity<Category>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();

            //  Category.Posts  <-> Post.CategoryId
            e.HasMany(x => x.Posts)
             .WithOne(p => p.Category)
             .HasForeignKey(p => p.CategoryId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        //  User (1) ─ (∞) Post 
        b.Entity<Post>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();

            // User -> Posts  (ApplicationUser.Posts)  FK: Post.AuthorId
            e.HasOne<ApplicationUser>()                // Post tarafında User navigation yok, tek yön
             .WithMany(u => u.Posts)                   // inverse: ApplicationUser.Posts
             .HasForeignKey(p => p.AuthorId)           // FK alanını ZORUNLU belirt
             .OnDelete(DeleteBehavior.Restrict);       // yazar silinince postlar silinmesin
        });

        //  Post (1) ─ (∞) Comment 
        b.Entity<Comment>(e =>
        {
            e.Property(x => x.Content).IsRequired();

            // Post -> Comments  (Post.Comments)  FK: Comment.PostId
            e.HasOne(x => x.Post)
             .WithMany(p => p.Comments)
             .HasForeignKey(x => x.PostId)
             .OnDelete(DeleteBehavior.Cascade);

            // User -> Comments  (ApplicationUser.Comments)  FK: Comment.AuthorId
            e.HasOne<ApplicationUser>()
             .WithMany(u => u.Comments)
             .HasForeignKey(x => x.AuthorId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        //  Post (1) ─ (∞) Like 
        b.Entity<PostLike>(e =>
        {
            // bir kullanıcı bir postu 1 kez beğenir
            e.HasIndex(x => new { x.PostId, x.UserId }).IsUnique();

            // Post -> Likes  (Post.Likes)  FK: PostLike.PostId
            e.HasOne(x => x.Post)
             .WithMany(p => p.Likes)
             .HasForeignKey(x => x.PostId)
             .OnDelete(DeleteBehavior.Cascade);

            // User -> Likes  (ApplicationUser.Likes)  FK: PostLike.UserId
            e.HasOne<ApplicationUser>()
             .WithMany(u => u.Likes)
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }

}
