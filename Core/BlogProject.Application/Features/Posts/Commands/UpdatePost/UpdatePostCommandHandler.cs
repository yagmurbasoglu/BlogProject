using BlogProject.Application.Common.Exceptions;
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
                throw new NotFoundException("Post not found");

            // İstek yapan kullanıcı
            var requester = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (requester == null)
                throw new UnauthorizedException("User not found or unauthorized");

            // Admin mi?
            var isAdmin = await _userManager.IsInRoleAsync(requester, "Admin");

            // Eğer postun sahibi değilse ve admin değilse → yetkisiz
            if (post.AuthorId != request.UserId && !isAdmin)
                throw new UnauthorizedException("You are not allowed to update this post");

            if (string.IsNullOrWhiteSpace(request.Title))
                throw new AppValidationException("Title cannot be empty");

            if (string.IsNullOrWhiteSpace(request.Content))
                throw new AppValidationException("Content cannot be empty");
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
