
import logoUrl from "@/assets/LOGO.png";
import { Button } from "@/components/ui/button";

const navItems = [
    { href: "#servicios", label: "Servicios" },
    { href: "#galeria", label: "Galería" },
    { href: "#proyectos", label: "Ámbitos de trabajo" },
    { href: "#colaboracion", label: "Colaboración" },
    { href: "#proceso", label: "Metodología" },
    { href: "#contacto", label: "Contacto" },
];

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6">
                <a
                    href="/"
                    className="flex shrink-0 items-center gap-2"
                    aria-label="Geotecnia y Servicios, inicio"
                >
                    <img
                        src={logoUrl}
                        alt="Logo de Geotecnia y Servicios"
                        className="h-11 w-11 rounded-sm object-contain"
                        width={42}
                        height={42}
                    />
                    <span className="font-extrabold tracking-tight">
            Geotecnia y Servicios
          </span>
                </a>

                <nav
                    aria-label="Navegación principal"
                    className="hidden items-center gap-5 lg:flex"
                >
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <Button asChild variant="hero" size="lg" className="hidden sm:inline-flex">
                    <a href="#contacto">Solicitar propuesta</a>
                </Button>
            </div>

            <nav
                aria-label="Navegación móvil"
                className="flex gap-4 overflow-x-auto border-t px-4 py-2 lg:hidden"
            >
                {navItems.map((item) => (
                    <a
                        key={item.href}
                        href={item.href}
                        className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                        {item.label}
                    </a>
                ))}
            </nav>
        </header>
    );
}
