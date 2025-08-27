using FluentValidation;

namespace BlogProject.Application.Features.Auth.Commands.Register;

public class RegisterUserValidator : AbstractValidator<RegisterCommand>
{
    public RegisterUserValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email zorunludur")
            .EmailAddress().WithMessage("Geçerli bir email adresi giriniz");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Şifre zorunludur")
            .MinimumLength(6).WithMessage("Şifre en az 6 karakter olmalıdır");

        RuleFor(x => x.UserName)
            .NotEmpty().WithMessage("Kullanıcı adı zorunludur")
            .MinimumLength(3).WithMessage("Kullanıcı adı en az 3 karakter olmalıdır");
    }
}
