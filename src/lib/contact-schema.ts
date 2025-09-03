import { z } from "zod";

// Regex para emails: evita rangos inválidos al colocar el guion al final.
export const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Regex para nombres: permite letras, espacios, apóstrofes y guiones.
export const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/;

export const contactSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre es demasiado largo" })
    .regex(NAME_REGEX, { message: "El nombre contiene caracteres inválidos" }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Email inválido" })
    .max(254, { message: "Email demasiado largo" })
    .regex(EMAIL_REGEX, { message: "Email inválido" }),
  empresa: z
    .string()
    .trim()
    .min(2, { message: "La empresa debe tener al menos 2 caracteres" })
    .max(100, { message: "La empresa es demasiado larga" })
    .optional(),
  mensaje: z
    .string()
    .trim()
    .min(10, { message: "El mensaje debe tener al menos 10 caracteres" })
    .max(1000, { message: "El mensaje es demasiado largo" }),
});

export type ContactForm = z.infer<typeof contactSchema>;
