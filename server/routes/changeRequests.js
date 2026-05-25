import { Router } from 'express';
import ChangeRequest from '../models/ChangeRequest.js';
import JiraTicket from '../models/JiraTicket.js';
import { createChangeRequestFromTicket } from '../services/changeRequestService.js';
import ctaskRoutes from './ctasks.js';

const router = Router();

router.use('/:number/ctasks', ctaskRoutes);

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

    const ticket = await JiraTicket.findOne({
      key: String(jiraKey).trim().toUpperCase(),
    });
    if (!ticket) {
      return res.status(404).json({ error: `Jira ticket ${jiraKey} not found` });
    }

    const crResult = await createChangeRequestFromTicket(ticket);

    if (crResult.existing) {
      return res.status(409).json({
        error: 'Change request already exists for this ticket',
        changeRequest: crResult.changeRequest,
        ctasks: crResult.ctasks,
      });
    }

    res.status(201).json({
      changeRequest: crResult.changeRequest,
      ctasks: crResult.ctasks,
      aiSource: crResult.aiSource,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:number', async (req, res) => {
  try {
    const allowed = [
      'state',
      'title',
      'planning',
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
      'notes',
      'pir',
      'processIntegration',
      'governance',
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
