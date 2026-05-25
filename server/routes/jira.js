import { Router } from 'express';
import JiraTicket from '../models/JiraTicket.js';
import { BOARD_COLUMNS } from '../data/dummyJira.js';

const router = Router();

router.get('/board', async (_req, res) => {
  try {
    const tickets = await JiraTicket.find().sort({ key: 1 }).lean();
    const board = BOARD_COLUMNS.reduce((acc, col) => {
      acc[col] = tickets.filter((t) => t.status === col);
      return acc;
    }, {});
    res.json({ columns: BOARD_COLUMNS, board, tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tickets', async (_req, res) => {
  try {
    const tickets = await JiraTicket.find().sort({ key: 1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tickets/:key', async (req, res) => {
  try {
    const ticket = await JiraTicket.findOne({ key: req.params.key });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
