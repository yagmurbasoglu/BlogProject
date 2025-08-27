using BlogProject.Application.Features.Comments.Commands.CreateComment;
using BlogProject.Application.Features.Comments.Queries.GetByPostId;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BlogProject.Application.Features.Comments.Commands.UpdateComment;
using BlogProject.Application.Features.Comments.Commands.DeleteComment;
using System.Security.Claims;

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
    [HttpPut("{commentId}")]
    [Authorize]
    public async Task<IActionResult> Update(
        [FromRoute(Name = "commentId")] Guid commentId,
        [FromBody] UpdateCommentCommand command)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);


        command.Id = commentId;
        command.AuthorId = userId;

        var success = await _mediator.Send(command);

        return success
            ? Ok(new { Message = "Yorum güncellendi" })
            : Forbid("Yorumu güncelleyemezsin");
    }



    // ✅ Delete
    [HttpDelete("{commentId}")]
    [Authorize]
    public async Task<IActionResult> Delete(
        [FromRoute(Name = "commentId")] Guid commentId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        ;

        var command = new DeleteCommentCommand
        {
            Id = commentId,
            AuthorId = userId
        };

        var success = await _mediator.Send(command);

        return success
            ? Ok(new { Message = "Yorum silindi" })
            : Forbid("Yorumu silemezsin");
    }


}
