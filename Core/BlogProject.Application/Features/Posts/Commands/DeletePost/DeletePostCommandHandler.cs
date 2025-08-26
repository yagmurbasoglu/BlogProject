using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Posts.Commands.DeletePost
{
    public class DeletePostCommandHandler : IRequestHandler<DeletePostCommand, bool>
    {
        private readonly IUnitOfWork _uow;

        public DeletePostCommandHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> Handle(DeletePostCommand request, CancellationToken cancellationToken)
        {
            var repo = _uow.Repository<Post>();
            var post = await repo.FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted);

            if (post == null || post.AuthorId != request.UserId)
                return false;

            post.IsDeleted = true;
            post.DeletedAtUtc = DateTime.UtcNow;

            repo.Update(post);
            await _uow.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
