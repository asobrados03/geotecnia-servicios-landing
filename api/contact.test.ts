import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './contact';

interface MockReq {
  method: string;
  body?: Record<string, unknown>;
}

interface MockRes {
  statusCode: number;
  _json: unknown;
  status(code: number): MockRes;
  json(data: unknown): MockRes;
}

// Mocks
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) })
  }))
}));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: { send: vi.fn().mockResolvedValue({}) }
  }))
}));

function createRes(): MockRes {
  return {
    statusCode: 200,
    _json: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this._json = data;
      return this;
    }
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.RECAPTCHA_SECRET_KEY = 'secret';
});

describe('api/contact handler', () => {
  it('rejects non-POST method', async () => {
    const req: MockReq = { method: 'GET' };
    const res = createRes();
    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 when token missing', async () => {
    const req: MockReq = { method: 'POST', body: { nombre: 'a', email: 'a@a.com', mensaje: 'mensaje largo' } };
    const res = createRes();
    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid payload', async () => {
    const req: MockReq = { method: 'POST', body: { nombre: '', email: 'bad', mensaje: 'mensaje largo', token: 'tok' } };
    const res = createRes();
    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 on success', async () => {
    global.fetch = vi.fn(async () => ({ json: async () => ({ success: true, score: 0.9 }) })) as unknown as typeof fetch;
    process.env.SUPABASE_URL = 'url';
    process.env.SUPABASE_SERVICE_ROLE = 'key';
    process.env.RESEND_API_KEY = 'resend';
    process.env.CONTACT_TO_EMAIL = 'to@example.com';
    process.env.CONTACT_FROM_EMAIL = 'from@example.com';
    const req: MockReq = {
      method: 'POST',
      body: { nombre: 'Juan', email: 'juan@example.com', mensaje: 'Mensaje válido', token: 'tok' }
    };
    const res = createRes();
    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(200);
    expect(res._json).toEqual({ ok: true });
  });
});
