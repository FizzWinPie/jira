import JiraTicket from '../models/JiraTicket.js';
import { BOARD_COLUMNS } from '../data/dummyJira.js';

/** Map Jira workflow status names to kanban columns */
const STATUS_MAP = {
  'Ready for CHG': 'In Review',
  'Ready for Change': 'In Review',
  'Ready for CAB': 'In Review',
  Open: 'To Do',
  'In Progress': 'In Progress',
  Done: 'Done',
  Closed: 'Done',
  Cancelled: 'Done',
};

export function mapJiraStatusToBoard(statusName) {
  if (!statusName || typeof statusName !== 'string') return 'In Progress';
  const trimmed = statusName.trim();
  if (BOARD_COLUMNS.includes(trimmed)) return trimmed;
  if (STATUS_MAP[trimmed]) return STATUS_MAP[trimmed];
  return 'In Progress';
}

/**
 * Normalize Lambda / Jira Automation POST body into ticket fields.
 */
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
    description: String(body.description || '').trim(),
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
    generateChangeRequest: body.generateChangeRequest !== false,
  };
}

/**
 * Upsert a Jira ticket in MongoDB from webhook payload (real Jira issues).
 */
export async function upsertJiraTicketFromWebhook(body) {
  const parsed = parseWebhookBody(body);
  const boardStatus = mapJiraStatusToBoard(parsed.statusName);
  const assignee =
    parsed.requestedBy?.trim() ||
    parsed.requestedByEmail?.trim() ||
    'Unassigned';

  const ticket = await JiraTicket.findOneAndUpdate(
    { key: parsed.ticketKey },
    {
      $set: {
        key: parsed.ticketKey,
        summary: parsed.summary,
        description: parsed.description,
        status: boardStatus,
        assignee,
        type: parsed.type,
        priority: parsed.priority,
        epic: parsed.epic,
        labels: parsed.labels,
        storyPoints: parsed.storyPoints,
        acceptanceCriteria: parsed.acceptanceCriteria,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  return {
    ticket,
    parsed,
    boardStatus,
  };
}
