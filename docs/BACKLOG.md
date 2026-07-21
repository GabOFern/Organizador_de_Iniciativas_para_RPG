# IniciativasRPG â€” Backlog mestre

Fonte da verdade do que deve ser feito. Use este arquivo para consultar escopo, prioridades e critÃ©rios de aceitaÃ§Ã£o ao planejar cada fase.

**Stack alvo:** ASP.NET Core Web API + SignalR Â· React + TypeScript Â· SQLite (EF Core)  
**Auth mestre:** usuÃ¡rio/senha com hash (sem OAuth nesta entrega)  
**SessÃ£o:** 1 batalha ativa por vez

---

## Ãndice por prioridade MoSCoW

| Prioridade | Stories | Fase de entrega |
|---|---|---|
| **MUST** | ST-001, ST-002, ST-003, ST-004, ST-005, ST-006, ST-008, ST-009, ST-011, ST-016, ST-017, ST-018, ST-019 | Fase 1 |
| **SHOULD** | ST-007, ST-010, ST-012, ST-013, ST-014 | Fase 2 |
| **COULD** | ST-015, ST-020 | Fase 3 |
| **WON'T** | MÃºltiplas batalhas simultÃ¢neas; OAuth para login do mestre | Fora do time-box |

---

## Checklist rÃ¡pido por fase

### Fase 1 â€” MUST (MVP funcional)

- [x] ST-001 Cadastrar ficha
- [x] ST-002 Editar ficha fora de batalha
- [x] ST-003 Invocar player com iniciativa
- [x] ST-004 Invocar criatura (manual ou dado)
- [x] ST-005 Iniciar batalha
- [x] ST-006 PrÃ³ximo turno (pula mortos / pular turno)
- [x] ST-008 Finalizar batalha
- [x] ST-009 Marcar como morto
- [x] ST-011 Aplicar dano
- [x] ST-016 Card do combatente
- [x] ST-017 Login do mestre
- [x] ST-018 Tela pÃºblica via link
- [x] ST-019 SincronizaÃ§Ã£o em tempo real (SignalR)

### Fase 2 â€” SHOULD

- [ ] ST-007 Decremento de duraÃ§Ã£o dos modificadores ao fim da volta
- [ ] ST-010 Reviver combatente
- [ ] ST-012 Restaurar vida (cura)
- [ ] ST-013 Cadastrar tipo de modificador
- [ ] ST-014 Aplicar/remover modificador em combate

### Fase 3 â€” COULD (produto completo)

- [ ] ST-015 Buff/debuff de CA
- [ ] ST-020 PersistÃªncia de estatÃ­sticas pÃ³s-batalha (players)

---

## Objetivos de negÃ³cio (RTM)

| ID | Categoria | DescriÃ§Ã£o | Prioridade |
|---|---|---|---|
| BR-001 | NegÃ³cio | Reduzir tempo de cÃ¡lculo manual de iniciativa/turno | Must |
| BR-002 | NegÃ³cio | Jogadores acompanham combate em tempo real | Must |
| BR-003 | NegÃ³cio | Reaproveitar estatÃ­sticas entre batalhas | Could |

### Regras de negÃ³cio

| ID | DescriÃ§Ã£o |
|---|---|
| BR-RULE-001 | Empate de iniciativa: desempate pelo **maior modificador de destreza** |
| BR-RULE-005 | Fichas do tipo **criatura** nÃ£o tÃªm estatÃ­sticas persistidas automaticamente ao final da batalha |
| BR-RULE-007 | Escopo: **1 batalha ativa por vez**; tela pÃºblica sem combate mostra mensagem adequada |

### NFRs

| ID | DescriÃ§Ã£o | Prioridade |
|---|---|---|
| NFR-PERF-001 | AtualizaÃ§Ã£o na tela pÃºblica em 2â€“3s (p95) apÃ³s aÃ§Ã£o do mestre | Must |
| NFR-SEC-001 | EdiÃ§Ã£o restrita ao mestre autenticado | Must |
| NFR-SEC-002 | Senha armazenada com hash | Must |

### DecisÃµes de produto travadas

| Tema | DecisÃ£o |
|---|---|
| ST-012 (cura em morto) | **Bloquear** e orientar a usar Reviver antes (nÃ£o auto-revive) |
| Imagem da ficha | Na implementaÃ§Ã£o inicial: **URL** (upload em disco pode vir depois) |
| Link pÃºblico | Token/slug Ãºnico da sessÃ£o de batalha |
| Frontend | React + TypeScript; cliente SignalR `@microsoft/signalr` |
| Segredos / hardcode | Ver seÃ§Ã£o **PadrÃµes de seguranÃ§a e configuraÃ§Ã£o** e regras em `.cursor/rules/` |

