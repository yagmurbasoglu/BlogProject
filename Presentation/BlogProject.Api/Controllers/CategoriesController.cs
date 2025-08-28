using BlogProject.Application.Features.Categories.Commands.CreateCategory;
using BlogProject.Application.Features.Categories.Commands.UpdateCategory;
using BlogProject.Application.Features.Categories.Commands.DeleteCategory;
using BlogProject.Application.Features.Categories.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ✅ GET ALL
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _mediator.Send(new GetAllCategoriesQuery(), ct));

    // ✅ CREATE
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CategoryCreateDto dto, CancellationToken ct)
    {
        var command = new CreateCategoryCommand { Name = dto.Name };
        return Ok(await _mediator.Send(command, ct));
    }

    // ✅ UPDATE
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryCommand command, CancellationToken ct)
    {
        command.Id = id;
        return Ok(await _mediator.Send(command, ct));
    }

    // ✅ DELETE
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => Ok(await _mediator.Send(new DeleteCategoryCommand { Id = id }, ct));
}
