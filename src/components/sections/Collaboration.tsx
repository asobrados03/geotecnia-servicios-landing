
import { Button } from "@/components/ui/button";

export function Collaboration() {
    return (
        <section
            id="colaboracion"
            className="scroll-mt-28 border-y bg-muted/30 py-20 md:py-24"
        >
            <div className="container mx-auto grid items-center gap-8 px-4 md:grid-cols-2 md:px-6">
                <div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                        Para arquitectos e ingenierías
                    </p>
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Un colaborador geotécnico para tus proyectos
                    </h2>
                </div>

                <div>
                    <p className="leading-7 text-muted-foreground">
                        Cuando trabajas en distintos proyectos, contar con un interlocutor geotécnico facilita la
                        comunicación y ayuda a coordinar las necesidades de investigación del terreno.

                        En Geotecnia y Servicios puedes encontrar un punto de contacto para consultar las necesidades
                        geotécnicas de una actuación y valorar cómo abordar los trabajos según el proyecto.

                        Tanto si necesitas apoyo para un proyecto concreto como si buscas establecer una colaboración
                        recurrente, hablemos de las necesidades de tu equipo.
                    </p>

                    <Button asChild variant="hero" size="lg" className="mt-6">
                        <a href="#contacto">Hablemos de una colaboración</a>
                    </Button>
                </div>
            </div>
        </section>
    );
}
