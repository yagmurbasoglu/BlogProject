using BlogProject.Application;
using BlogProject.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using FluentValidation.AspNetCore;
using BlogProject.Application.Features.Posts.Commands.CreatePost;
using Microsoft.AspNetCore.Identity;
using BlogProject.Domain.Entities;
using BlogProject.Application.Common.Mapping;
using Microsoft.Extensions.DependencyInjection;
using BlogProject.Api.Middleware;
using FluentValidation;
using BlogProject.Persistence.Seed;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddFluentValidation(fv =>
    {
        fv.ImplicitlyValidateChildProperties = true;
    });

builder.Services.AddValidatorsFromAssemblyContaining<Program>(); // ✅ yeni


// Controllers
builder.Services.AddControllers();

//AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);


// Application katmanı servislerini ekle
builder.Services.AddApplication();

// Persistence (DbContext + Identity) ekle
builder.Services.AddPersistence(builder.Configuration);

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();


// Swagger + JWT config
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.EnableAnnotations(); // Açıklamaları aktif et

    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BlogProject.Api",
        Version = "v1"
    });

    // 🔑 JWT tanımı
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Token giriniz: Bearer {token}"
    });

    // 🔑 Global security requirement
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();


// ✅ Rolleri ve SuperAdmin’i seed et
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var config = services.GetRequiredService<IConfiguration>();
    var context = services.GetRequiredService<AppDbContext>();

    // SuperAdmin kullanıcı seed
    await AppDbContextSeed.SeedSuperAdminAsync(userManager, roleManager,config);
    await AppDbContextSeed.SeedDeletedCommentsAsync(context);
}


// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
