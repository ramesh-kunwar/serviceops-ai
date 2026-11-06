import { Router } from 'express';
import { db } from '../../db/index.js';
import { createServiceRequestSchema } from './validation.js';
import { serviceRequests } from '../../db/schema.js';
import { desc } from 'drizzle-orm';

export const requestsRouter = Router();

requestsRouter.post('/', async (req, res) => {
  const result = createServiceRequestSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Invalid request data',
      details: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const [request] = await db
      .insert(serviceRequests)
      .values(result.data)
      .returning();

    res.status(201).json(request);
  } catch {
    res.status(500).json({
      error: 'Unable to create service request',
    });
  }
});

requestsRouter.get('/', async (req, res) => {
  try {
    const requests = await db
      .select()
      .from(serviceRequests)
      .orderBy(desc(serviceRequests.createdAt), desc(serviceRequests.id))
      .limit(50);

    res.status(200).json(requests);
  } catch {
    res.status(500).json({
      error: 'Unable to retrieve service requests',
    });
  }
});
