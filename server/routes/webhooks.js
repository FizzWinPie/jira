import { Router } from 'express';
import { upsertJiraTicketFromWebhook } from '../utils/jiraWebhook.js';
import { createChangeRequestFromTicket } from '../services/changeRequestService.js';

const router = Router();

function verifyWebhookSecret(req, res, next) {
  const secret = process.env.JIRA_WEBHOOK_SECRET;
  if (!secret) return next();

  const header =
    req.get('X-Webhook-Secret') || req.get('x-webhook-secret');
  if (header !== secret) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }
  next();
}

/**
 * POST /api/webhooks/jira
 * Body: { ticketKey, summary, description, statusName, requestedBy, requestedByEmail, ... }
 * Upserts Jira ticket in MongoDB, then creates CHG + CTASKs (same as board generate).
 */
router.post('/jira', verifyWebhookSecret, async (req, res) => {
  try {
    const { ticket, parsed, boardStatus } =
      await upsertJiraTicketFromWebhook(req.body);

    const result = {
      ok: true,
      jiraKey: ticket.key,
      ticket,
      boardStatus,
      message: `Jira ticket ${ticket.key} saved to MongoDB`,
    };

    if (!parsed.generateChangeRequest) {
      return res.status(200).json(result);
    }

    const crResult = await createChangeRequestFromTicket(ticket, {
      requestedBy: parsed.requestedBy || undefined,
      sourceOfChange: 'Jira',
    });

    if (crResult.existing) {
      return res.status(409).json({
        ...result,
        error: 'Change request already exists for this ticket',
        changeRequest: crResult.changeRequest,
        ctasks: crResult.ctasks,
      });
    }

    return res.status(201).json({
      ...result,
      changeRequest: crResult.changeRequest,
      ctasks: crResult.ctasks,
      aiSource: crResult.aiSource,
      message: `Created ${crResult.changeRequest.number} for ${ticket.key}`,
    });
  } catch (err) {
    const status = err.message?.includes('required') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
