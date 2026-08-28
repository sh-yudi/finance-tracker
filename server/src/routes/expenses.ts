import { Router, Request, Response } from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  createExpenseSchema,
  listQuerySchema,
} from '../services/expenseService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/error';

const router = Router();

type Validated<T> = Request & { validated: T };

router.use(authenticate);

router.get('/', validate(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const query = (req as Validated<{ query: any }>).validated.query;
    const result = await getExpenses((req as AuthRequest).user!.id, query);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const expense = await getExpense((req as AuthRequest).user!.id, req.params.id);
    res.json(expense);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/', validate(createExpenseSchema), async (req: Request, res: Response) => {
  try {
    const body = (req as Validated<{ body: any }>).validated.body;
    const expense = await createExpense((req as AuthRequest).user!.id, body);
    res.status(201).json(expense);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
