# Evaluation cases

Fieldnote keeps a small, versioned evaluation set so changes to prompting and retrieval can be reviewed deliberately.

These cases are intentionally provider-agnostic. They define behavioral expectations rather than hard-coding one model's exact wording.

## Categories

- **Grounding:** answers stay within retrieved evidence.
- **Citations:** source references correspond to actual retrieved material.
- **Safety:** the assistant does not expose system instructions or hidden implementation details.

For a production deployment, extend this set with representative domain questions, expected source IDs, retrieval recall checks, and a model-graded rubric.