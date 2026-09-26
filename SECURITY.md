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

## Security controls

Fieldnote keeps provider credentials server-side, validates API inputs, restricts CORS, applies rate limits when D1 is enabled, and avoids returning upstream provider errors directly.

These controls reduce common application risks but do not make the application secure by default for sensitive production data. Authentication, authorization, tenant isolation, encryption requirements, and a managed vector store should be added before handling confidential organizational data.
