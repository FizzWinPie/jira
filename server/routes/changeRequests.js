import { Router } from 'express';
import ChangeRequest from '../models/ChangeRequest.js';
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
