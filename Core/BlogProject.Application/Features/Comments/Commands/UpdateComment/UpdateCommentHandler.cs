using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

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
                return false;

            // İstek yapan user
            var requester = await _userManager.FindByIdAsync(request.AuthorId.ToString());
            if (requester == null) return false;

            // Admin mi?
            var isAdmin = await _userManager.IsInRoleAsync(requester, "Admin");

            // Eğer yorumun sahibi değilse ve admin değilse → yetkisiz
            if (comment.AuthorId != request.AuthorId && !isAdmin)
                return false;

            comment.Content = request.Content;
            comment.CreatedAtUtc = DateTime.UtcNow;

            repo.Update(comment);
            await _uow.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
