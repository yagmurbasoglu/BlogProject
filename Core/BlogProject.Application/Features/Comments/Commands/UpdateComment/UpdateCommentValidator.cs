using FluentValidation;

namespace BlogProject.Application.Features.Comments.Commands.UpdateComment;

public class UpdateCommentValidator : AbstractValidator<UpdateCommentCommand>
{
    public UpdateCommentValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Yorum boş olamaz")
            .MinimumLength(3).WithMessage("Yorum en az 3 karakter olmalı");
    }
}
