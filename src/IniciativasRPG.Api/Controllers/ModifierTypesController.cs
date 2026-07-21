using IniciativasRPG.Api.Contracts;
using IniciativasRPG.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IniciativasRPG.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/modifier-types")]
public class ModifierTypesController : ControllerBase
{
    private readonly IModifierTypeService _service;

    public ModifierTypesController(IModifierTypeService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ModifierTypeDto>>> List(CancellationToken ct) =>
        Ok(await _service.ListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<ModifierTypeDto>> Create([FromBody] CreateModifierTypeRequest request, CancellationToken ct)
    {
        var created = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ModifierTypeDto>> Update(Guid id, [FromBody] UpdateModifierTypeRequest request, CancellationToken ct) =>
        Ok(await _service.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return NoContent();
    }
}
