using AutoMapper;
using BlogProject.Application.Common.Exceptions;
using BlogProject.Application.Features.PostLikes.Queries;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.PostLikes.Commands.UnlikePost;

public class UnlikePostHandler : IRequestHandler<UnlikePostCommand, PostLikeDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public UnlikePostHandler(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<PostLikeDto> Handle(UnlikePostCommand request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<PostLike>();

        var like = await repo.FirstOrDefaultAsync(
            l => l.PostId == request.PostId && l.UserId == request.UserId,
            null, false, cancellationToken);

        if (like == null)
            throw new NotFoundException("Like not found for this user and post");

        repo.Remove(like);
        await _uow.SaveChangesAsync(cancellationToken);

        return _mapper.Map<PostLikeDto>(like);
    }
}
