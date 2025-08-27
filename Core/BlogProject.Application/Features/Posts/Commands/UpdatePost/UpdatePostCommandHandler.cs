using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace BlogProject.Application.Features.Posts.Commands.UpdatePost
{
    public class UpdatePostHandler : IRequestHandler<UpdatePostCommand, bool>
    {
        private readonly IUnitOfWork _uow;
        private readonly UserManager<ApplicationUser> _userManager;

        public UpdatePostHandler(IUnitOfWork uow, UserManager<ApplicationUser> userManager)
        {
            _uow = uow;
            _userManager = userManager;
        }

        public async Task<bool> Handle(UpdatePostCommand request, CancellationToken cancellationToken)
        {
            var repo = _uow.Repository<Post>();
            var post = await repo.GetByIdAsync(request.Id, false, cancellationToken);

            if (post == null || post.IsDeleted)
                return false;

            // İstek yapan kullanıcı
            var requester = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (requester == null) return false;

            // Admin mi?
            var isAdmin = await _userManager.IsInRoleAsync(requester, "Admin");

            // Eğer postun sahibi değilse ve admin değilse → yetkisiz
            if (post.AuthorId != request.UserId && !isAdmin)
                return false;

            // Güncelleme
            post.Title = request.Title;
            post.Content = request.Content;
            post.UpdatedAtUtc = DateTime.UtcNow;

            repo.Update(post);
            await _uow.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
