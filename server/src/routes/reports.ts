import { Router, Request, Response } from 'express';
import { generateDailyReport, getDailyReports } from '../services/reportService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/daily', async (req: Request, res: Response) => {
  try {
    const report = await generateDailyReport((req as AuthRequest).user!.id);
    res.status(201).json(report);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/daily', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const reports = await getDailyReports(userId, from, to);
    res.json(reports);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
