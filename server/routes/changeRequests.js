import { Router } from 'express';
import ChangeRequest from '../models/ChangeRequest.js';
import JiraTicket from '../models/JiraTicket.js';
import { generateChangeRequestDraft } from '../services/aiService.js';

const router = Router();

async function nextCrId() {
  const count = await ChangeRequest.countDocuments();
  return `CR-SWA-${String(count + 1).padStart(4, '0')}`;
}

router.get('/', async (_req, res) => {
  try {
    const requests = await ChangeRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:crId', async (req, res) => {
  try {
    const cr = await ChangeRequest.findOne({ crId: req.params.crId });
    if (!cr) return res.status(404).json({ error: 'Change request not found' });
    res.json(cr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { jiraKey } = req.body;
    if (!jiraKey) {
      return res.status(400).json({ error: 'jiraKey is required' });
    }

    const ticket = await JiraTicket.findOne({ key: jiraKey });
    if (!ticket) {
      return res.status(404).json({ error: `Jira ticket ${jiraKey} not found` });
    }

    const existing = await ChangeRequest.findOne({ jiraKey });
    if (existing) {
      return res.status(409).json({
        error: 'Change request already exists for this ticket',
        changeRequest: existing,
      });
    }

    const aiResult = await generateChangeRequestDraft(ticket);
    const crId = await nextCrId();

    const changeRequest = await ChangeRequest.create({
      crId,
      jiraKey: ticket.key,
      title: aiResult.title || `CR: ${ticket.summary}`,
      status: 'Draft',
      priority: aiResult.priority || ticket.priority,
      environment: aiResult.environment || 'Staging',
      riskLevel: aiResult.riskLevel || 'Medium',
      draft: aiResult.draft,
      implementationPlan: aiResult.implementationPlan || '',
      rollbackPlan: aiResult.rollbackPlan || '',
      aiGenerated: true,
    });

    res.status(201).json({
      changeRequest,
      aiSource: aiResult.source,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:crId', async (req, res) => {
  try {
    const allowed = ['status', 'draft', 'title', 'priority', 'environment', 'riskLevel'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const cr = await ChangeRequest.findOneAndUpdate(
      { crId: req.params.crId },
      updates,
      { new: true }
    );
    if (!cr) return res.status(404).json({ error: 'Change request not found' });
    res.json(cr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
