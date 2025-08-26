using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Application.Features.Posts.Queries.GetAllPosts
{
    public class GetAllPostsQueryHandler : IRequestHandler<GetAllPostsQuery, List<Post>>
    {
        private readonly IUnitOfWork _uow;

        public GetAllPostsQueryHandler(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<List<Post>> Handle(GetAllPostsQuery request, CancellationToken cancellationToken)
        {
            return await _uow.Repository<Post>()
                             .ListAsync(x => !x.IsDeleted, true, cancellationToken);
        }
    }
}
