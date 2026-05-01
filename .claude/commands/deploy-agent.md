# /deploy-agent

Deploy the agent to Railway production via GitHub push.

## Current deployment

- **URL:** `https://convexo-p2p-agent-production.up.railway.app`
- **Repo:** `wmb81321/onix`, root dir: `/agent`, builder: Dockerfile
- **Trigger:** any push to `main` branch auto-deploys (GitHub integration)
- **Version:** v0.5.2

## Deploy steps

1. Catch TypeScript errors locally:
   ```bash
   cd agent && npx tsc --noEmit
   ```
2. Commit and push — Railway deploys automatically:
   ```bash
   git add agent/
   git commit -m "chore: ..."
   git push origin main
   ```
3. Watch build logs (Railway dashboard or CLI):
   ```bash
   railway logs --build
   ```
4. Verify health check:
   ```bash
   curl https://convexo-p2p-agent-production.up.railway.app/health
   ```
   Expected: `{"status":"ok","version":"0.5.2"}`

> **Note:** `railway up` is NOT used. It uploads a git archive (committed state only) and would never pick up working-tree changes. Always deploy via `git push`.

## Env vars

All env vars are in Railway project settings. Required vars:

| Var | Purpose |
|---|---|
| `AGENT_MASTER_ID` | Virtual Address master — NEVER change |
| `AGENT_MASTER_SALT` | PoW salt from mining |
| `AGENT_ACCESS_KEY` | EOA private key (0x-prefixed) |
| `AGENT_ACCESS_KEY_ADDRESS` | EVM address matching access key |
| `TEMPO_RPC_URL` | Mainnet RPC (fallback) |
| `TEMPO_TESTNET_RPC_URL` | `https://rpc.moderato.tempo.xyz` — required for testnet |
| `TEMPO_CHAIN_ID` | `42431` (Moderato testnet) |
| `TEMPO_PATHUSDC_ADDRESS` | `0x20c0000000000000000000000000000000000000` |
| `MPP_SECRET_KEY` | HMAC key for challenge IDs (min 16 chars) |
| `FACILITATOR_URL` | Public URL of this agent (self-referential for discovery) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Full `whsec_...` string from Stripe dashboard |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — never expose to browser |

To add or update:
```bash
railway variables set KEY=value
```

## Rollback

```bash
railway rollback
```
