using BlogProject.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using BlogProject.Api.DTOs;
using BlogProject.Persistence;
using System.Security.Claims;

namespace BlogProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _context;

        public UsersController(UserManager<ApplicationUser> userManager , AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // GET api/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound();

            var roles = await _userManager.GetRolesAsync(user);

            var postCount = await _context.Posts
                .CountAsync(p => p.AuthorId == id && !p.IsDeleted);

            var commentCount = await _context.Comments
                .CountAsync(c => c.AuthorId == id && !c.IsDeleted);

            var totalViews = await _context.Posts
                .Where(p => p.AuthorId == id && !p.IsDeleted)
                .SumAsync(p => (int?)p.ViewCount ?? 0);

            return Ok(new
            {
                user.Id,
                user.UserName,
                user.DisplayName,
                user.Email,
                CreatedAt = user.CreatedAtUtc,
                Roles = roles,
                Statistics = new
                {
                    PostCount = postCount,
                    CommentCount = commentCount,
                    TotalViews = totalViews
                }
            });
        }

        // GET api/users/admins
        [HttpGet("admins")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetAdmins()
        {
            var users = _userManager.Users.ToList();
            var admins = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains("Admin"))
                {
                    admins.Add(new
                    {
                        user.Id,
                        user.UserName,
                        user.DisplayName,
                        user.Email
                    });
                }
            }

            return Ok(admins);
        }

        // ✅ Admin sil (SuperAdmin → Admin rolünü kaldırır)
        [HttpDelete("remove-admin/{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> RemoveAdmin(Guid id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound(new { Message = "Kullanıcı bulunamadı." });

            var roles = await _userManager.GetRolesAsync(user);
            if (!roles.Contains("Admin"))
                return BadRequest(new { Message = "Bu kullanıcı zaten Admin değil." });

            var result = await _userManager.RemoveFromRoleAsync(user, "Admin");

            if (!result.Succeeded)
                return BadRequest(new { Message = "Admin rolü kaldırılamadı." });

            return Ok(new { Message = "Kullanıcı Admin rolünden çıkarıldı." });
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound(new { message = "Kullanıcı bulunamadı" });

            // 🚫 SuperAdmin ise güncelleme engellensin
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("SuperAdmin"))
            {
                return BadRequest(new { message = "Super Admin bilgileri değiştirilemez ❌" });
            }

            // Normal update devam
            if (!string.IsNullOrEmpty(dto.UserName))
                user.UserName = dto.UserName;

            if (!string.IsNullOrEmpty(dto.Email))
                user.Email = dto.Email;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new
            {
                message = "Kullanıcı güncellendi ✅",
                user = new
                {
                    user.Id,
                    user.UserName,
                    user.Email
                }
            });
        }

        // Kullanıcının gönderilerini getir
        [HttpGet("{id}/posts")]
        public async Task<IActionResult> GetUserPosts(Guid id)
        {
            var posts = await _context.Posts
                .Where(p => p.AuthorId == id && !p.IsDeleted)
                .Include(p => p.Category)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.Content,
                    p.ViewCount,
                    p.CreatedAtUtc,
                    CategoryName = p.Category != null ? p.Category.Name : null
                })
                .ToListAsync();

            return Ok(posts);
        }

        // Kullanıcının yorumlarını getir
        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetUserComments(Guid id)
        {
            var comments = await _context.Comments
                .Where(c => c.AuthorId == id && !c.IsDeleted && !c.Post.IsDeleted) // ✅ Post silinmişse de getirme
                .Include(c => c.Post)
                .Select(c => new
                {
                    c.Id,
                    c.Content,
                    c.CreatedAtUtc,
                    PostId = c.Post.Id,
                    PostTitle = c.Post.Title
                })
                .ToListAsync();

            return Ok(comments);
        }

        //şifre değiştirme
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
        {
            if (model.NewPassword != model.ConfirmNewPassword)
                return BadRequest("Yeni şifreler eşleşmiyor.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return Unauthorized("Kullanıcı bulunamadı.");

            // Mevcut şifre doğru mu kontrol et
            var passwordCheck = await _userManager.CheckPasswordAsync(user, model.CurrentPassword);
            if (!passwordCheck)
                return BadRequest("Mevcut şifre yanlış.");

            // Yeni şifreyi güncelle
            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok("Şifre başarıyla güncellendi.");
        }


    }


}
