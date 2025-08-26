using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Posts.Queries.GetPostById
{
    public class GetPostByIdQueryHandler : IRequestHandler<GetPostByIdQuery, Post?>
    {
        private readonly IUnitOfWork _uow;

        public GetPostByIdQueryHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<Post?> Handle(GetPostByIdQuery request, CancellationToken cancellationToken)
        {
            return await _uow.Repository<Post>().GetByIdAsync(request.Id, true, cancellationToken);
        }
    }
}
