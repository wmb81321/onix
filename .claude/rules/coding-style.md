# Convexo P2P — Coding Style Rules

These rules apply to all TypeScript code in `agent/`, `mcp-server/`, `scripts/`, and `frontend/`. There is no Solidity in this project (Tempo handles escrow via Virtual Addresses), so the previously-referenced `solidity-conventions.md` does not exist.

## Type Safety

- **TypeScript strict mode is mandatory.** `tsconfig.json` must include `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`.
- **No `any`.** If you cannot type something precisely, use `unknown` and narrow with a `zod` schema or a type guard.
- **No `as unknown as T`.** Casting through `unknown` defeats the type system. Either fix the upstream type or validate with `zod` and use the inferred type.

## Errors and Async

- **All async functions must handle errors explicitly.** No bare `await` calls without a surrounding `try/catch` or a clearly documented upstream handler. No silent `.catch(() => {})` blocks — every catch must log or rethrow.
- **MCP tool calls are wrapped in `try/catch` with structured error logging.** Log shape: `{ mcp, tool, args, error: { name, message, stack } }`. Errors during MCP calls must include the MCP server name in the log so failures are routable.
- **Never throw raw strings.** Always throw `Error` instances (or a project-defined subclass).

## State and Recoverability

- **Update Supabase trade status BEFORE the on-chain or fiat side-effect.** A crash mid-step must be recoverable by replaying from the persisted state. State write -> external call -> state write to confirm; never the reverse.
- **State transitions must be idempotent.** Every step reads the current state first and short-circuits if the work is already done. Same call twice = same outcome, no double-charge, no double-release.

## Validation

- **Use `zod` for all external input validation.** Supabase rows read into the agent, user-submitted form data via the trade routes (`PaymentSentBody`, `ConfirmPaymentBody`, `CreateTradeBody`), MCP tool responses, and any inbound webhook payload — all parsed through a `zod` schema before use.
- **Never trust JSON shapes.** Use `parse` only at trust boundaries you fully control (e.g. validating env at startup); everywhere else, `safeParse` and handle the failure branch with a 4xx response.

## Module Style

- **Named exports only in agent runtime code.** No `export default` in `agent/src/` or `mcp-server/src/`. Default exports are tolerated only in Next.js page/layout files where the framework requires them.
- **One responsibility per file in `agent/src/flows/`.** `flowManual.ts` owns the manual peer-to-peer settlement path. If a future payment rail is added, give it its own file (e.g. `flowB.ts`) — never cross-import between flows. Shared logic belongs in `agent/src/lib/`.

## Naming

- **Files:** `kebab-case.ts` for new files (e.g. `payment-sent-form.tsx`, `confirm-payment-panel.tsx`). The legacy `flowManual.ts` / `flowA.ts` style is retained on existing flow files for clarity inside `agent/src/flows/` and is not a target for renaming.
- **Classes and types:** `PascalCase` (e.g. `class TradeStateMachine`, `type TradeRow`).
- **Functions and variables:** `camelCase` (e.g. `markPaymentSent`, `confirmPayment`).
- **Constants:** `SCREAMING_SNAKE_CASE` only for true compile-time constants from the environment surface.

## Imports

- Use absolute imports rooted at the package (`@convexo/agent/state/...`) where tsconfig paths support it. No deep relative chains (`../../../`).
- Group imports: external -> internal aliases -> relative. Separate groups with a blank line.
