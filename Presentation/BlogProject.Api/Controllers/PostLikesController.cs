using BlogProject.Application.Features.PostLikes.Commands.LikePost;
using BlogProject.Application.Features.PostLikes.Commands.UnlikePost;
using BlogProject.Application.Features.PostLikes.Queries.GetPostLikes;
using BlogProject.Application.Features.PostLikes.Queries.IsPostLiked;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;

namespace BlogProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PostLikesController : ControllerBase
{
    private readonly IMediator _mediator;

    public PostLikesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("like")]
    [SwaggerOperation(
        Summary = "Bir gönderiyi beğen",
        Description = "Kullanıcı JWT’den alınan kimliğiyle belirttiği gönderiyi (PostId) beğenir."
    )]
    public async Task<IActionResult> Like([FromBody] LikePostCommand command, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        command.UserId = userId; // JWT’den doldur
        return Ok(await _mediator.Send(command, ct));
    }

    [HttpPost("unlike")]
    [SwaggerOperation(
        Summary = "Bir gönderinin beğenisini kaldır",
        Description = "Kullanıcı JWT’den alınan kimliğiyle daha önce beğendiği gönderinin beğenisini kaldırır."
    )]
    public async Task<IActionResult> Unlike([FromBody] UnlikePostCommand command, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        command.UserId = userId; // JWT’den doldur
        return Ok(await _mediator.Send(command, ct));
    }

    [HttpGet("{postId}/isLiked")]
    [SwaggerOperation(
        Summary = "Kullanıcı bu gönderiyi beğendi mi?",
        Description = "JWT’den alınan kullanıcı Id’si ile verilen PostId kontrol edilir. True/False döner."
    )]
    public async Task<IActionResult> IsLiked(Guid postId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return Ok(await _mediator.Send(new IsPostLikedQuery { PostId = postId, UserId = userId }, ct));
    }

    [HttpGet("{postId}")]
    [AllowAnonymous]
    [SwaggerOperation(
        Summary = "Bir gönderinin tüm beğenilerini listele",
        Description = "Verilen PostId için tüm kullanıcıların beğeni kayıtlarını döner."
    )]
    public async Task<IActionResult> GetLikes(Guid postId, CancellationToken ct)
        => Ok(await _mediator.Send(new GetPostLikesQuery { PostId = postId }, ct));
}
