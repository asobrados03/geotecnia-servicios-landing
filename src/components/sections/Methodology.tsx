
import { methodologySteps } from "@/data/landing";

export function Methodology() {
    return (
        <section
            id="proceso"
            className="scroll-mt-28 container mx-auto px-4 py-20 md:px-6 md:py-28"
        >
            <header className="mx-auto mb-10 max-w-2xl text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                    METODOLOGÍA
                </p>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Del planteamiento inicial a las conclusiones técnicas
                </h2>
                <p className="mt-4 text-muted-foreground">
                    Cada proyecto requiere una investigación acorde con sus necesidades. Este es el proceso general
                    para definir el alcance, estudiar el terreno e interpretar los resultados.
                </p>
            </header>

            <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {methodologySteps.map(({ title, desc }, index) => (
                    <li
                        key={title}
                        className="rounded-lg border bg-card p-6 shadow-sm"
                    >
            <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[hsl(var(--brand-600))] to-[hsl(var(--brand-400))] text-sm font-bold text-primary-foreground">
              {index + 1}
            </span>
                        <h3 className="font-semibold">{title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {desc}
                        </p>
                    </li>
                ))}
            </ol>
        </section>
    );
}
