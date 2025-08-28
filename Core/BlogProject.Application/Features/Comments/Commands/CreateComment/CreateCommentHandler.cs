using AutoMapper;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.Comments.Commands.CreateComment;

public class CreateCommentHandler : IRequestHandler<CreateCommentCommand, Guid>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public CreateCommentHandler(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<Guid> Handle(CreateCommentCommand request, CancellationToken cancellationToken)
    {
        // Request → Entity mapping
        var comment = _mapper.Map<Comment>(request);
        comment.CreatedAtUtc = DateTime.UtcNow;

        await _uow.Repository<Comment>().AddAsync(comment, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return comment.Id;
    }
}