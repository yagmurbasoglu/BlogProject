using BlogProject.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BlogProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UsersController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        // GET api/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound();

            return Ok(new
            {
                user.Id,
                user.UserName,
                user.DisplayName,
                user.Email
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

    }
}
