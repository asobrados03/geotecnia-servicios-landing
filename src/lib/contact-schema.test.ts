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

  it('trims string fields before returning parsed data', () => {
    const parsed = contactSchema.safeParse({
      nombre: '  Ana Ruiz  ',
      email: 'ana@example.com',
      empresa: '  GeoLab  ',
      mensaje: '  Necesito revisar una cimentación existente.  ',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        nombre: 'Ana Ruiz',
        email: 'ana@example.com',
        empresa: 'GeoLab',
        mensaje: 'Necesito revisar una cimentación existente.',
      });
    }
  });

  it('rejects fields over their maximum lengths', () => {
    expect(contactSchema.safeParse({ ...valid, nombre: 'a'.repeat(101) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, email: `${'a'.repeat(246)}@test.com` }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, empresa: 'a'.repeat(101) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, mensaje: 'a'.repeat(1001) }).success).toBe(false);
  });
});
