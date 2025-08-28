using AutoMapper;
using BlogProject.Application.Common.Exceptions;
using BlogProject.Application.Features.PostLikes.Queries;
using BlogProject.Application.Interfaces;
using BlogProject.Domain.Entities;
using MediatR;

namespace BlogProject.Application.Features.PostLikes.Commands.LikePost;

public class LikePostHandler : IRequestHandler<LikePostCommand, PostLikeDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public LikePostHandler(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<PostLikeDto> Handle(LikePostCommand request, CancellationToken cancellationToken)
    {
        var repo = _uow.Repository<PostLike>();

        var exists = await repo.FirstOrDefaultAsync(
            l => l.PostId == request.PostId && l.UserId == request.UserId,
            null, true, cancellationToken);

        if (exists != null)
            throw new AppValidationException("You already liked this post");

        var like = new PostLike
        {
            PostId = request.PostId,
            UserId = request.UserId
        };

        await repo.AddAsync(like, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return _mapper.Map<PostLikeDto>(like);
    }
}
