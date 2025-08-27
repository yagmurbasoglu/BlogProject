using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace BlogProject.Application.Features.Posts.Commands.DeletePost
{
    public class DeletePostCommandHandler : IRequestHandler<DeletePostCommand, bool>
    {
        private readonly IUnitOfWork _uow;
        private readonly UserManager<ApplicationUser> _userManager;

        public DeletePostCommandHandler(IUnitOfWork uow, UserManager<ApplicationUser> userManager)
        {
            _uow = uow;
            _userManager = userManager;
        }

        public async Task<bool> Handle(DeletePostCommand request, CancellationToken cancellationToken)
        {
            var repo = _uow.Repository<Post>();
            var post = await repo.FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted);

            if (post == null) return false;

            // istek yapan kullanıcı
            var requester = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (requester == null) return false;

            // admin mi kontrol et
            var isAdmin = await _userManager.IsInRoleAsync(requester, "Admin");

            // eğer postun sahibi değilse ve admin değilse → yetkisiz
            if (post.AuthorId != request.UserId && !isAdmin)
                return false;

            // soft delete
            post.IsDeleted = true;
            post.DeletedAtUtc = DateTime.UtcNow;

            repo.Update(post);
            await _uow.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
