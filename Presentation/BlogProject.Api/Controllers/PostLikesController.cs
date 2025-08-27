using BlogProject.Application.Features.PostLikes.Commands.LikePost;
using BlogProject.Application.Features.PostLikes.Commands.UnlikePost;
using BlogProject.Application.Features.PostLikes.Queries.GetPostLikes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PostLikesController : ControllerBase
{
    private readonly IMediator _mediator;

    public PostLikesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ✅ Post beğen
    [HttpPost("{postId}/like")]
    [Authorize]
    public async Task<IActionResult> Like([FromRoute(Name = "postId")] Guid postId)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);


        var success = await _mediator.Send(new LikePostCommand
        {
            PostId = postId,
            UserId = userId
        });

        return success
            ? Ok(new { Message = "Post beğenildi" })
            : BadRequest(new { Message = "Zaten beğenmişsiniz" });
    }

    // ✅ Post beğenisini kaldır
    [HttpDelete("{postId}/unlike")]
    [Authorize]
    public async Task<IActionResult> Unlike([FromRoute(Name = "postId")] Guid postId)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);


        var success = await _mediator.Send(new UnlikePostCommand
        {
            PostId = postId,
            UserId = userId
        });

        return success
            ? Ok(new { Message = "Beğeni kaldırıldı" })
            : BadRequest(new { Message = "Beğeni bulunamadı" });
    }

    // ✅ Postun toplam beğeni sayısını getir
    [HttpGet("{postId}/count")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLikesCount([FromRoute(Name = "postId")] Guid postId)
    {
        var count = await _mediator.Send(new GetPostLikesQuery { PostId = postId });
        return Ok(new { PostId = postId, Likes = count });
    }
}