---

## PadrÃµes de seguranÃ§a e configuraÃ§Ã£o

Regras persistentes do agente: [`.cursor/rules/`](../.cursor/rules/).

| PrÃ¡tica | Como aplicar |
|---|---|
| Sem hardcode de segredos | Senhas, `Jwt:Key`, connection strings sÃ³ via config / User Secrets / env |
| `appsettings.json` versionado | Estrutura e defaults **nÃ£o sensÃ­veis**; placeholders apenas |
| Segredos locais | `dotnet user-secrets` ou `appsettings.Development.json` (gitignored) |
| Options pattern | Classes tipadas + `IOptions<T>`; evitar `Configuration["chave"]` espalhado |
| Frontend | `VITE_*` + `.env.example`; nunca JWT/senha no bundle |
| Tokens | JWT do mestre em Bearer; token pÃºblico da batalha sÃ³ para leitura |
| Login | Mensagem de erro genÃ©rica (nÃ£o distinguir usuÃ¡rio vs senha) |

---

## Arquitetura alvo

```text
/docs/BACKLOG.md
/src/IniciativasRPG.Api/     # ASP.NET Core + SignalR + EF Core/SQLite
/src/IniciativasRPG.Web/     # React + TypeScript
```

```mermaid
flowchart LR
  Mestre[SPA Mestre autenticada] -->|HTTP CRUD e acoes| Api[ASP.NET Core API]
  Mestre -->|SignalR| Hub[BattleHub]
  Publico[SPA Publica link unico] -->|SignalR subscribe| Hub
  Api --> Db[(SQLite)]
  Api -->|broadcast state| Hub
```

### DomÃ­nio (entidades)

| Entidade | Responsabilidade |
|---|---|
| `User` | Credenciais do mestre |
| `Sheet` | Ficha reutilizÃ¡vel (player ou criatura): nome, imagem, HP atual/mÃ¡x, CA base, DEX mod |
| `Battle` | SessÃ£o de combate (status, token pÃºblico, Ã­ndice do turno) |
| `Combatant` | InstÃ¢ncia na fila: iniciativa, HP/CA de combate, morto?, referÃªncia Ã  Sheet |
| `ModifierType` | CatÃ¡logo (nome, duraÃ§Ã£o padrÃ£o, flag pula turno) |
| `ActiveModifier` | InstÃ¢ncia no combatente (duraÃ§Ã£o restante, pula turno) |
| `ArmorModifier` | Buff/debuff de CA com duraÃ§Ã£o (Fase 3) |

---

## Ã‰picos e stories

### EPIC-01 â€” GestÃ£o de Fichas

#### ST-001 â€” Cadastrar ficha
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-001 Â· **Status:** Done
- **Como** mestre, **quero** cadastrar uma ficha (player ou criatura) com nome, imagem, vida atual/mÃ¡xima, CA base e modificador de destreza, **para** reutilizÃ¡-la ao montar combates.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Dado que estou na tela de fichas, quando preencho nome, vida mÃ¡xima, CA e modificador de destreza e salvo, entÃ£o a ficha Ã© criada com vida atual igual Ã  mÃ¡xima e listada no repositÃ³rio.
  - Dado que nÃ£o informei nome, quando tento salvar, entÃ£o o sistema bloqueia e exibe erro de campo obrigatÃ³rio.
  - Dado que marco o tipo como "player", entÃ£o a ficha fica elegÃ­vel para persistÃªncia pÃ³s-batalha (FR-020 / ST-020).
- **INVEST:** Independent âœ” / Negotiable âœ” / Valuable âœ” / Estimable âœ” / Small âœ” / Testable âœ”

#### ST-002 â€” Editar ficha fora de batalha
- **Prioridade:** MUST Â· **Fase:** 1 Â· **Status:** Done
- **Como** mestre, **quero** editar uma ficha existente fora de uma batalha ativa, **para** corrigir ou atualizar dados sem recriÃ¡-la.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Dado que uma ficha existe e nÃ£o estÃ¡ em combate, quando altero vida mÃ¡xima ou CA e salvo, entÃ£o os novos valores sÃ£o refletidos na listagem.
  - Dado que a ficha estÃ¡ participando de uma batalha ativa, quando tento editÃ¡-la, entÃ£o o sistema impede a ediÃ§Ã£o direta e orienta usar as aÃ§Ãµes de combate (dano/cura/modificador).

---

### EPIC-02 â€” Controle de Iniciativa e Turnos

