import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';

import { eq } from 'drizzle-orm';
import { db, pool } from '../../db/index.js';
import { serviceRequests } from '../../db/schema.js';

describe('POST /api/requests', () => {
  it('rejects a whitespace-only customer name', async () => {
    const response = await request(app).post('/api/requests').send({
      customerName: '   ',
      title: 'Printer needs repair',
      description: 'The printer displays a paper jam error.',
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: 'Invalid request data',
      details: expect.arrayContaining([
        expect.objectContaining({
          field: 'customerName',
        }),
      ]),
    });
  });
});

it('creates and persists a service request', async () => {
  const input = {
    customerName: 'Alex Example',
    title: 'Test printer repair',
    description: 'The fictional office printer is jammed.',
  };

  let createdId: string | undefined;

  try {
    const response = await request(app).post('/api/requests').send(input);

    if (typeof response.body.id === 'string') {
      createdId = response.body.id;
    }

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      ...input,
      status: 'NEW',
      id: expect.any(String),
      createdAt: expect.any(String),
    });

    expect(response.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    expect(Number.isNaN(Date.parse(response.body.createdAt))).toBe(false);

    const [saved] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, response.body.id));

    expect(saved).toMatchObject({
      ...input,
      id: response.body.id,
      status: 'NEW',
    });

    expect(saved?.createdAt?.toISOString()).toBe(response.body.createdAt);
  } finally {
    if (createdId) {
      await db.delete(serviceRequests).where(eq(serviceRequests.id, createdId));
    }
  }
});

beforeEach(async () => {
  await db.delete(serviceRequests);
});

afterEach(async () => {
  await db.delete(serviceRequests);
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/requests', () => {
  it('returns the latest 50 requests, newest first', async () => {
    const fixtures = Array.from({ length: 51 }, (_, index) => ({
      customerName: 'Alex Example',
      title: `Fictional request ${index}`,
      description: 'Generated for an automated test.',
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
    }));

    await db.insert(serviceRequests).values(fixtures);

    const response = await request(app).get('/api/requests');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(50);

    const expectedTitles = fixtures
      .slice(1)
      .reverse()
      .map((fixture) => fixture.title);

    expect(response.body.map((row: { title: string }) => row.title)).toEqual(
      expectedTitles,
    );
  });
});

it.each([
  {
    scenario: 'missing customer name',
    body: {
      title: 'Printer repair',
      description: 'The fictional printer is jammed.',
    },
  },
  {
    scenario: 'customer name longer than 100 characters',
    body: {
      customerName: 'A'.repeat(101),
      title: 'Printer repair',
      description: 'The fictional printer is jammed.',
    },
  },
  {
    scenario: 'numeric title',
    body: {
      customerName: 'Alex Example',
      title: 123,
      description: 'The fictional printer is jammed.',
    },
  },
  {
    scenario: 'title longer than 120 characters',
    body: {
      customerName: 'Alex Example',
      title: 'A'.repeat(121),
      description: 'The fictional printer is jammed.',
    },
  },
  {
    scenario: 'blank description',
    body: {
      customerName: 'Alex Example',
      title: 'Printer repair',
      description: '   ',
    },
  },
  {
    scenario: 'description longer than 2000 characters',
    body: {
      customerName: 'Alex Example',
      title: 'Printer repair',
      description: 'A'.repeat(2001),
    },
  },
])('returns 400 for $scenario', async ({ body }) => {
  const response = await request(app).post('/api/requests').send(body);

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid request data');

  const savedRequests = await db.select().from(serviceRequests);

  expect(savedRequests).toHaveLength(0);
});

it('returns a safe error when the database insert fails', async () => {
  const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const insertSpy = vi.spyOn(db, 'insert').mockImplementation(() => {
    throw new Error('Simulated internal database failure');
  });

  try {
    const response = await request(app).post('/api/requests').send({
      customerName: 'Alex Example',
      title: 'Printer repair',
      description: 'The fictional printer is jammed.',
    });

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      error: 'Unable to create service request',
    });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      'Service request database operation failed',
      { operation: 'create' },
    );
  } finally {
    insertSpy.mockRestore();
    logSpy.mockRestore();
  }
});

it('returns a safe error when the database query fails', async () => {
  const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const selectSpy = vi.spyOn(db, 'select').mockImplementation(() => {
    throw new Error('Simulated internal database failure');
  });

  try {
    const response = await request(app).get('/api/requests');

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      error: 'Unable to retrieve service requests',
    });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      'Service request database operation failed',
      { operation: 'list' },
    );
  } finally {
    selectSpy.mockRestore();
    logSpy.mockRestore();
  }
});

it('returns a safe JSON error for malformed JSON', async () => {
  const response = await request(app)
    .post('/api/requests')
    .set('Content-Type', 'application/json')
    .send('{"customerName":');

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    error: 'Invalid JSON body',
  });
});

it('returns 413 when the JSON body exceeds the size limit', async () => {
  const response = await request(app)
    .post('/api/requests')
    .send({
      customerName: 'Alex Example',
      title: 'Printer repair',
      description: 'A'.repeat(17 * 1024),
    });

  expect(response.status).toBe(413);
  expect(response.body).toEqual({
    error: 'Request body too large',
  });
});

it('returns an empty array when no service requests exist', async () => {
  const response = await request(app).get('/api/requests');

  expect(response.status).toBe(200);
  expect(response.body).toEqual([]);
});
