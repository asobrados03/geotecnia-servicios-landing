import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Expected env vars (configure in Vercel Project Settings -> Environment Variables)
// - RESEND_API_KEY
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE (server-side, DO NOT expose in client)
// - CONTACT_TO_EMAIL (e.g., geotecniayservicios@gmail.com)
// - CONTACT_FROM_EMAIL (e.g., solicitudes@tudominio.com)
// - RECAPTCHA_SECRET (if using reCAPTCHA v2/3)

// Minimal email validator
const isEmail = (s: string) => /.+@.+\..+/.test(s);

// Optional: verify reCAPTCHA token server-side
async function verifyRecaptcha(token?: string) {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return true; // if not configured, skip
  if (!token) return false;

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean; score?: number };
    return !!data.success && (typeof data.score !== "number" || data.score >= 0.5);
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nombre, email, empresa, mensaje, recaptchaToken } = req.body || {};

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  if (!isEmail(String(email))) {
    return res.status(400).json({ error: "Email inválido" });
  }

  // Basic rate limit (per IP) using in-memory map (resets on cold start). For production, use KV/Upstash if needed.
  // const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").toString();
  // No persistent store here to keep example simple.

  // Verify captcha if configured
  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    return res.status(400).json({ error: "Verificación anti-spam fallida" });
  }

  // Insert into Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE; // server-side only
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Supabase no configurado" });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  const insertPayload = {
    nombre: String(nombre),
    email: String(email),
    empresa: empresa ? String(empresa) : null,
    mensaje: String(mensaje),
    created_at: new Date().toISOString(),
  };

  const { error: dbError } = await supabase.from("contact_requests").insert(insertPayload);
  if (dbError) {
    return res.status(500).json({ error: `No se pudo guardar en Supabase: ${dbError.message}` });
  }

  // Send emails via Resend
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "geotecniayservicios@gmail.com";
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "no-reply@geotecniayservicios.es";

  if (!resendKey) {
    // Record already saved, but cannot send notification emails
    return res.status(500).json({ error: "Falta RESEND_API_KEY, no se envió email" });
  }

  const resend = new Resend(resendKey);

  // Notification to professional
  const subject = `Nueva solicitud de presupuesto de ${nombre}`;
  const empresaLine = empresa ? `\nEmpresa: ${empresa}` : "";
  const bodyText = `Nueva solicitud de presupuesto:\n\nNombre: ${nombre}\nEmail: ${email}${empresaLine}\n\nMensaje:\n${mensaje}\n\n—\nEste correo fue enviado automáticamente por la web.`;

  try {
    // Use Reply-To so replying goes to the client
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      text: bodyText,
      headers: { "Reply-To": email },
    });

    // Auto-response to client
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Hemos recibido tu solicitud",
      text: `Hola ${nombre},\n\nGracias por contactarnos. Hemos recibido tu solicitud y te responderemos en menos de 24h.\n\nUn saludo,\nGeotecnia y Servicios`,
    });
  } catch (err) {
    console.error("Error enviando correos de contacto", err);
    return res.status(500).json({ error: "No se pudieron enviar los correos" });
  }

  return res.status(200).json({ ok: true });
}

