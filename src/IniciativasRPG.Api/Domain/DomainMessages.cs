namespace IniciativasRPG.Api.Domain;

public static class DomainMessages
{
    public const string NameRequired = "O nome é obrigatório.";
    public const string InvalidCredentials = "Usuário ou senha inválidos.";
    public const string SheetNotFound = "Ficha não encontrada.";
    public const string SheetInActiveBattle = "Esta ficha está em uma batalha ativa. Use as ações de combate (dano/cura/modificador).";
    public const string BattleNotFound = "Não há batalha em andamento.";
    public const string NotEnoughCombatants = "É necessário ao menos 2 combatentes na fila para iniciar a batalha.";
    public const string BattleAlreadyStarted = "A batalha já está iniciada.";
    public const string BattleNotActive = "A batalha não está ativa.";
    public const string PlayerAlreadyInBattle = "Este player já está na fila da batalha atual.";
    public const string SheetMustBePlayer = "A ficha selecionada deve ser do tipo player.";
    public const string SheetMustBeCreature = "A ficha selecionada deve ser do tipo criatura.";
    public const string CombatantNotFound = "Combatente não encontrado.";
    public const string KillOnlyAtZeroHp = "Só é possível marcar como morto quando a vida atual é 0.";
    public const string InvalidDiceNotation = "Notação de dado inválida. Use o formato XdY+Z (ex.: 1d20+3).";
    public const string DamageMustBePositive = "O valor de dano deve ser maior que zero.";
    public const string HealMustBePositive = "O valor de cura deve ser maior que zero.";
    public const string HealBlockedWhileDead = "Não é possível curar um combatente morto. Use Reviver antes.";
    public const string CombatantNotDead = "Este combatente não está marcado como morto.";
    public const string ReviveRequiresHeal = "Informe a vida a restaurar ao reviver um combatente com vida 0.";
    public const string ModifierTypeNotFound = "Tipo de modificador não encontrado.";
    public const string ActiveModifierNotFound = "Modificador ativo não encontrado.";
    public const string DurationMustBePositive = "A duração deve ser maior que zero.";
    public const string NoPublicBattle = "Não há combate em andamento.";
    public const string ConfigMissing = "Configuração obrigatória ausente. Verifique User Secrets ou variáveis de ambiente.";
}
