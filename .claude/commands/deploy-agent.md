# /deploy-agent

Build and deploy the agent to Railway production.

## Current deployment

- **URL:** `https://convexo-p2p-agent-production.up.railway.app`
- **Project:** convexo-p2p-agent / production / convexo-p2p-agent
- **Start command:** `node agent/dist/index.js` (repo-root-relative, set in `railway.json`)

## Deploy steps

1. Ensure agent tests pass:
   ```bash
   cd agent && pnpm test --run
   ```
2. Build locally to catch TypeScript errors:
   ```bash
   cd agent && pnpm build
   ```
3. Push to Railway (triggers nixpacks build):
   ```bash
   railway up
   ```
4. Check build logs:
   ```bash
   railway logs --build
   ```
5. Verify health check:
   ```bash
   curl https://convexo-p2p-agent-production.up.railway.app/health
   ```
   Expected: `{"status":"ok","version":"0.1.0"}`

## Env vars

All env vars are set in Railway project settings. To add or update:
```bash
railway variables set KEY=value
```
Or use the Railway dashboard. Never commit secrets to the repo.

## Rollback

```bash
railway rollback
```
