using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Application.Features.Posts.Commands.UpdatePost
{
    public class UpdatePostCommandHandler : IRequestHandler<UpdatePostCommand, bool>
    {
        private readonly IUnitOfWork _uow;

        public UpdatePostCommandHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> Handle(UpdatePostCommand request, CancellationToken cancellationToken)
        {
            var repo = _uow.Repository<Post>();
            var post = await repo.FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted);

            if (post == null || post.AuthorId != request.UserId)
                return false; // sadece sahibi güncelleyebilir

            post.Title = request.Title;
            post.Content = request.Content;
            post.UpdatedAtUtc = DateTime.UtcNow;

            repo.Update(post);
            await _uow.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
