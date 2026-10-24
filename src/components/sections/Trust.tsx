
import { trustMetrics } from "@/data/landing";

export function Trust() {
    return (
        <section className="border-y bg-muted/30 py-16 md:py-20">
            <div className="container mx-auto px-4 md:px-6">
                <header className="mx-auto mb-10 max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Experiencia para fundamentar las decisiones de proyecto
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                        La investigación geotécnica aporta información relevante para comprender las condiciones del
                        subsuelo. La experiencia permite abordar cada actuación atendiendo a sus necesidades y al alcance de los trabajos.
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
                    {trustMetrics.map(({ value, label }) => (
                        <div key={label}>
                            <p className="text-4xl font-extrabold tracking-tight">{value}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