#### ST-003 â€” Invocar player com iniciativa
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-003 Â· **Status:** Done
- **Como** mestre, **quero** invocar um player jÃ¡ com o valor da iniciativa informado, **para** que ele seja posicionado automaticamente na fila.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Dado que seleciono uma ficha de player e informo a iniciativa, quando confirmo, entÃ£o ele Ã© inserido na fila em ordem decrescente.
  - Dado que dois combatentes tÃªm o mesmo valor de iniciativa, entÃ£o o desempate segue o maior modificador de destreza (BR-RULE-001).
  - Dado que o mesmo player jÃ¡ estÃ¡ na fila da batalha atual, quando tento invocÃ¡-lo novamente, entÃ£o o sistema alerta duplicidade antes de confirmar.

#### ST-004 â€” Invocar criatura (manual ou dado)
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-004 Â· **Status:** Done
- **Como** mestre, **quero** invocar uma criatura informando manualmente a iniciativa ou pedindo para o sistema rolar o dado (notaÃ§Ã£o configurÃ¡vel, ex.: `1d20+3`), **para** posicionÃ¡-la corretamente na fila.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Dado que informo a iniciativa manualmente, quando confirmo, entÃ£o a criatura Ã© posicionada conforme esse valor.
  - Dado que escolho "rolar dado" e defino `1d20+2`, quando confirmo, entÃ£o o sistema executa a rolagem, exibe o resultado e posiciona a criatura.
  - Empates seguem BR-RULE-001.

#### ST-005 â€” Iniciar batalha
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-005 Â· **Status:** Done
- **Como** mestre, **quero** iniciar a batalha, **para** que o combatente de maior iniciativa fique em destaque.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Dado que hÃ¡ ao menos 2 combatentes, quando clico em "Iniciar Batalha", entÃ£o o de maior iniciativa Ã© destacado e os botÃµes "PrÃ³ximo" e "Finalizar Batalha" ficam disponÃ­veis.
  - Dado que a fila estÃ¡ vazia ou com 1 combatente, quando tento iniciar, entÃ£o o sistema bloqueia com mensagem explicativa.
  - Dado que a batalha jÃ¡ estÃ¡ iniciada, o botÃ£o "Iniciar Batalha" fica indisponÃ­vel.

#### ST-006 â€” PrÃ³ximo turno
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-006 Â· **Status:** Done
- **Como** mestre, **quero** acionar "PrÃ³ximo" para destacar o prÃ³ximo combatente, **pulando** automaticamente quem estÃ¡ morto ou com efeito ativo que force pular turno.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Com batalha ativa, "PrÃ³ximo" move o destaque para o prÃ³ximo vivo e sem "pular turno" ativo.
  - Mortos sÃ£o ignorados na rotaÃ§Ã£o.
  - Modificador com flag "pula turno" ativo: combatente Ã© pulado e o modificador Ã© considerado consumido para aquela rodada.
  - Ao passar do Ãºltimo, retorna ao topo (volta completa â†’ dispara FR-007 / ST-007 na Fase 2).

#### ST-007 â€” Decremento de duraÃ§Ã£o ao fim da volta
- **Prioridade:** SHOULD Â· **Fase:** 2 Â· **FR:** FR-007 Â· **Status:** Todo
- **DependÃªncias:** FR-006, FR-014
- **Como** mestre, **quero** que a duraÃ§Ã£o de todos os modificadores/efeitos ativos seja decrementada em 1 ao final de cada volta completa da fila.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Quando o destaque retorna ao topo, todo modificador ativo tem duraÃ§Ã£o âˆ’1.
  - DuraÃ§Ã£o 0 â†’ remoÃ§Ã£o automÃ¡tica do combatente.
  - Buff/debuff de CA em 0 â†’ CA exibida volta ao valor base (completo com ST-015).

#### ST-008 â€” Finalizar batalha
- **Prioridade:** MUST Â· **Fase:** 1 Â· **Status:** Done
- **Como** mestre, **quero** finalizar a batalha, **para** encerrar o combate e habilitar o salvamento de estatÃ­sticas.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Com batalha ativa, "Finalizar Batalha" encerra a fila e oferece opÃ§Ã£o de salvar estatÃ­sticas das fichas player (FR-020 / ST-020 â€” UI pode existir na Fase 1; persistÃªncia efetiva na Fase 3).
  - Tela pÃºblica reflete que nÃ£o hÃ¡ combate ativo.

