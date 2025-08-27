using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Posts.Queries.GetPostById;

public class GetPostByIdQueryHandler : IRequestHandler<GetPostByIdQuery, Post?>
{
    private readonly IUnitOfWork _uow;

    public GetPostByIdQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Post?> Handle(GetPostByIdQuery request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<Post>();
        var post = await repo.GetByIdAsync(request.Id, false, cancellationToken);

        if (post == null || post.IsDeleted)
            return null;

        // ✅ ViewCount artır
        post.ViewCount++;
        repo.Update(post);
        await _uow.SaveChangesAsync(cancellationToken);

        return post; // entity dönmeye devam ediyor
    }
}
