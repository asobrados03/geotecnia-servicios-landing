
import { useEffect, useRef } from "react";
import heroImage from "@/assets/hero-geotech.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function Hero() {
    const heroRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const element = heroRef.current;
        if (!element) return;

        const handleMouseMove = (event: MouseEvent) => {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                return;
            }

            const rect = element.getBoundingClientRect();
            element.style.setProperty("--px", `${event.clientX - rect.left}px`);
            element.style.setProperty("--py", `${event.clientY - rect.top}px`);
        };

        element.addEventListener("mousemove", handleMouseMove);
        return () => element.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <section ref={heroRef} className="relative isolate overflow-hidden">
            <article className="container mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-24">
                <div className="relative z-10 flex flex-col items-start justify-center">
                    <Badge className="mb-4">INGENIERÍA GEOTÉCNICA · SEGOVIA Y PROVINCIAS CERCANAS</Badge>

                    <h1 className="mb-5 text-4xl font-extrabold tracking-tight md:text-5xl">
                        Conoce el terreno. Decide con criterio. Proyecta con confianza.
                    </h1>

                    <p className="mb-8 max-w-xl text-muted-foreground md:text-lg">
                        Estudios geotécnicos, sondeos y ensayos para arquitectos e ingenierías que necesitan conocer
                        las condiciones del subsuelo y contar con un colaborador técnico para sus proyectos.
                    </p>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <Button asChild variant="hero" size="lg">
                            <a href="#contacto">
                                Hablemos de tu proyecto
                                <ChevronRight className="ml-1" />
                            </a>
                        </Button>

                        <Button asChild variant="outline" size="lg">
                            <a href="#servicios">Explorar servicios</a>
                        </Button>
                    </div>

                    <div className="mt-10 grid w-full grid-cols-3 gap-4 text-center sm:text-left">
                        <div>
                            <p className="text-3xl font-extrabold">25+</p>
                            <p className="text-xs text-muted-foreground">Años de experiencia</p>
                        </div>
                        <div>
                            <p className="text-3xl font-extrabold">500+</p>
                            <p className="text-xs text-muted-foreground">Sondeos realizados</p>
                        </div>
                        <div>
                            <p className="text-3xl font-extrabold">24h*</p>
                            <p className="text-xs text-muted-foreground">Tiempo de respuesta</p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div
                        aria-hidden="true"
                        className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-tr from-[hsl(var(--brand-600)/.15)] to-[hsl(var(--brand-300)/.15)] blur-2xl"
                    />
                    <div
                        className="relative overflow-hidden rounded-xl border bg-card shadow"
                        style={{ boxShadow: "var(--shadow-elevated)" }}
                    >
                        <img
                            src={heroImage}
                            alt="Trabajos de perforación para investigación geotécnica"
                            fetchPriority="high"
                            className="h-72 w-full object-cover md:h-[420px]"
                        />
                    </div>
                </div>
            </article>

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-0"
                style={{
                    background:
                        "radial-gradient(600px circle at var(--px,50%) var(--py,50%), hsl(var(--brand-400)/0.15), transparent 40%)",
                }}
            />
        </section>
    );
}
