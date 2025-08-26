using Swashbuckle.AspNetCore.Annotations;

namespace BlogProject.Application.Features.Categories.Queries;

public class CategoryDto
{
    [SwaggerSchema("Kategori Id'si ")]
    public Guid Id { get; set; }
    [SwaggerSchema("Kategori Adı ")]
    public string Name { get; set; } = string.Empty;
}
