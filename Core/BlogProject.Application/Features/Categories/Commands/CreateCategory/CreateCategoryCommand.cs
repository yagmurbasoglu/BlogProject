using BlogProject.Application.Features.Categories.Queries;
using MediatR;

namespace BlogProject.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommand : IRequest<CategoryDto>
{
    public string Name { get; set; } = string.Empty;
}
