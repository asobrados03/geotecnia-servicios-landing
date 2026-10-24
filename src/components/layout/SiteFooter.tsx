import { contactDetails } from "@/data/landing";

const footerLinks = [
    { href: "#servicios", label: "Servicios" },
    { href: "#galeria", label: "Galería" },
    { href: "#proyectos", label: "Ámbitos de trabajo" },
    { href: "#colaboracion", label: "Colaboración" },
    { href: "#proceso", label: "Metodología" },
    { href: "#contacto", label: "Contacto" },
];

export function SiteFooter() {
    return (
        <footer className="border-t bg-background">
            <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row md:px-6">
                <div className="text-center sm:text-left">
                    <p className="font-semibold">Geotecnia y Servicios</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Ingeniería geotécnica para tus proyectos.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Geotecnia y Servicios. Todos los
                        derechos reservados.
                    </p>
                </div>

                <nav
                    aria-label="Navegación del pie de página"
                    className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-muted-foreground"
                >
                    {footerLinks.map(({ href, label }) => (
                        <a key={href} href={href} className="hover:text-foreground">
                            {label}
                        </a>
                    ))}
                    <a
                        href={`mailto:${contactDetails.email}`}
                        className="hover:text-foreground"
                    >
                        Email
                    </a>
                </nav>
            </div>
        </footer>
    );
}
