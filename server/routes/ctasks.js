import { Router } from 'express';
import ChangeRequest from '../models/ChangeRequest.js';
import ChangeTask from '../models/ChangeTask.js';
import { buildTicketContextFromChangeRequest } from '../utils/webhookPayload.js';
import { createCtasksForChange, enrichCtaskDoc } from '../utils/ctaskDefaults.js';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const changeNumber = req.params.number.toUpperCase();
    const cr = await ChangeRequest.findOne({ number: changeNumber });
    if (!cr) {
      return res.status(404).json({ error: 'Change request not found' });
    }

    const ticket = buildTicketContextFromChangeRequest(cr);
    let ctasks = await ChangeTask.find({ changeNumber }).sort({ number: 1 });

    if (ctasks.length === 0) {
      ctasks = await createCtasksForChange(cr, ticket);
    }

    res.json(ctasks.map((t) => enrichCtaskDoc(t, cr, ticket)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:ctaskNumber', async (req, res) => {
  try {
    const changeNumber = req.params.number.toUpperCase();
    const ctaskNumber = req.params.ctaskNumber.toUpperCase();
    const cr = await ChangeRequest.findOne({ number: changeNumber });
    if (!cr) {
      return res.status(404).json({ error: 'Change request not found' });
    }

    const ticket = buildTicketContextFromChangeRequest(cr);
    const task = await ChangeTask.findOne({ changeNumber, number: ctaskNumber });
    if (!task) {
      return res.status(404).json({ error: 'Change task not found' });
    }

    res.json(enrichCtaskDoc(task, cr, ticket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
