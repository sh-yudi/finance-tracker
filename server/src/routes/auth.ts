import { Router, Request, Response } from 'express';
import { register, login, registerSchema, loginSchema } from '../services/authService';
import { validate } from '../middleware/error';

const router = Router();

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await register((req as Request & { validated: any }).validated.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await login((req as Request & { validated: any }).validated.body);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
