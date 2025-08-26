using BlogProject.Application.Features.Posts.Commands.CreatePost;
using BlogProject.Application.Features.Posts.Commands.UpdatePost;
using BlogProject.Application.Features.Posts.Commands.DeletePost;
using BlogProject.Application.Features.Posts.Queries.GetAllPosts;
using BlogProject.Application.Features.Posts.Queries.GetPostById;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BlogProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PostsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PostsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // ✅ CREATE
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePostCommand command)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            command.AuthorId = Guid.Parse(userId); // AuthorId buradan set ediliyor

            var postId = await _mediator.Send(command);
            return Ok(new { PostId = postId });
        }

        // ✅ GET ALL
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var result = await _mediator.Send(new GetAllPostsQuery());
            return Ok(result);
        }

        // ✅ GET BY ID
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetPostByIdQuery { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }

        // ✅ UPDATE
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePostCommand command)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            command.Id = id;
            command.UserId = Guid.Parse(userId);

            var success = await _mediator.Send(command);
            if (!success) return Forbid();
            return NoContent();
        }

        // ✅ DELETE
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var success = await _mediator.Send(new DeletePostCommand { Id = id, UserId = Guid.Parse(userId) });
            if (!success) return Forbid();
            return NoContent();
        }
    }
}
