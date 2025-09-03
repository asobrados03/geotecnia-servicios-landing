import { z } from "zod";

export const contactSchema = z.object({
  nombre: z.string()
    .trim()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre es demasiado largo" }),
  email: z.email({ message: "Email inválido" }).max(254),
  empresa: z.string()
    .trim()
    .min(2, { message: "La empresa debe tener al menos 2 caracteres" })
    .max(100, { message: "La empresa es demasiado larga" })
    .optional(),
  mensaje: z.string()
    .trim()
    .min(10, { message: "El mensaje debe tener al menos 10 caracteres" })
    .max(1000, { message: "El mensaje es demasiado largo" }),
});

export type ContactForm = z.infer<typeof contactSchema>;
