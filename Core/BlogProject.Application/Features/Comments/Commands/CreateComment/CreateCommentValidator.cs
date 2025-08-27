using FluentValidation;

namespace BlogProject.Application.Features.Comments.Commands.CreateComment;

public class CreateCommentValidator : AbstractValidator<CreateCommentCommand>
{
    public CreateCommentValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Yorum boş olamaz")
            .MinimumLength(3).WithMessage("Yorum en az 3 karakter olmalı");

        RuleFor(x => x.PostId)
            .NotEmpty().WithMessage("Post Id gerekli");
    }
}
