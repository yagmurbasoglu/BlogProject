using FluentValidation;

namespace BlogProject.Application.Features.Posts.Commands.CreatePost;

public class CreatePostValidator : AbstractValidator<CreatePostCommand>
{
    public CreatePostValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Başlık boş olamaz")
            .MaximumLength(200).WithMessage("Başlık 200 karakterden uzun olamaz");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("İçerik boş olamaz")
            .MinimumLength(10).WithMessage("İçerik en az 10 karakter olmalı");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Kategori seçilmelidir");
    }
}
