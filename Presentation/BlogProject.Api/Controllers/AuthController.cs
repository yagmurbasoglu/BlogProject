using BlogProject.Application.Features.Auth.Commands.Login;
using BlogProject.Application.Features.Auth.Commands.Register;
using BlogProject.Application.Features.Auth.Commands.PromoteToAdmin; // ✅ yeni ekledik
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterCommand command)
        {
            var userId = await _mediator.Send(command);
            return Ok(new { UserId = userId });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginCommand command)
        {
            var token = await _mediator.Send(command);
            return Ok(new { Token = token });
        }

        [HttpPost("promote-to-admin/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PromoteToAdmin(Guid userId)
        {
            var success = await _mediator.Send(new PromoteToAdminCommand { UserId = userId });

            if (!success)
                return NotFound(new { Message = "Kullanıcı bulunamadı veya rol atanamadı" });

            return Ok(new { Message = "Kullanıcı Admin rolüne yükseltildi" });
        }
    }
}
