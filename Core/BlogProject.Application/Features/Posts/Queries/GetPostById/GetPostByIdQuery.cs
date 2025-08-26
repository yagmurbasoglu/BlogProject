using MediatR;
using System.ComponentModel.DataAnnotations;
using BlogProject.Domain.Entities;

namespace BlogProject.Application.Features.Posts.Queries.GetPostById;

public class GetPostByIdQuery : IRequest<Post?>
{
    [Display(Name = "Post Id", Description = "Detayı görüntülenecek postun Id’si")]
    public Guid Id { get; set; }
}
