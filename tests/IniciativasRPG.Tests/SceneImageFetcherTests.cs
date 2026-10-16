using FluentAssertions;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using Microsoft.Extensions.Logging;

namespace IniciativasRPG.Tests;

public class SceneImageFetcherTests
{
    private readonly CapturingLogger _logger = new();

    [Fact]
    public async Task Fetch_RemoteForbidden_LogsUnavailable_ThrowsLinkFailed()
    {
        var sut = Create(new StubHandler(status: 403, body: []));

        var act = () => sut.FetchAsync("https://cdn.example/map.png");

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SceneImageLinkFailed);
        _logger.Warnings.Should().Contain(line =>
            line.Contains(SceneImageLog.RemoteUnavailable) && line.Contains("403"));
        _logger.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Fetch_NetworkFailure_LogsUnavailable_ThrowsLinkFailed()
    {
        var sut = Create(new StubHandler(error: new HttpRequestException("recusou")));

        var act = () => sut.FetchAsync("https://cdn.example/map.png");

        (await act.Should().ThrowAsync<DomainException>())
            .WithMessage(DomainMessages.SceneImageLinkFailed);
        _logger.Warnings.Should().Contain(line => line.Contains(SceneImageLog.RemoteUnavailable));
        _logger.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Fetch_UnexpectedFailure_LogsInternal_Rethrows()
    {
        var sut = Create(new StubHandler(error: new InvalidOperationException("estado inválido")));

        var act = () => sut.FetchAsync("https://cdn.example/map.png");

        await act.Should().ThrowAsync<InvalidOperationException>();
        _logger.Errors.Should().Contain(line => line.Contains(SceneImageLog.InternalFailure));
        _logger.Warnings.Should().BeEmpty();
    }

    private SceneImageFetcher Create(HttpMessageHandler handler)
    {
        var http = new HttpClient(handler);
        return new SceneImageFetcher(http, _logger);
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly int _status;
        private readonly byte[] _body;
        private readonly Exception? _error;

        public StubHandler(int status = 200, byte[]? body = null, Exception? error = null)
        {
            _status = status;
            _body = body ?? [];
            _error = error;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (_error is not null)
            {
                throw _error;
            }

            var response = new HttpResponseMessage((System.Net.HttpStatusCode)_status)
            {
                Content = new ByteArrayContent(_body),
            };
            return Task.FromResult(response);
        }
    }

    private sealed class CapturingLogger : ILogger<SceneImageFetcher>
    {
        public List<string> Warnings { get; } = [];
        public List<string> Errors { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            var line = formatter(state, exception);
            if (logLevel == LogLevel.Warning)
            {
                Warnings.Add(line);
            }
            else if (logLevel >= LogLevel.Error)
            {
                Errors.Add(line);
            }
        }
    }
}
