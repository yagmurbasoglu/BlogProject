using MediatR;

namespace BlogProject.Application.Features.Auth.Commands.Register
{
    // Kullanıcıdan gelecek bilgiler
    public class RegisterCommand : IRequest<Guid>
    {
        public string UserName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string Password { get; set; } = default!;
    }
}
