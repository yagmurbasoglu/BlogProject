using BlogProject.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Persistence.Seed
{
    public static class AppDbContextSeed
    {
        public static async Task SeedSuperAdminAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            IConfiguration config)
        {
            // Config’den SuperAdmin bilgilerini oku
            var email = config["SuperAdmin:Email"];
            var username = config["SuperAdmin:UserName"];
            var password = config["SuperAdmin:Password"];

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                return; // Config eksikse seed etme

            // Rolleri ekle
            string[] roles = new[] { "SuperAdmin", "Admin", "User" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole<Guid>(role));
                }
            }

            // SuperAdmin kullanıcı oluştur
            var superAdminUser = await userManager.FindByEmailAsync(email);
            if (superAdminUser == null)
            {
                var user = new ApplicationUser
                {
                    UserName = username,
                    Email = email,
                    DisplayName = "Super Admin",
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, password);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "SuperAdmin");
                }
            }
        }

        public static async Task SeedDeletedCommentsAsync(AppDbContext context)
        {
            // Silinmiş gönderilere bağlı yorumları bul
            var orphanedComments = await context.Comments
                .Where(c => !c.IsDeleted && context.Posts.Any(p => p.Id == c.PostId && p.IsDeleted))
                .ToListAsync();

            if (orphanedComments.Count > 0)
            {
                foreach (var comment in orphanedComments)
                {
                    comment.IsDeleted = true;
                }

                await context.SaveChangesAsync();
            }
        }

    }
}
