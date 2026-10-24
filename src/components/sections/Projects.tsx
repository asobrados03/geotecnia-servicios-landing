
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectAreas } from "@/data/landing";

export function Projects() {
    return (
        <section
            id="proyectos"
            className="scroll-mt-28 container mx-auto px-4 py-20 md:px-6 md:py-28"
        >
            <header className="mx-auto mb-10 max-w-2xl text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                    ÁMBITOS DE ACTUACIÓN
                </p>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Investigación del terreno para distintas necesidades
                </h2>
                <p className="mt-4 text-muted-foreground">
                    Cada proyecto tiene sus propios condicionantes. El enfoque de la investigación depende de sus
                    objetivos, las características del terreno y la información técnica que se necesita obtener.
                </p>
            </header>

            <div className="grid gap-6 sm:grid-cols-2">
                {projectAreas.map(({ title, desc }) => (
                    <Card key={title} className="border-muted bg-card/60">
                        <CardHeader>
                            <CardTitle>{title}</CardTitle>
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
