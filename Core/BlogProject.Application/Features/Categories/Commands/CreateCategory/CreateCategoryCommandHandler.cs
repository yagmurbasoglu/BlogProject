using BlogProject.Application.Common.Exceptions;
using BlogProject.Application.Features.Categories.Queries;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, CategoryDto>
{
    private readonly IUnitOfWork _uow;

    public CreateCategoryCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<CategoryDto> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new AppValidationException("Category name cannot be empty");

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = request.Name
        };

        await _uow.Repository<Category>().AddAsync(category, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name
        };
    }
}
