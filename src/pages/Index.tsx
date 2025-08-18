import { useEffect, useMemo, useRef, useState } from "react";
import heroImage from "@/assets/hero-geotech.jpg";
import logoImage from "@/assets/LOGO.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Layers,
  Hammer,
  Ruler,
  Waves,
  Building2,
  LineChart,
  ChevronRight,
} from "lucide-react";

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const Index = () => {
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const handle = (e: MouseEvent) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--px", `${x}px`);
      el.style.setProperty("--py", `${y}px`);
    };
    el.addEventListener("mousemove", handle);
    return () => el.removeEventListener("mousemove", handle);
  }, []);

  const services = useMemo(
    () => [
      {
        icon: Layers,
        title: "Estudios geotécnicos",
        desc: "Caracterización integral del terreno para el diseño seguro de cimentaciones.",
      },
      {
        icon: Hammer,
        title: "Sondeos y perforación",
        desc: "Sondeos SPT, toma de muestras inalteradas y monitoreo piezométrico.",
      },
      {
        icon: Ruler,
        title: "Ensayos in situ",
        desc: "SPT, CPTu, DPL/DPM y ensayos de placa con equipos certificados.",
      },
      {
        icon: Waves,
        title: "Geofísica aplicada",
        desc: "Sísmica MASW/ReMi, tomografía eléctrica y perfilaje geofísico.",
      },
      {
        icon: Building2,
        title: "Mecánica de suelos",
        desc: "Cálculo de capacidad portante, asentamientos y estabilidad de taludes.",
      },
      {
        icon: LineChart,
        title: "Monitoreo y auscultación",
        desc: "Piezómetros, inclinómetros y control de deformaciones en obra.",
      },
    ],
    []
  );

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const valor = form.get("nombre");
    const nombre = typeof valor === "string" ? valor : "";
    toast({
      title: "Gracias por tu interés",
      description: `${nombre ? nombre + ", " : ""}hemos recibido tu mensaje y te responderemos en menos de 24h.`,
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <a href="/index.html" className="flex items-center gap-2" aria-label="Geotecnia y Servicios">
            <img src="/src/assets/LOGO.png" alt="Logo de Geotecnia y Servicios (G&S)" className="h-8 w-8 rounded-sm object-contain" width={32} height={32} />
            <span className="font-extrabold tracking-tight">Geotecnia y Servicios</span>
          </a>
          <nav aria-label="Navegación principal" className="hidden gap-6 md:flex">
            <a href="#servicios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Servicios</a>
            <a href="#galeria" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Galería</a>
            <a href="#proyectos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Proyectos</a>
            <a href="#proceso" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Proceso</a>
            <a href="#contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contacto</a>
          </nav>
          <div className="hidden md:block">
            <Button variant="hero" size="lg" onClick={() => scrollTo("contacto")}>Solicitar presupuesto</Button>
          </div>
        </div>
      </header>

      <main>
        <section ref={heroRef} className="relative overflow-hidden">
          <article className="container mx-auto grid gap-10 py-20 md:grid-cols-2 md:gap-16 md:py-28">
            <div className="relative z-10 flex flex-col items-start justify-center">
              <Badge className="mb-4">Ingeniería geotécnica</Badge>
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
                Servicios geotécnicos profesionales para obras seguras
              </h1>
              <p className="mb-8 text-muted-foreground md:text-lg">
                Estudios, sondeos y ensayos con estándares de clase mundial. Reducimos la incertidumbre del subsuelo para tomar decisiones confiables.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="hero" size="lg" onClick={() => scrollTo("contacto")}>
                  Comenzar proyecto
                  <ChevronRight className="ml-1" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => scrollTo("servicios")}>Ver servicios</Button>
              </div>

              <div className="mt-10 grid w-full grid-cols-3 gap-4 text-center md:text-left">
                <div>
                  <p className="text-3xl font-extrabold">25+</p>
                  <p className="text-xs text-muted-foreground">Años de experiencia</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold">500+</p>
                  <p className="text-xs text-muted-foreground">Sondeos realizados</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold">24h</p>
                  <p className="text-xs text-muted-foreground">Tiempo de respuesta</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-tr from-[hsl(var(--brand-600)/.15)] to-[hsl(var(--brand-300)/.15)] blur-2xl" aria-hidden />
              <div className="relative overflow-hidden rounded-xl border bg-card shadow" style={{ boxShadow: "var(--shadow-elevated)" }}>
                <img
                  src={heroImage}
                  alt="Perforación geotécnica al amanecer con líneas de contorno superpuestas"
                  className="h-72 w-full object-cover md:h-[420px]"
                />
              </div>
            </div>
          </article>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(600px circle at var(--px,50%) var(--py,50%), hsl(var(--brand-400)/0.15), transparent 40%)",
            }}
          />
        </section>

        <section id="servicios" className="container mx-auto py-20 md:py-28">
          <header className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Servicios geotécnicos</h2>
            <p className="mt-3 text-muted-foreground">Soluciones técnicas para cada fase del proyecto, desde la campaña de campo hasta el informe final.</p>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Card key={s.title} className="group border-muted bg-card/60 transition-colors hover:bg-card">
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-primary ring-1 ring-border group-hover:scale-105 transition-transform">
                    <s.icon />
                  </div>
                  <CardTitle className="text-xl">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Galería (sección anclada) */}
        <section id="galeria" className="container mx-auto py-20 md:py-28">
          <header className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Galería de imágenes</h2>
            <p className="mt-3 text-muted-foreground">Algunas capturas representativas de nuestros trabajos.</p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-0">
                <img src={heroImage} alt="Perforación geotécnica" className="h-56 w-full rounded-t-md object-cover" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <img src={logoImage} alt="Logo de G&S" className="h-56 w-full rounded-t-md object-contain bg-muted" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <img src={heroImage} alt="Equipo de campo" className="h-56 w-full rounded-t-md object-cover" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Proyectos (sección anclada) */}
        <section id="proyectos" className="container mx-auto py-20 md:py-28">
          <header className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Proyectos</h2>
            <p className="mt-3 text-muted-foreground">Selección de áreas de trabajo y estudios realizados.</p>
          </header>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-muted bg-card/60">
              <CardHeader>
                <CardTitle>Estudios Geotécnicos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Campañas de campo (SPT/CPTu), caracterización estratigráfica, parámetros de resistencia y recomendaciones de cimentación.
                </p>
              </CardContent>
            </Card>
            <Card className="border-muted bg-card/60">
              <CardHeader>
                <CardTitle>Control de obra lineal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Auscultación y control de deformaciones en carreteras, tuberías y corredores ferroviarios.
                </p>
              </CardContent>
            </Card>
            <Card className="border-muted bg-card/60">
              <CardHeader>
                <CardTitle>Mapas de isopiezas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Modelación hidrogeológica y elaboración de mapas de isopiezas para diseño y gestión de acuíferos.
                </p>
              </CardContent>
            </Card>
            <Card className="border-muted bg-card/60">
              <CardHeader>
                <CardTitle>Estudios de recurrencia de avenidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Análisis estadístico de crecidas, periodos de retorno y soporte para diseño hidráulico.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="proceso" className="bg-muted/30 py-20 md:py-28">
          <div className="container mx-auto">
            <header className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Nuestro proceso</h2>
              <p className="mt-3 text-muted-foreground">Metodología clara, resultados confiables.</p>
            </header>
            <div className="grid gap-6 md:grid-cols-4">
              {["Reunión inicial y alcance","Campaña de campo","Laboratorio y análisis","Informe y asesoría"].map((step, i) => (
                <div key={step} className="relative rounded-lg border bg-card p-6 shadow-sm">
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[hsl(var(--brand-600))] to-[hsl(var(--brand-400))] text-primary-foreground text-sm font-bold">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold">{step}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {[
                      "Revisión de antecedentes y definición de objetivos.",
                      "Sondeos, ensayos y toma de muestras con control de calidad.",
                      "Ensayos normalizados y modelación geotécnica.",
                      "Entrega de informe con recomendaciones y soporte en obra.",
                    ][i]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contacto" className="container mx-auto py-20 md:py-28">
          <header className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Solicita un presupuesto</h2>
            <p className="mt-3 text-muted-foreground">Cuéntanos sobre tu proyecto y te responderemos en menos de 24 horas.</p>
          </header>

          <form onSubmit={handleSubmit} className="mx-auto grid max-w-2xl gap-4 rounded-xl border bg-card p-6 shadow" aria-label="Formulario de contacto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
                <input id="nombre" name="nombre" required className="h-11 rounded-md border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input id="email" name="email" type="email" required className="h-11 rounded-md border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="empresa" className="text-sm font-medium">Empresa (opcional)</label>
              <input id="empresa" name="empresa" className="h-11 rounded-md border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="mensaje" className="text-sm font-medium">Mensaje</label>
              <textarea id="mensaje" name="mensaje" rows={4} required className="rounded-md border bg-background px-3 py-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="submit" variant="hero" size="lg">Enviar</Button>
              <a href="mailto:contacto@geoinsight.com" className="text-sm text-muted-foreground hover:text-foreground">o escríbenos a contacto@geoinsight.com</a>
            </div>
          </form>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Geotecnia y Servicios. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#servicios" className="hover:text-foreground">Servicios</a>
            <a href="#galeria" className="hover:text-foreground">Galería</a>
            <a href="#proyectos" className="hover:text-foreground">Proyectos</a>
            <a href="#proceso" className="hover:text-foreground">Proceso</a>
            <a href="#contacto" className="hover:text-foreground">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
