import { Router } from 'express';
import ChangeRequest from '../models/ChangeRequest.js';
import ChangeTask from '../models/ChangeTask.js';
import JiraTicket from '../models/JiraTicket.js';
import { createCtasksForChange } from '../utils/ctaskDefaults.js';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const changeNumber = req.params.number.toUpperCase();
    const cr = await ChangeRequest.findOne({ number: changeNumber });
    if (!cr) {
      return res.status(404).json({ error: 'Change request not found' });
    }

    let ctasks = await ChangeTask.find({ changeNumber }).sort({ number: 1 });

    if (ctasks.length === 0) {
      const ticket = await JiraTicket.findOne({ key: cr.jiraKey });
      ctasks = await createCtasksForChange(cr, ticket);
    }

    res.json(ctasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