#### ST-009 â€” Marcar como morto
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-009 Â· **Status:** Done
- **DependÃªncias:** FR-011
- **Como** mestre, **quero** marcar um combatente com vida 0 como morto, **para** que fique visualmente opaco com um X e seja excluÃ­do da rotaÃ§Ã£o.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Vida = 0 â†’ botÃ£o "Matar" aparece; ao confirmar, Ã­cone opaco com X.
  - Mortos sÃ£o pulados no "PrÃ³ximo" (ST-006).
  - Vida > 0 â†’ botÃ£o "Matar" nÃ£o Ã© exibido.

#### ST-010 â€” Reviver combatente
- **Prioridade:** SHOULD Â· **Fase:** 2 Â· **FR:** FR-010 Â· **Status:** Todo
- **DependÃªncias:** FR-009
- **Como** mestre, **quero** reviver um combatente marcado como morto, **para** retornÃ¡-lo Ã  rotaÃ§Ã£o normal.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - "Reviver" remove visual opaco/X e o torna elegÃ­vel na fila.
  - Se vida atual = 0 ao reviver, o sistema exige/permite definir vida atual (ex.: via restaurar) para evitar estado inconsistente.

---

### EPIC-03 â€” Combate (Dano, Cura, Efeitos)

#### ST-011 â€” Aplicar dano
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-011 Â· **Status:** Done
- **Como** mestre, **quero** aplicar dano a um player ou criatura, **para** reduzir sua vida atual.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Vida atual reduz pelo valor informado, mÃ­nimo 0 (nunca negativa).
  - Se vida chega a 0, o botÃ£o "Matar" passa a ser exibido (ST-009).

#### ST-012 â€” Restaurar vida
- **Prioridade:** SHOULD Â· **Fase:** 2 Â· **FR:** FR-012 Â· **Status:** Todo
- **Como** mestre, **quero** restaurar vida, **para** refletir cura em combate.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Cura aumenta vida atual sem ultrapassar a mÃ¡xima.
  - Combatente morto: **bloquear** e orientar a reviver antes (decisÃ£o travada).

#### ST-013 â€” Cadastrar tipo de modificador
- **Prioridade:** SHOULD Â· **Fase:** 2 Â· **FR:** FR-013 Â· **Status:** Todo
- **Como** mestre, **quero** cadastrar tipos de modificador (ex.: envenenado, atordoado) com duraÃ§Ã£o padrÃ£o e flag "pula turno".
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Salvar nome + duraÃ§Ã£o padrÃ£o + flag "pula turno" disponibiliza o tipo para aplicaÃ§Ã£o futura.
  - Sem "pula turno": nÃ£o interfere em ST-006; apenas etiqueta visual.

#### ST-014 â€” Aplicar modificador em combate
- **Prioridade:** SHOULD Â· **Fase:** 2 Â· **FR:** FR-014 Â· **Status:** Todo
- **DependÃªncias:** FR-013
- **Como** mestre, **quero** aplicar um modificador cadastrado a um combatente, podendo ajustar a duraÃ§Ã£o da instÃ¢ncia.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Confirmar com duraÃ§Ã£o padrÃ£o â†’ aparece ativo no card.
  - DuraÃ§Ã£o customizada Ã© a usada no decremento (ST-007).
  - RemoÃ§Ã£o manual remove imediatamente exibiÃ§Ã£o e efeito.

#### ST-015 â€” Buff/debuff de CA
- **Prioridade:** COULD Â· **Fase:** 3 Â· **FR:** FR-015 Â· **Status:** Todo
- **DependÃªncias:** FR-013 (conceitualmente alinhado a efeitos com duraÃ§Ã£o)
- **Como** mestre, **quero** aplicar buff/debuff de CA (valor +/âˆ’ com duraÃ§Ã£o em turnos).
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Buff +2 CA por 3 turnos â†’ CA exibida = base + 2.
  - Debuff âˆ’3 CA â†’ CA reduzida conforme o valor.
  - DuraÃ§Ã£o 0 (via ST-007) â†’ CA volta ao valor base.

#### ST-016 â€” Card do combatente
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-016 Â· **Status:** Done
- **Como** mestre e jogador, **quero** ver no card imagem, vida atual/mÃ¡xima, iniciativa, CA (com efeitos) e indicadores de modificadores.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Card mostra imagem, HP atual/mÃ¡x, iniciativa e CA atualizada.
  - Modificadores ativos aparecem como indicadores distintos.
  - Morto: opaco com X, sem indicadores de turno ativo.

---

### EPIC-04 â€” Acesso em Tempo Real

