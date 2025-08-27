using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace BlogProject.Application.Features.Comments.Commands.DeleteComment
{
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
                return false;

            // İstek yapan user
            var requester = await _userManager.FindByIdAsync(request.AuthorId.ToString());
            if (requester == null) return false;

            // Admin mi?
            var isAdmin = await _userManager.IsInRoleAsync(requester, "Admin");

            // Eğer yorumun sahibi değilse ve admin değilse → yetkisiz
            if (comment.AuthorId != request.AuthorId && !isAdmin)
                return false;

            comment.IsDeleted = true;

            repo.Update(comment);
            await _uow.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
