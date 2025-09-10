using MediatR;
using System;
using System.Collections.Generic;

namespace BlogProject.Application.Features.Comments.Queries
{
    public class GetUserCommentsQuery : IRequest<List<CommentDto>>
    {
        public Guid UserId { get; set; }
    }
}
