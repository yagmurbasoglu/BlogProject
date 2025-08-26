using BlogProject.Application.Features.Comments.Commands.CreateComment;
using BlogProject.Application.Features.Comments.Queries.GetByPostId;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BlogProject.Application.Features.Comments.Commands.UpdateComment;
using BlogProject.Application.Features.Comments.Commands.DeleteComment;

namespace BlogProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ✅ Create Comment
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(CreateCommentCommand command)
    {
        var id = await _mediator.Send(command);
        return Ok(new { CommentId = id, Message = "Yorum başarıyla eklendi" });
    }

    // ✅ Get Comments by PostId
    [HttpGet("{postId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByPostId(Guid postId)
    {
        var result = await _mediator.Send(new GetCommentsByPostIdQuery { PostId = postId });
        return Ok(result);
    }

    // ✅ Update
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, UpdateCommentCommand command)
    {
        if (id != command.Id)
            return BadRequest("Id uyuşmuyor");

        var success = await _mediator.Send(command);
        return success ? Ok(new { Message = "Yorum güncellendi" })
                       : Forbid("Yorumu güncelleyemezsin");
    }

    // ✅ Delete
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] Guid authorId)
    {
        var command = new DeleteCommentCommand { Id = id, AuthorId = authorId };
        var success = await _mediator.Send(command);
        return success ? Ok(new { Message = "Yorum silindi" })
                       : Forbid("Yorumu silemezsin");
    }
}
