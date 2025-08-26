using BlogProject.Domain.Entities;
using BlogProject.Application.Interfaces;
using BlogProject.Application.Features.Categories.Queries;
using BlogProject.Application.Features.Categories.Commands.CreateCategory;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly IUnitOfWork _uow;

        public CategoriesController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        // ✅ GET ALL
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var categories = await _uow.Repository<Category>().ListAsync(ct: ct);

            var result = categories.Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name
            }).ToList();

            return Ok(result);
        }

        // ✅ CREATE
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CategoryCreateDto dto, CancellationToken ct)
        {
            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = dto.Name
            };

            await _uow.Repository<Category>().AddAsync(category, ct);
            await _uow.SaveChangesAsync(ct);

            return Ok(new CategoryDto { Id = category.Id, Name = category.Name });
        }
    }
}
