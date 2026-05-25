import { Router } from 'express';
import ChangeRequest from '../models/ChangeRequest.js';
import ChangeTask from '../models/ChangeTask.js';
import JiraTicket from '../models/JiraTicket.js';
import {
  createCtasksForChange,
  enrichCtaskDoc,
} from '../utils/ctaskDefaults.js';

const router = Router({ mergeParams: true });

async function loadChangeContext(changeNumber) {
  const cr = await ChangeRequest.findOne({ number: changeNumber });
  if (!cr) return null;
  const ticket = await JiraTicket.findOne({ key: cr.jiraKey });
  return { cr, ticket };
}

router.get('/', async (req, res) => {
  try {
    const changeNumber = req.params.number.toUpperCase();
    const ctx = await loadChangeContext(changeNumber);
    if (!ctx) {
      return res.status(404).json({ error: 'Change request not found' });
    }

    let ctasks = await ChangeTask.find({ changeNumber }).sort({ number: 1 });

    if (ctasks.length === 0) {
      ctasks = await createCtasksForChange(ctx.cr, ctx.ticket);
    }

    res.json(
      ctasks.map((t) => enrichCtaskDoc(t, ctx.cr, ctx.ticket))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:ctaskNumber', async (req, res) => {
  try {
    const changeNumber = req.params.number.toUpperCase();
    const ctaskNumber = req.params.ctaskNumber.toUpperCase();
    const ctx = await loadChangeContext(changeNumber);
    if (!ctx) {
      return res.status(404).json({ error: 'Change request not found' });
    }

    let task = await ChangeTask.findOne({ changeNumber, number: ctaskNumber });
    if (!task) {
      return res.status(404).json({ error: 'Change task not found' });
    }

    res.json(enrichCtaskDoc(task, ctx.cr, ctx.ticket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
