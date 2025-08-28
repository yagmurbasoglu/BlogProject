using BlogProject.Application.Features.Categories.Queries;
using MediatR;

namespace BlogProject.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommand : IRequest<CategoryDto>
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
