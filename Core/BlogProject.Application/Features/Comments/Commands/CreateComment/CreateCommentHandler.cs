using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Comments.Commands.CreateComment;

public class CreateCommentHandler : IRequestHandler<CreateCommentCommand, Guid>
{
    private readonly IUnitOfWork _uow;

    public CreateCommentHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Guid> Handle(CreateCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = new Comment
        {
            PostId = request.PostId,
            AuthorId = request.AuthorId,
            Content = request.Content
        };

        await _uow.Repository<Comment>().AddAsync(comment, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return comment.Id;
    }
}
