using AutoMapper;
using BlogProject.Domain.Entities;
using BlogProject.Application.Features.Posts.Queries.GetAllPosts;
using BlogProject.Application.Features.Posts.Queries.GetPostById;
using BlogProject.Application.Features.Comments.Queries;
using BlogProject.Application.Features.Comments.Commands.CreateComment;
using BlogProject.Application.Features.Comments.Commands.UpdateComment;
using BlogProject.Application.Features.Posts.Commands.CreatePost;
using BlogProject.Application.Features.Posts.Commands.UpdatePost;
using BlogProject.Application.Features.Categories.Queries;
using BlogProject.Application.Features.PostLikes.Queries;

namespace BlogProject.Application.Common.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Comment, CommentDto>();
            CreateMap<CreateCommentCommand, Comment>();
            CreateMap<UpdateCommentCommand, Comment>();
            CreateMap<Category, CategoryDto>();
            CreateMap<PostLike, PostLikeDto>();

        }
    }

}
