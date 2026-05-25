import { Router } from 'express';
import ChangeRequest from '../models/ChangeRequest.js';
import JiraTicket from '../models/JiraTicket.js';
import { generateChangeRequestDraft } from '../services/aiService.js';
import {
  buildChangeMetadata,
  nextChangeNumber,
} from '../utils/changeRequestDefaults.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const requests = await ChangeRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:number', async (req, res) => {
  try {
    const cr = await ChangeRequest.findOne({
      number: req.params.number.toUpperCase(),
    });
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
    const metadata = buildChangeMetadata(ticket);
    const number = await nextChangeNumber(ChangeRequest);

    const changeRequest = await ChangeRequest.create({
      number,
      jiraKey: ticket.key,
      title: aiResult.title || ticket.summary,
      shortDescription: metadata.shortDescription,
      requestedBy: metadata.requestedBy,
      sourceOfChange: metadata.sourceOfChange,
      primaryBusinessService: metadata.primaryBusinessService,
      maintenanceWindow: metadata.maintenanceWindow,
      location: metadata.location,
      changeType: aiResult.changeType || metadata.changeType,
      state: metadata.state,
      environment: aiResult.environment || metadata.environment,
      owningGroup: aiResult.owningGroup || metadata.owningGroup,
      changeOwner: metadata.changeOwner,
      plannedStartDate: metadata.plannedStartDate,
      plannedEndDate: metadata.plannedEndDate,
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

router.patch('/:number', async (req, res) => {
  try {
    const allowed = [
      'state',
      'draft',
      'title',
      'shortDescription',
      'requestedBy',
      'sourceOfChange',
      'primaryBusinessService',
      'maintenanceWindow',
      'location',
      'changeType',
      'environment',
      'owningGroup',
      'changeOwner',
      'plannedStartDate',
      'plannedEndDate',
    ];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const cr = await ChangeRequest.findOneAndUpdate(
      { number: req.params.number.toUpperCase() },
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
