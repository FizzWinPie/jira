import { Router } from 'express';
import {
  buildTicketFromWebhook,
  parseWebhookBody,
} from '../utils/webhookPayload.js';
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
 * Lambda/Jira Automation → create CHG + CTASKs immediately (no Jira board storage).
 */
router.post('/jira', verifyWebhookSecret, async (req, res) => {
  try {
    const parsed = parseWebhookBody(req.body);
    const ticket = buildTicketFromWebhook(req.body);

    const crResult = await createChangeRequestFromTicket(ticket, {
      requestedBy: parsed.requestedBy || undefined,
      sourceOfChange: 'Jira',
    });

    if (crResult.existing) {
      return res.status(409).json({
        ok: true,
        jiraKey: parsed.ticketKey,
        error: 'Change request already exists for this ticket',
        changeRequest: crResult.changeRequest,
        ctasks: crResult.ctasks,
      });
    }

    return res.status(201).json({
      ok: true,
      jiraKey: parsed.ticketKey,
      changeRequest: crResult.changeRequest,
      ctasks: crResult.ctasks,
      aiSource: crResult.aiSource,
      message: `Created ${crResult.changeRequest.number} for ${parsed.ticketKey}`,
    });
  } catch (err) {
    const status = err.message?.includes('required') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
