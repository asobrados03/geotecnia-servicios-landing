import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
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

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) })
  }))
}));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: { send: sendMock }
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
  sendMock.mockResolvedValue({});
  global.fetch = vi.fn(async () => ({ json: async () => ({ success: true, score: 0.9 }) })) as unknown as typeof fetch;
  process.env.RECAPTCHA_SECRET_KEY = 'secret';
  process.env.RESEND_API_KEY = 'resend';
  process.env.CONTACT_TO_EMAIL = 'to@example.com';
  process.env.CONTACT_FROM_EMAIL = 'from@example.com';
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('api/contact handler', () => {
  it('rejects non-POST method', async () => {
    const req: MockReq = { method: 'GET' };
    const res = createRes();
    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 when token missing', async () => {
    const req: MockReq = { method: 'POST', body: { nombre: 'Juan', email: 'juan@example.com', mensaje: 'mensaje largo' } };
    const res = createRes();
    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(400);
    expect(res._json).toEqual({ error: 'Falta token reCAPTCHA' });
  });

  it('returns 400 for invalid payload', async () => {
    const req: MockReq = { method: 'POST', body: { nombre: '', email: 'bad', mensaje: 'mensaje largo', token: 'tok' } };
    const res = createRes();
    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(400);
  });

  it('returns 500 when reCAPTCHA secret is not configured', async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    const req: MockReq = {
      method: 'POST',
      body: { nombre: 'Juan', email: 'juan@example.com', mensaje: 'Mensaje válido', token: 'tok' }
    };
    const res = createRes();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(500);
    expect(res._json).toEqual({ error: 'reCAPTCHA no configurado' });
  });

  it('returns 400 when reCAPTCHA score is too low', async () => {
    global.fetch = vi.fn(async () => ({ json: async () => ({ success: true, score: 0.2 }) })) as unknown as typeof fetch;
    const req: MockReq = {
      method: 'POST',
      body: { nombre: 'Juan', email: 'juan@example.com', mensaje: 'Mensaje válido', token: 'tok' }
    };
    const res = createRes();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(400);
    expect(res._json).toEqual({ error: 'Verificación reCAPTCHA fallida' });
  });

  it('returns 400 when reCAPTCHA verification throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    const req: MockReq = {
      method: 'POST',
      body: { nombre: 'Juan', email: 'juan@example.com', mensaje: 'Mensaje válido', token: 'tok' }
    };
    const res = createRes();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(400);
    expect(res._json).toEqual({ error: 'No se pudo verificar reCAPTCHA' });
  });

  it('returns 500 when Resend is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    const req: MockReq = {
      method: 'POST',
      body: { nombre: 'Juan', email: 'juan@example.com', mensaje: 'Mensaje válido', token: 'tok' }
    };
    const res = createRes();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(500);
    expect(res._json).toEqual({ error: 'Falta RESEND_API_KEY, no se envió email' });
  });

  it('returns 500 when sending email fails', async () => {
    sendMock.mockRejectedValueOnce(new Error('resend outage'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const req: MockReq = {
      method: 'POST',
      body: { nombre: 'Juan', email: 'juan@example.com', mensaje: 'Mensaje válido', token: 'tok' }
    };
    const res = createRes();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(500);
    expect(res._json).toEqual({ error: 'No se pudieron enviar los correos' });
  });

  it('returns 200 on success', async () => {
    process.env.SUPABASE_URL = 'url';
    process.env.SUPABASE_SERVICE_ROLE = 'key';
    const req: MockReq = {
      method: 'POST',
      body: { nombre: 'Juan', email: 'juan@example.com', mensaje: 'Mensaje válido', token: 'tok' }
    };
    const res = createRes();
    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(200);
    expect(res._json).toEqual({ ok: true });
    expect(Resend).toHaveBeenCalledWith('resend');
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
      headers: { 'Reply-To': 'juan@example.com' },
      subject: 'Nueva solicitud de presupuesto de Juan',
      to: 'to@example.com',
    }));
    expect(createClient).toHaveBeenCalledWith('url', 'key', { auth: { persistSession: false } });
  });

  it('returns 200 after emails when Supabase is not configured', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const req: MockReq = {
      method: 'POST',
      body: { nombre: 'Juan', email: 'juan@example.com', empresa: 'ACME', mensaje: 'Mensaje válido', token: 'tok' }
    };
    const res = createRes();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res._json).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('returns 200 when Supabase insert fails after emails are sent', async () => {
    process.env.SUPABASE_URL = 'url';
    process.env.SUPABASE_SERVICE_ROLE = 'key';

    vi.mocked(createClient).mockReturnValueOnce({
      from: () => ({ insert: vi.fn().mockResolvedValue({ error: new Error('database paused') }) })
    } as unknown as ReturnType<typeof createClient>);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

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