#### ST-017 â€” Login do mestre
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-017 Â· **Status:** Done
- **Como** mestre, **quero** autenticar-me com usuÃ¡rio e senha, **para** acessar as funcionalidades de ediÃ§Ã£o.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Credenciais corretas â†’ tela de controle do mestre com aÃ§Ãµes habilitadas.
  - Credenciais invÃ¡lidas â†’ nega acesso com mensagem **genÃ©rica** (nÃ£o distinguir usuÃ¡rio vs senha).
  - URL de controle sem auth â†’ redireciona para login.

#### ST-018 â€” Tela pÃºblica via link
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-018 Â· **Status:** Done
- **Como** jogador, **quero** acessar a batalha via link Ãºnico da sessÃ£o, sem login, **para** acompanhar em modo somente leitura.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Link da sessÃ£o â†’ estado atual (fila, cards, destaque) sem ediÃ§Ã£o.
  - Nenhum controle de ediÃ§Ã£o exibido/habilitado.
  - Sem batalha ativa â†’ mensagem (BR-RULE-007).

#### ST-019 â€” SincronizaÃ§Ã£o em tempo real
- **Prioridade:** MUST Â· **Fase:** 1 Â· **FR:** FR-019 Â· **NFR:** NFR-PERF-001 Â· **Status:** Done
- **Como** jogador, **quero** que aÃ§Ãµes do mestre reflitam automaticamente na minha tela em atÃ© 2â€“3 segundos.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Dano confirmado â†’ vida atualizada na pÃºblica em â‰¤ 2â€“3s, sem refresh manual.
  - "PrÃ³ximo" â†’ destaque muda no mesmo intervalo.
  - MÃºltiplos clientes pÃºblicos recebem atualizaÃ§Ã£o consistente (SignalR broadcast).

---

### EPIC-05 â€” PersistÃªncia entre Batalhas

#### ST-020 â€” Salvar estatÃ­sticas pÃ³s-batalha
- **Prioridade:** COULD Â· **Fase:** 3 Â· **FR:** FR-020 Â· **Status:** Todo
- **DependÃªncias:** FR-008 (finalizar batalha)
- **Como** mestre, **quero** salvar estatÃ­sticas (vida, CA, etc.) das fichas **player** ao final da batalha.
- **CritÃ©rios de aceitaÃ§Ã£o:**
  - Confirmar "salvar estatÃ­sticas" â†’ vida atual e CA base (sem buffs/debuffs temporÃ¡rios) das fichas player sÃ£o persistidas na ficha original.
  - Criaturas: nÃ£o persistem automaticamente (BR-RULE-005).
  - Nova batalha: ao invocar o player, vida e CA vÃªm dos valores salvos.

---

## Mapa FR â†’ Story

| FR | DescriÃ§Ã£o | Story | Prioridade |
|---|---|---|---|
| FR-001 | Cadastrar ficha | ST-001 | Must |
| FR-003 | Invocar player | ST-003 | Must |
| FR-004 | Invocar criatura | ST-004 | Must |
| FR-005 | Iniciar batalha | ST-005 | Must |
| FR-006 | PrÃ³ximo turno | ST-006 | Must |
| FR-007 | Decremento duraÃ§Ã£o | ST-007 | Should |
| FR-009 | Matar | ST-009 | Must |
| FR-010 | Reviver | ST-010 | Should |
| FR-011 | Aplicar dano | ST-011 | Must |
| FR-012 | Restaurar vida | ST-012 | Should |
| FR-013 | Cadastrar tipo modificador | ST-013 | Should |
| FR-014 | Aplicar modificador | ST-014 | Should |
| FR-015 | Buff/debuff CA | ST-015 | Could |
| FR-016 | Card do combatente | ST-016 | Must |
| FR-017 | Login mestre | ST-017 | Must |
| FR-018 | Tela pÃºblica | ST-018 | Must |
| FR-019 | Tempo real | ST-019 | Must |
| FR-020 | PersistÃªncia pÃ³s-batalha | ST-020 | Could |

---

## WON'T HAVE (neste time-box)

- Suporte a mÃºltiplas batalhas simultÃ¢neas (mantÃ©m BR-RULE-007)
- OAuth para login do mestre

---

## Como usar este arquivo nos prÃ³ximos planos

1. **Fase 1 (MUST)** â€” plano de implementaÃ§Ã£o cobre apenas o checklist MUST; marcar checkboxes ao concluir.
2. **Fase 2 (SHOULD)** â€” novo plano consultando as stories SHOULD e dependÃªncias.
3. **Fase 3 (COULD)** â€” novo plano atÃ© produto completo (ST-015 + ST-020).

Atualize o campo **Status** de cada ST (`Todo` â†’ `Doing` â†’ `Done`) conforme o progresso.
