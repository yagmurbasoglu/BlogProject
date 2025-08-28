using BlogProject.Application.Common.Exceptions;
using BlogProject.Application.Features.Categories.Queries;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, CategoryDto>
{
    private readonly IUnitOfWork _uow;

    public UpdateCategoryCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<CategoryDto> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<Category>();
        var category = await repo.GetByIdAsync(request.Id, false, cancellationToken);

        if (category == null)
            throw new NotFoundException("Category not found");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new AppValidationException("Category name cannot be empty");

        category.Name = request.Name;

        repo.Update(category);
        await _uow.SaveChangesAsync(cancellationToken);

        return new CategoryDto { Id = category.Id, Name = category.Name };
    }
}
