using BlogProject.Application.Features.Comments.Commands.CreateComment;
using BlogProject.Application.Features.Comments.Queries.GetByPostId;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BlogProject.Application.Features.Comments.Commands.UpdateComment;
using BlogProject.Application.Features.Comments.Commands.DeleteComment;
using System.Security.Claims;
using BlogProject.Application.Features.Comments.Queries;
using Microsoft.EntityFrameworkCore;
using BlogProject.Persistence;

namespace BlogProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly AppDbContext _context;

    public CommentsController(IMediator mediator, AppDbContext context)
    {
        _mediator = mediator;
        _context = context; 
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

    [HttpGet("{postId:guid}/paged")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPaged(Guid postId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 5)
    {
        var result = await _mediator.Send(new GetCommentsWithPaginationQuery
        {
            PostId = postId,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
        return Ok(result);
    }
    // ✅ Admin tüm yorumları görebilir
    [HttpGet("all")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetAllComments()
    {
        var comments = await _context.Comments
            .Where(c => !c.IsDeleted) // sadece aktif yorumlar
            .Include(c => c.Post)     // yoruma ait post
            .Select(c => new
            {
                c.Id,
                c.Content,
                c.CreatedAtUtc,
                PostId = c.Post.Id,
                PostTitle = c.Post.Title,
            })
            .ToListAsync();

        return Ok(comments);
    }

    // ✅ Admin istediği yorumu silebilir (soft delete)
    [HttpDelete("admin/{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == id);

        if (comment == null || comment.IsDeleted)
            return NotFound(new { message = "Yorum bulunamadı." });

        comment.IsDeleted = true;              // ❌ Soft delete
        await _context.SaveChangesAsync();

        return Ok(new { message = "Yorum silindi ✅" });
    }


}
