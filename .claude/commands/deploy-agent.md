# /deploy-agent

Deploy the agent to Railway production via GitHub push.

## Current deployment

- **URL:** `https://convexo-p2p-agent-production.up.railway.app`
- **Repo:** `wmb81321/onix`, root dir: `/agent`, builder: Dockerfile
- **Trigger:** any push to `main` branch auto-deploys (GitHub integration)
- **Version:** v1.3.0

## Deploy steps

1. Catch TypeScript errors locally:
   ```bash
   cd agent && npx tsc --noEmit
   ```
2. Commit and push — Railway deploys automatically:
   ```bash
   git add agent/
   git commit -m "feat: ..."
   git push origin main
   ```
3. Watch build logs:
   ```bash
   railway logs --build
   ```
4. Verify health check:
   ```bash
   curl https://convexo-p2p-agent-production.up.railway.app/health
   ```
   Expected: `{"status":"ok"}`

> **Note:** `railway up` is NOT used. Always deploy via `git push`.

## Required env vars (Railway project settings)

| Var | Purpose |
|---|---|
| `AGENT_MASTER_ID` | Virtual Address master — NEVER change |
| `AGENT_MASTER_SALT` | PoW salt from mining |
| `AGENT_ACCESS_KEY` | EOA private key (0x-prefixed) |
| `AGENT_ACCESS_KEY_ADDRESS` | EVM address matching access key |
| `TEMPO_RPC_URL` | Mainnet RPC (fallback) |
| `TEMPO_TESTNET_RPC_URL` | `https://rpc.moderato.tempo.xyz` |
| `TEMPO_CHAIN_ID` | `42431` (Moderato testnet) |
| `TEMPO_PATHUSDC_ADDRESS` | `0x20c0000000000000000000000000000000000000` |
| `MPP_SECRET_KEY` | HMAC key for challenge IDs (min 16 chars) |
| `FACILITATOR_URL` | Public URL of this agent (self-referential) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` for testnet) |
| `STRIPE_WEBHOOK_SECRET` | Full `whsec_...` from Stripe dashboard |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — never expose to browser |
| `AGENT_API_KEY` | Bearer token for agent routes (shared with frontend) |

## Optional env vars

| Var | Purpose |
|---|---|
| `LINK_CLI_AUTH` | JSON blob from `~/.config/link-cli-nodejs/config.json` — enables Link CLI at startup |
| `LINK_DEFAULT_PM_ID` | Deprecated — do not use. Per-buyer PM IDs are stored in `users.link_payment_method_id` |

To add or update:
```bash
railway variables set KEY=value
```

## Rollback

```bash
railway rollback
```
