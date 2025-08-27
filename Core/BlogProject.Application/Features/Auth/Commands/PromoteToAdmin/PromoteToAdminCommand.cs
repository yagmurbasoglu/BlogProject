using MediatR;

namespace BlogProject.Application.Features.Auth.Commands.PromoteToAdmin;

public class PromoteToAdminCommand : IRequest<bool>
{
    public Guid UserId { get; set; }
}
