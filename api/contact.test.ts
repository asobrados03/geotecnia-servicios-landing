import { describe, expect, it, beforeEach, vi } from 'vitest';
import handler from './contact';

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

function createRes() {
  const res: any = { statusCode: 200, _json: null };
  res.status = function(code: number) { this.statusCode = code; return this; };
  res.json = function(data: any) { this._json = data; return this; };
  return res;
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.RECAPTCHA_SECRET_KEY = 'secret';
});

describe('api/contact handler', () => {
  it('rejects non-POST method', async () => {
    const req: any = { method: 'GET' };
    const res: any = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 when token missing', async () => {
    const req: any = { method: 'POST', body: { nombre: 'a', email: 'a@a.com', mensaje: 'mensaje largo' } };
    const res: any = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid payload', async () => {
    const req: any = { method: 'POST', body: { nombre: '', email: 'bad', mensaje: 'mensaje largo', token: 'tok' } };
    const res: any = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 on success', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ json: () => ({ success: true, score: 0.9 }) })) as any;
    process.env.SUPABASE_URL = 'url';
    process.env.SUPABASE_SERVICE_ROLE = 'key';
    process.env.RESEND_API_KEY = 'resend';
    process.env.CONTACT_TO_EMAIL = 'to@example.com';
    process.env.CONTACT_FROM_EMAIL = 'from@example.com';
    const req: any = { method: 'POST', body: { nombre: 'Juan', email: 'juan@example.com', mensaje: 'Mensaje válido', token: 'tok' } };
    const res: any = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._json).toEqual({ ok: true });
  });
});
