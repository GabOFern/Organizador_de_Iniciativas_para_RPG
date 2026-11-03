# Design system — Iniciativas RPG

Documento de manutenção visual do front (`src/IniciativasRPG.Web`). Novas telas e refactors **seguem estes tokens e padrões**. Não inventar paleta roxa, Inter/Roboto, cards brancos flat nem fundos chapados sem textura.

Fonte da verdade CSS: `src/IniciativasRPG.Web/src/index.css` (`:root` + componentes). Fontes carregadas em `index.html` (Google Fonts).

## Sumário

- [Direção visual](#direção-visual)
- [Cores](#cores)
- [Tipografia](#tipografia)
- [Espaçamento](#espaçamento)
- [Superfícies: page, panel, card](#superfícies-page-panel-card)
- [Botões e formulários](#botões-e-formulários)
- [Fila de iniciativa (grade / carrossel)](#fila-de-iniciativa-grade--carrossel)
- [Marca](#marca)
- [Toque e mobile](#toque-e-mobile)
- [Fora do padrão (não fazer)](#fora-do-padrão-não-fazer)
- [Corte de alinhamento](#corte-de-alinhamento)
- [Testes](#testes)

## Direção visual

Tom de **mesa de RPG / madeira escura + prata + brasa dourada**. Fundo em camadas (gradientes + “veio” de madeira sutil), painéis com cantos ornamentais, tipografia clássica.

Uma composição por viewport de produto (lobby, batalha): hierarquia clara marca → ação → conteúdo. Evitar dashboard de cards genéricos no hero.

## Cores

Usar variáveis de `:root`. Não hardcodar hex novos sem necessidade.

| Token | Papel |
| --- | --- |
| `--wood-deep` / `--wood-mid` / `--wood-panel` / `--wood-raised` | Madeira: fundo, elevação, painel |
| `--silver` / `--silver-dim` / `--metal-edge` | Metais: títulos, bordas, foco |
| `--ink` / `--ink-muted` | Texto principal / secundário |
| `--accent-ember` / `--accent-ember-deep` / `--accent-soft` | Ênfase (botão primary, destaques) |
| `--danger-blood` / `--danger-blood-bright` | Destrutivo / erro |
| `--ok-moss` | Sucesso / positivo |
| `--turn-aura*` | Aura do combatente no turno (deriva do accent) |
| `--border`, `--shadow` | Borda e sombra padrão de painel |

Aliases `--bg`, `--text`, `--accent`, etc. existem para código legado; preferir os nomes semânticos wood/ink/ember em CSS novo.

## Tipografia

| Token | Família | Uso |
| --- | --- | --- |
| `--font-display` | **Cinzel** (+ Palatino fallback) | Títulos (`h1`–`h3`), botões, marca, rótulos de ação em caixa alta |
| `--font-body` | **Crimson Pro** (+ Palatino fallback) | Corpo, labels, ledes, textos longos |

- Display: `letter-spacing` ~`0.06em`, `font-weight` 600 nos headings; botões em uppercase.
- Body: `line-height` 1.5, peso 400.
- Monospace só para dados técnicos pontuais (ex.: dado/código), nunca como UI geral.
- **Não** usar Inter, Roboto, Arial ou `system-ui` como fonte principal.

## Espaçamento

Escala nomeada (adicionar em `:root` se ainda não existir; valores alinhados ao que o app já usa):

| Token | Valor | Uso |
| --- | --- | --- |
| `--space-2xs` | `0.35rem` | Label → input; gaps internos apertados |
| `--space-xs` | `0.5rem` | Gaps entre botões irmãos na mesma barra |
| `--space-sm` | `0.75rem` | `.row` interno; ações próximas |
| `--space-md` | `0.85rem` | `.stack` padrão; ritmo vertical de formulário |
| `--space-lg` | `1.35rem` | Gap entre cards da grade; padding vertical de `.panel`; filtros → lista |
| `--space-xl` | `1.5rem` | Padding de `.page` / `.mestre-shell` |
| `--space-section` | `1.75rem` | **Toolbar de vista → cards** (precisa superar a aura do turno ~14px + ornamento) |

Regras:

1. Entre **controles de vista** (Grade/Carrossel/Qtd/Foco) e **lista/cards**, usar `--space-section` (não `--space-md` / `0.85rem`).
2. Entre **cards irmãos** na grade de combate, `--space-lg`.
3. Entre botões na mesma toolbar, `--space-xs` ou `--space-sm`.
4. Coluna das setas do carrossel: `column-gap` ≥ `--space-sm` (hoje `0.35rem` encosta no ornamento).
5. Não empilhar `margin` + `gap` conflitantes no mesmo eixo sem motivo.

## Superfícies: page, panel, card

### Page / shell

`.page` e `.mestre-shell`: `max-width: 1200px`, padding `--space-xl`, centralizados.

### Panel

`.panel` = superfície de bloco (formulário, bloco de batalha, modal body):

- Fundo madeira em gradiente + brilho sutil
- Borda prata + `outline` interno nos cantos (`::before` / `::after`)
- `border-radius: 6px`, padding ~`1.35rem 1.4rem`
- `.panel.narrow` para formulários estreitos (~440px)

Não criar “card Bootstrap” paralelo (fundo branco, shadow só, radius 16px).

### Card de combatente / campanha

- Usar `CardFrame` (ornamento SVG) dentro do cartão.
- Conteúdo acima do frame com z-index; não remover o frame em cards de fila/lobby.
- Cartão de turno usa aura `--turn-aura*` — não inventar glow roxo.

## Botões e formulários

- Default = primary ember (gradiente); `.ghost` = madeira escura + prata; `.danger` = sangue.
- `min-height: var(--touch-min)` (`44px`).
- Inputs: fundo madeira, borda prata, inset shadow; focus com `--metal-edge`.
- Labels: grid com gap `--space-2xs`, cor `--ink-muted`.

## Fila de iniciativa (grade / carrossel)

Estrutura: `.combatant-list-view` → `.combatant-view-toolbar` → grade ou carrossel.

| Elemento | Espaçamento |
| --- | --- |
| Toolbar → cards | gap do list-view = `--space-section` |
| Botões na toolbar | gap `--space-xs` |
| Cards na grade | gap `--space-lg` |
| Nav do carrossel | tocável (`--touch-min`); `column-gap` ≥ `--space-sm` |

O campo “Qtd.” (qty) fora da toolbar, se existir, também respeita `--space-section` em relação aos cards.

## Marca

Home / lobby público: `.brand-mark` + `.brand-ornament` + `.brand-title` (`appBrandName`). Título não compete com a marca no primeiro viewport.

## Toque e mobile

- `--touch-min: 44px` em controles.
- Breakpoints de jogador: `--player-phone-max` (767px), landscape `--player-phone-landscape-max`.
- Manter área de toque ao compactar a toolbar; preferir wrap a reduzir abaixo de 44px.

## Fora do padrão (não fazer)

- Temas default IA: roxo/indigo, cream+#terracotta, jornal sem radius
- Fundo flat de uma cor só sem textura/gradiente do `:root`
- Cards sem `CardFrame` na fila/lobby
- Espaço toolbar↔cards &lt; `--space-lg`
- Fonte display em parágrafos longos; body em botões primary

## Corte de alinhamento

Implementar neste corte:

1. Introduzir tokens `--space-*` e `--space-section` em `:root`; migrar `.stack`, `.row`, `.combatant-list-view`, `.combatant-grid`, `.combatant-view-toolbar`, `.combatant-carousel`.
2. **Corrigir** toolbar → cards: gap = `--space-section` (`1.75rem`). Carrossel: `column-gap` ≥ `--space-sm`.
3. P1 espaçamento (mesmo espírito): `.queue-header` margin-bottom → `--space-lg`; `.sheet-filters` margin-bottom → `--space-lg`; `.battle-layout` / `.page-grid` gap → `--space-xl` se couber sem redesign.
4. P1 CardFrame: incluir `<CardFrame />` em `PublicLobbyPage` (como na home de campanhas).
5. Teste `designTokens.test.ts` asserta `--space-section`, Cinzel, Crimson Pro.

Fora deste corte: varrer todos os hex `#2a1c12` → tokens; Warlock danger roxo; redesign de `scene-open`; i18n.

## Testes

- Unidade/config ou teste de CSS-contract: arquivo `src/__tests__/designTokens.test.ts` (ou equivalente) que lê `index.css` (como texto) e asserta presença de `--space-lg`, `--font-display: 'Cinzel'`, `--font-body: 'Crimson Pro'`.
- Regressão Vitest da toolbar/lista se já houver teste de classes: garantir que o wrapper `combatant-list-view` permanece e documentar o gap via comentário no teste ou snapshot de className.
- Não exigir teste visual E2E de pixels.
