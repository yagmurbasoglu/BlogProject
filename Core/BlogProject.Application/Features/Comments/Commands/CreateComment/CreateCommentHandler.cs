using AutoMapper;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;
using BlogProject.Application.Common.Exceptions;

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

        if (string.IsNullOrWhiteSpace(request.Content))
            throw new AppValidationException("Comment content cannot be empty");

        // Request → Entity mapping
        var comment = _mapper.Map<Comment>(request);
        comment.CreatedAtUtc = DateTime.UtcNow;

        await _uow.Repository<Comment>().AddAsync(comment, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return comment.Id;
    }
}