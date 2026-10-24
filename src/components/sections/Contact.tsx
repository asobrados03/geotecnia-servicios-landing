
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { contactSchema } from "@/lib/contact-schema";
import { contactDetails } from "@/data/landing";

declare global {
    interface Window {
        grecaptcha?: {
            ready(callback: () => void): void;
            execute(
                siteKey: string,
                options: { action: string },
            ): Promise<string>;
        };
    }
}

const RECAPTCHA_SCRIPT_ID = "google-recaptcha-v3";

function useRecaptchaScript() {
    useEffect(() => {
        const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
        if (!siteKey) return;

        const existing = document.getElementById(RECAPTCHA_SCRIPT_ID);
        if (existing) return;

        const script = document.createElement("script");
        script.id = RECAPTCHA_SCRIPT_ID;
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            // No eliminar un script compartido si otro montaje ya puede utilizarlo.
            // El script se mantiene disponible durante la vida de la aplicación.
        };
    }, []);
}

async function getRecaptchaToken(): Promise<string> {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    if (!siteKey || !window.grecaptcha) return "";

    try {
        await new Promise<void>((resolve) => {
            window.grecaptcha!.ready(resolve);
        });

        return await window.grecaptcha.execute(siteKey, { action: "contact" });
    } catch {
        return "";
    }
}

function extractFormData(form: FormData) {
    const nombre = form.get("nombre");
    const email = form.get("email");
    const empresa = form.get("empresa");
    const mensaje = form.get("mensaje");

    return {
        nombre: typeof nombre === "string" ? nombre : "",
        email: typeof email === "string" ? email : "",
        empresa:
            typeof empresa === "string" && empresa.trim()
                ? empresa.trim()
                : undefined,
        mensaje: typeof mensaje === "string" ? mensaje : "",
    };
}

export function Contact() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    useRecaptchaScript();

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> {
        event.preventDefault();
        if (isSubmitting) return;

        const formElement = event.currentTarget;
        const formData = new FormData(formElement);

        // Honeypot anti-spam: descartar silenciosamente los envíos automatizados.
        const website = formData.get("website");
        if (typeof website === "string" && website.trim() !== "") {
            formElement.reset();
            return;
        }

        const parsed = contactSchema.safeParse(extractFormData(formData));

        if (!parsed.success) {
            toast({
                title: "Revisa los datos",
                description: parsed.error.issues[0]?.message || "Datos inválidos.",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { nombre, email, empresa, mensaje } = parsed.data;
            const token = await getRecaptchaToken();

            if (!token) {
                toast({
                    title: "No se pudo verificar el envío",
                    description:
                        "No ha sido posible completar la verificación de seguridad. Inténtalo de nuevo.",
                });
                return;
            }

            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre,
                    email,
                    empresa: empresa ?? null,
                    mensaje,
                    token,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data?.ok) {
                throw new Error(data?.error || "No se pudo enviar tu solicitud.");
            }

            toast({
                title: "Gracias por contactar",
                description: `${nombre ? `${nombre}, ` : ""}hemos recibido tu mensaje y te responderemos en menos de 24 horas.`,
            });

            formElement.reset();
        } catch (error: unknown) {
            toast({
                title: "No se ha podido enviar el mensaje",
                description:
                    error instanceof Error
                        ? error.message
                        : "Inténtalo de nuevo en unos minutos.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section
            id="contacto"
            className="scroll-mt-28 container mx-auto px-4 py-20 md:px-6 md:py-28"
        >
            <header className="mx-auto mb-10 max-w-2xl text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                    CONTACTO
                </p>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Hablemos de las necesidades geotécnicas de tu proyecto
                </h2>
                <p className="mt-4 text-muted-foreground">
                    Cuéntanos dónde se encuentra la actuación, qué tipo de proyecto estás desarrollando y en qué fase
                    se encuentra. Con esta información podremos valorar tu consulta y orientarte sobre los
                    siguientes pasos.

                    No necesitas redactar una memoria técnica para contactar. Empieza por explicarnos lo esencial
                    del proyecto.
                </p>
            </header>

            <form
                onSubmit={handleSubmit}
                className="mx-auto grid max-w-2xl gap-4 rounded-xl border bg-card p-6 shadow"
                aria-label="Formulario de contacto"
            >
                <div
                    className="absolute -left-[10000px] h-px w-px overflow-hidden"
                    aria-hidden="true"
                >
                    <label htmlFor="website">No rellenes este campo</label>
                    <input
                        id="website"
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <label htmlFor="nombre" className="text-sm font-medium">
                            Nombre *
                        </label>
                        <input
                            id="nombre"
                            name="nombre"
                            required
                            maxLength={100}
                            autoComplete="name"
                            className="h-11 rounded-md border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="email" className="text-sm font-medium">
                            Email profesional *
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            maxLength={254}
                            autoComplete="email"
                            className="h-11 rounded-md border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <label htmlFor="empresa" className="text-sm font-medium">
                        Empresa o estudio
                    </label>
                    <input
                        id="empresa"
                        name="empresa"
                        maxLength={100}
                        autoComplete="organization"
                        className="h-11 rounded-md border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>

                <div className="grid gap-2">
                    <label htmlFor="mensaje" className="text-sm font-medium">
                        Cuéntanos sobre el proyecto *
                    </label>
                    <textarea
                        id="mensaje"
                        name="mensaje"
                        rows={5}
                        required
                        maxLength={1000}
                        placeholder="Ubicación, tipo de actuación, fase del proyecto y necesidades geotécnicas que conoces hasta ahora."
                        className="rounded-md border bg-background px-3 py-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <p className="text-xs text-muted-foreground">
                        No incluyas información confidencial que no sea necesaria para
                        valorar tu consulta.
                    </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        type="submit"
                        variant="hero"
                        size="lg"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Enviando..." : "Enviar consulta"}
                    </Button>

                    <a
                        href={`mailto:${contactDetails.email}`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        ¿Prefieres escribirnos directamente?
                    </a>
                </div>
            </form>
        </section>
    );
}
