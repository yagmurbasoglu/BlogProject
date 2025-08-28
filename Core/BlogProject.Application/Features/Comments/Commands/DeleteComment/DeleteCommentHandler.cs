using BlogProject.Application.Common.Exceptions;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace BlogProject.Application.Features.Comments.Commands.DeleteComment;

public class DeleteCommentHandler : IRequestHandler<DeleteCommentCommand, bool>
{
    private readonly IUnitOfWork _uow;
    private readonly UserManager<ApplicationUser> _userManager;

    public DeleteCommentHandler(IUnitOfWork uow, UserManager<ApplicationUser> userManager)
    {
        _uow = uow;
        _userManager = userManager;
    }

    public async Task<bool> Handle(DeleteCommentCommand request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<Comment>();
        var comment = await repo.GetByIdAsync(request.Id, false, cancellationToken);

        if (comment == null || comment.IsDeleted)
            throw new NotFoundException("Comment not found");

        var requester = await _userManager.FindByIdAsync(request.AuthorId.ToString());
        if (requester == null)
            throw new UnauthorizedException("User not found or unauthorized");

        var isAdmin = await _userManager.IsInRoleAsync(requester, "Admin");

        if (comment.AuthorId != request.AuthorId && !isAdmin)
            throw new UnauthorizedException("You are not allowed to delete this comment");

        comment.IsDeleted = true;

        repo.Update(comment);
        await _uow.SaveChangesAsync(cancellationToken);

        return true;
    }
}
