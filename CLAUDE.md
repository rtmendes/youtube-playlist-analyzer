# CLAUDE.md

## Secrets & automation (evergreen Infisical — org standard)

- All secrets live in Infisical: project `75ce45d4-9209-45b0-a24d-a2078132f2f8`,
  env `prod`. Never ask the user to paste a secret that exists there.
- Sessions self-provision: the SessionStart hook exports secrets to `.env.local`
  (gitignored), `.mcp.json` provides Infisical MCP tools, `scripts/with-env.sh`
  injects secrets at runtime, and `scripts/secrets.mjs` is a zero-dep Node loader
  (`await loadSecrets()`).
- If a needed secret NAME is missing but an equivalent exists under another name,
  create an alias yourself: `scripts/infisical-ensure-secret.mjs NAME --ref EXISTING`
  (create-if-missing only; allowlisted). Updating/deleting secrets requires asking.
- Automation-first: never ask the user to do manually what can be done
  programmatically from this environment. Only hand over a step when genuinely
  impossible (auth-gated UI), and then as an exact copy-paste.
