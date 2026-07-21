using IniciativasRPG.Api.Contracts;
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

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SheetDto>>> List(CancellationToken ct)
    {
        return Ok(await _sheetService.ListAsync(ct));
    }

    [HttpPost]
    public async Task<ActionResult<SheetDto>> Create([FromBody] CreateSheetRequest request, CancellationToken ct)
    {
        var sheet = await _sheetService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), new { id = sheet.Id }, sheet);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SheetDto>> Update(Guid id, [FromBody] UpdateSheetRequest request, CancellationToken ct)
    {
        return Ok(await _sheetService.UpdateAsync(id, request, ct));
    }
}
