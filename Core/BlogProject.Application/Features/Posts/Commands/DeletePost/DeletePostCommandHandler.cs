using BlogProject.Application.Common.Exceptions;
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

            if (post == null)
                throw new NotFoundException("Post not found");

            // istek yapan kullanıcı
            var requester = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (requester == null)
                throw new UnauthorizedException("User not found or unauthorized");

            // admin mi kontrol et
            var isAdmin = await _userManager.IsInRoleAsync(requester, "Admin");

            // eğer postun sahibi değilse ve admin değilse → yetkisiz
            if (post.AuthorId != request.UserId && !isAdmin)
                throw new UnauthorizedException("You are not allowed to delete this post");

            // soft delete
            post.IsDeleted = true;
            post.DeletedAtUtc = DateTime.UtcNow;

            repo.Update(post);
            await _uow.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
