using BlogProject.Application.Common.Exceptions;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace BlogProject.Application.Features.Auth.Commands.PromoteToAdmin;

public class PromoteToAdminHandler : IRequestHandler<PromoteToAdminCommand, bool>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public PromoteToAdminHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<bool> Handle(PromoteToAdminCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(request.UserId.ToString());
        if (user == null)
            throw new NotFoundException("User not found");


        var result = await _userManager.AddToRoleAsync(user, "Admin");
        return result.Succeeded;
    }
}
