/**
 * Parse Jira/Lambda webhook body and build an in-memory ticket for AI + CHG creation.
 * Does NOT persist Jira tickets to MongoDB.
 */

export function normalizeDescription(description) {
  if (description == null) return '';
  if (typeof description === 'string') return description.trim();
  if (typeof description === 'object') {
    const text = extractAdfText(description);
    return text || JSON.stringify(description);
  }
  return String(description).trim();
}

function extractAdfText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractAdfText).join('\n');
  if (node.type === 'text' && node.text) return node.text;
  if (node.content) return extractAdfText(node.content);
  return '';
}

export function parseWebhookBody(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a JSON object');
  }

  const ticketKey = String(body.ticketKey || body.jiraKey || '')
    .trim()
    .toUpperCase();
  if (!ticketKey) {
    throw new Error('ticketKey or jiraKey is required');
  }

  const summary = String(body.summary || body.title || '').trim();
  if (!summary) {
    throw new Error('summary (or title) is required');
  }

  return {
    ticketKey,
    summary,
    description: normalizeDescription(body.description),
    statusName: body.statusName || body.status || '',
    requestedBy: body.requestedBy || body.displayName || '',
    requestedByEmail: body.requestedByEmail || body.userEmail || '',
    type: body.type || 'Story',
    priority: body.priority || 'Medium',
    epic: body.epic || '',
    labels: Array.isArray(body.labels) ? body.labels : [],
    storyPoints: Number(body.storyPoints) || 0,
    acceptanceCriteria: Array.isArray(body.acceptanceCriteria)
      ? body.acceptanceCriteria
      : [],
  };
}

/** Plain ticket shape used by AI + CTASK helpers (not stored in DB). */
export function buildTicketFromWebhook(body) {
  const parsed = parseWebhookBody(body);
  const assignee =
    parsed.requestedBy?.trim() ||
    parsed.requestedByEmail?.trim() ||
    'Unassigned';

  return {
    key: parsed.ticketKey,
    summary: parsed.summary,
    description: parsed.description,
    type: parsed.type,
    priority: parsed.priority,
    status: parsed.statusName,
    assignee,
    epic: parsed.epic,
    labels: parsed.labels,
    storyPoints: parsed.storyPoints,
    acceptanceCriteria: parsed.acceptanceCriteria,
  };
}

export function buildTicketContextFromChangeRequest(cr) {
  return {
    key: cr.jiraKey,
    summary: cr.shortDescription || cr.title,
    description: cr.planning?.detailedDescription || '',
    type: 'Story',
    priority: 'Medium',
    status: '',
    assignee: cr.changeOwner,
    epic: '',
    labels: [],
    storyPoints: 0,
    acceptanceCriteria: [],
  };
}
