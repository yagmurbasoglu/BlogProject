using FluentValidation;

namespace BlogProject.Application.Features.Auth.Commands.Login;

public class LoginUserValidator : AbstractValidator<LoginCommand>
{
    public LoginUserValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email zorunludur")
            .EmailAddress().WithMessage("Geçerli bir email adresi giriniz");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Şifre zorunludur");
    }
}
