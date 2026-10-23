export const CONSULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['decision', 'reply'],
  properties: {
    decision: { type: 'string', enum: ['answer', 'clarify', 'propose', 'reject'] },
    reply: { type: 'string' },
    proposal: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'summary', 'changes'],
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        changes: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['path', 'action'],
            properties: {
              path: { type: 'string' },
              action: { type: 'string', enum: ['write', 'delete'] },
              content: { type: 'string' },
            },
          },
        },
      },
    },
  },
}

export const WATCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['action', 'reply'],
  properties: {
    action: { type: 'string', enum: ['none', 'conflict', 'decision', 'question'] },
    reply: { type: 'string' },
    evidence: { type: 'array', items: { type: 'string' } },
  },
}
