using System.Text.Json;
using IniciativasRPG.Api.Services;

namespace IniciativasRPG.Api.Middleware;

public class DomainExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DomainExceptionMiddleware> _logger;

    public DomainExceptionMiddleware(RequestDelegate next, ILogger<DomainExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainException ex)
        {
            var level = ex.StatusCode >= 500 ? LogLevel.Error : LogLevel.Warning;
            _logger.Log(level, "DomainException {StatusCode}: {Message}", ex.StatusCode, ex.Message);

            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/json";
            var payload = JsonSerializer.Serialize(new { error = ex.Message });
            await context.Response.WriteAsync(payload);
        }
    }
}
