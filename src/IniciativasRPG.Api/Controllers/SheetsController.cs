using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Domain;
using IniciativasRPG.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IniciativasRPG.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/sheets")]
public class SheetsController : ControllerBase
{
    private readonly ISheetService _sheetService;

    public SheetsController(ISheetService sheetService)
    {
        _sheetService = sheetService;
    }

    private Guid CampaignId => User.GetRequiredCampaignId();

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SheetDto>>> List(CancellationToken ct) =>
        Ok(await _sheetService.ListAsync(CampaignId, ct));

    [HttpPost]
    public async Task<ActionResult<SheetDto>> Create([FromBody] CreateSheetRequest request, CancellationToken ct)
    {
        var sheet = await _sheetService.CreateAsync(CampaignId, request, ct);
        return CreatedAtAction(nameof(List), new { id = sheet.Id }, sheet);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SheetDto>> Update(Guid id, [FromBody] UpdateSheetRequest request, CancellationToken ct) =>
        Ok(await _sheetService.UpdateAsync(CampaignId, id, request, ct));

    [HttpPost("{id:guid}/image")]
    [RequestSizeLimit(SheetRules.MaxImageRequestBytes)]
    public async Task<ActionResult<SheetDto>> SetImage(Guid id, IFormFile file, CancellationToken ct)
    {
        if (file is null)
        {
            throw new DomainException(DomainMessages.SheetImageRequired);
        }

        return Ok(await _sheetService.SetImageAsync(CampaignId, id, file, ct));
    }

    [HttpDelete("{id:guid}/image")]
    public async Task<ActionResult<SheetDto>> ClearImage(Guid id, CancellationToken ct) =>
        Ok(await _sheetService.ClearImageAsync(CampaignId, id, ct));
}
