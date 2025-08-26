using MediatR;
using System.Collections.Generic;
using BlogProject.Domain.Entities;

namespace BlogProject.Application.Features.Posts.Queries.GetAllPosts
{
    public class GetAllPostsQuery : IRequest<List<Post>>
    {
    }
}
