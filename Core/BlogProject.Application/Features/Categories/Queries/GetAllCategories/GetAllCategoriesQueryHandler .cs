using BlogProject.Application.Interfaces;
using MediatR;

namespace BlogProject.Application.Features.Categories.Queries;

public class GetAllCategoriesQuery : IRequest<List<CategoryDto>> { }

public class GetAllCategoriesQueryHandler : IRequestHandler<GetAllCategoriesQuery, List<CategoryDto>>
{
    private readonly IUnitOfWork _uow;

    public GetAllCategoriesQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<CategoryDto>> Handle(GetAllCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _uow.Repository<Domain.Entities.Category>().ListAsync(ct: cancellationToken);

        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name
        }).ToList();
    }
}
