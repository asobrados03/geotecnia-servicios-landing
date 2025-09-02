import { describe, expect, it } from 'vitest';
import { contactSchema } from './contact-schema';

const valid = {
  nombre: 'Juan Perez',
  email: 'juan@example.com',
  empresa: 'ACME',
  mensaje: 'Hola, necesito un servicio geotecnico.'
};

describe('contactSchema', () => {
  it('accepts valid data', () => {
    const parsed = contactSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const parsed = contactSchema.safeParse({ ...valid, email: 'bad-email' });
    expect(parsed.success).toBe(false);
  });

  it('rejects short message', () => {
    const parsed = contactSchema.safeParse({ ...valid, mensaje: 'hola' });
    expect(parsed.success).toBe(false);
  });

  it('allows optional empresa', () => {
    const parsed = contactSchema.safeParse({ ...valid, empresa: undefined });
    expect(parsed.success).toBe(true);
  });
});
