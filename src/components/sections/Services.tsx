
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/data/landing";

export function Services() {
    return (
        <section
            id="servicios"
            className="scroll-mt-28 container mx-auto px-4 py-20 md:px-6 md:py-28"
        >
            <header className="mx-auto mb-10 max-w-2xl text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                    Servicios
                </p>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    La información geotécnica que tu proyecto necesita
                </h2>
                <p className="mt-4 text-muted-foreground">
                    Cada proyecto plantea unas necesidades distintas. Conoce nuestros servicios de investigación del
                    terreno y análisis geotécnico para valorar qué actuaciones pueden encajar con tu proyecto.
                </p>
            </header>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {services.map(({ icon: Icon, title, desc }) => (
                    <Card
                        key={title}
                        className="group border-muted bg-card/60 transition-colors hover:bg-card"
                    >
                        <CardHeader>
                            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-primary ring-1 ring-border transition-transform group-hover:scale-105">
                                <Icon aria-hidden="true" />
                            </div>
                            <CardTitle className="text-xl">{title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-6 text-muted-foreground">{desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}
