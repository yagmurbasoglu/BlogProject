using BlogProject.Application.Common.Exceptions;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Categories.Commands.DeleteCategory;

public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, bool>
{
    private readonly IUnitOfWork _uow;

    public DeleteCategoryCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<bool> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<Category>();
        var category = await repo.GetByIdAsync(request.Id, false, cancellationToken);

        if (category == null)
            throw new NotFoundException("Category not found");

        repo.Remove(category);
        await _uow.SaveChangesAsync(cancellationToken);

        return true;
    }
}
