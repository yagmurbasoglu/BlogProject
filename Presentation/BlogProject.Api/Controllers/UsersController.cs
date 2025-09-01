using BlogProject.Domain.Entities;
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

    }
}
