using Swashbuckle.AspNetCore.Annotations;

namespace BlogProject.Application.Features.Categories.Commands.CreateCategory;

public class CategoryCreateDto
{
    [SwaggerSchema("Kategori Adı")]
    public string Name { get; set; } = string.Empty;
}
