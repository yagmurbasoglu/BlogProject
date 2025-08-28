using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using BlogProject.Application.Common.Exceptions;

namespace BlogProject.Application.Features.Comments.Commands.UpdateComment
{
    public class UpdateCommentHandler : IRequestHandler<UpdateCommentCommand, bool>
    {
        private readonly IUnitOfWork _uow;
        private readonly UserManager<ApplicationUser> _userManager;

        public UpdateCommentHandler(IUnitOfWork uow, UserManager<ApplicationUser> userManager)
        {
            _uow = uow;
            _userManager = userManager;
        }

        public async Task<bool> Handle(UpdateCommentCommand request, CancellationToken cancellationToken)
        {
            var repo = _uow.Repository<Comment>();
            var comment = await repo.GetByIdAsync(request.Id, false, cancellationToken);

            if (comment == null || comment.IsDeleted)
                throw new NotFoundException("Comment not found");

            // İstek yapan user
            var requester = await _userManager.FindByIdAsync(request.AuthorId.ToString());
            if (requester == null)
                throw new UnauthorizedException("User not found or unauthorized");

            // Admin mi?
            var isAdmin = await _userManager.IsInRoleAsync(requester, "Admin");

            // Eğer yorumun sahibi değilse ve admin değilse → yetkisiz
            if (comment.AuthorId != request.AuthorId && !isAdmin)
                throw new UnauthorizedException("You are not allowed to update this comment");

            if (string.IsNullOrWhiteSpace(request.Content))
                throw new AppValidationException("Comment content cannot be empty");

            comment.Content = request.Content;
            comment.CreatedAtUtc = DateTime.UtcNow;

            repo.Update(comment);
            await _uow.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
