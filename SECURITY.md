# Security Policy

## Reporting a vulnerability

Do not open a public issue for a security vulnerability.

Report it privately to the repository owner with:
- a clear description
- reproduction steps
- affected endpoint or component
- impact assessment
- suggested mitigation, if known

Never include API keys, tokens, passwords, or private documents in an issue or pull request.

## Current security controls

Fieldnote keeps provider credentials server-side, validates API inputs, restricts browser origins with a CORS allowlist, applies D1-backed rate limits to chat requests, returns request IDs, and scopes conversation/document operations to a browser workspace. Workspace tokens are random browser-generated bearer secrets; only their SHA-256 hashes are stored as workspace identifiers.

## Important limitations

Workspace tokens are not account authentication. Anyone who obtains a token can access that browser workspace, and users cannot recover it after clearing browser storage. CORS is not authentication and does not stop non-browser clients from calling an API. Do not use this demo for confidential, regulated, or sensitive personal data.

Before offering Fieldnote as a production service, implement account authentication and authorization, account/workspace recovery, explicit data retention/deletion policies, stronger abuse and cost controls, monitoring/alerting, and a documented incident response process.
