using BlogProject.Application.Common.Exceptions;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Posts.Commands.CreatePost
{
    public class CreatePostCommandHandler : IRequestHandler<CreatePostCommand, Guid>
    {
        private readonly IUnitOfWork _uow;

        public CreatePostCommandHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<Guid> Handle(CreatePostCommand request, CancellationToken cancellationToken)
        {

            if (string.IsNullOrWhiteSpace(request.Title))
                throw new AppValidationException("Post title cannot be empty");

            if (string.IsNullOrWhiteSpace(request.Content))
                throw new AppValidationException("Post content cannot be empty");


            var post = new Post
            {
                Id = Guid.NewGuid(),
                AuthorId = request.AuthorId,   // 👈 artık buradan geliyor
                CategoryId = request.CategoryId,
                Title = request.Title,
                Content = request.Content,
                CreatedAtUtc = DateTime.UtcNow,
                ViewCount = 0,
                IsDeleted = false
            };

            await _uow.Repository<Post>().AddAsync(post, cancellationToken);
            await _uow.SaveChangesAsync(cancellationToken);

            return post.Id;
        }
    }
}
