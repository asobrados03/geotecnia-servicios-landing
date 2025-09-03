import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { contactSchema } from "../src/lib/contact-schema.js";

// Expected env vars (configure in Vercel Project Settings -> Environment Variables)
// - RESEND_API_KEY
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE (server-side, DO NOT expose in client)
// - CONTACT_TO_EMAIL (e.g., geotecniayservicios@gmail.com)
// - CONTACT_FROM_EMAIL (e.g., solicitudes@tudominio.com)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nombre, email, empresa, mensaje, token } = req.body || {};
  const parsed = contactSchema.safeParse({ nombre, email, empresa, mensaje });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Datos inválidos";
    return res.status(400).json({ error: msg });
  }
  const { nombre: nombreV, email: emailV, empresa: empresaV, mensaje: mensajeV } = parsed.data;

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ error: "reCAPTCHA no configurado" });
  }
  if (!token) {
    return res.status(400).json({ error: "Falta token reCAPTCHA" });
  }
  try {
    const params = new URLSearchParams({ secret, response: String(token) });
    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success || (verifyData.score ?? 0) < 0.5) {
      return res.status(400).json({ error: "Verificación reCAPTCHA fallida" });
    }
  } catch {
    return res.status(400).json({ error: "No se pudo verificar reCAPTCHA" });
  }

  // Basic rate limit (per IP) using in-memory map (resets on cold start). For production, use KV/Upstash if needed.
  // const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").toString();
  // No persistent store here to keep example simple.

  // Insert into Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE; // server-side only
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Supabase no configurado" });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  const insertPayload = {
    nombre: nombreV,
    email: emailV,
    empresa: empresaV ?? null,
    mensaje: mensajeV,
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
  const subject = `Nueva solicitud de presupuesto de ${nombreV}`;
  const empresaLine = empresaV ? `\nEmpresa: ${empresaV}` : "";
  const bodyText = `Nueva solicitud de presupuesto:\n\nNombre: ${nombreV}\nEmail: ${emailV}${empresaLine}\n\nMensaje:\n${mensajeV}\n\n—\nEste correo fue enviado automáticamente por la web.`;

  try {
    // Use Reply-To so replying goes to the client
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      text: bodyText,
      headers: { "Reply-To": emailV },
    });

    // Auto-response to client
    await resend.emails.send({
      from: fromEmail,
      to: emailV,
      subject: "Hemos recibido tu solicitud",
      text: `Hola ${nombreV},\n\nGracias por contactarnos. Hemos recibido tu solicitud y te responderemos en menos de 24h.\n\nUn saludo,\nGeotecnia y Servicios`,
    });
  } catch (err) {
    console.error("Error enviando correos de contacto", err);
    return res.status(500).json({ error: "No se pudieron enviar los correos" });
  }

  return res.status(200).json({ ok: true });
}

