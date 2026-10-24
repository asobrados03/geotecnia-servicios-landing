
import { faqs } from "@/data/landing";

export function Faq() {
    return (
        <section
            id="preguntas-frecuentes"
            className="scroll-mt-28 container mx-auto px-4 py-20 md:px-6 md:py-28"
        >
            <header className="mx-auto mb-10 max-w-2xl text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                    PREGUNTAS FRECUENTES
                </p>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Resolvamos tus primeras dudas
                </h2>
            </header>

            <div className="mx-auto max-w-3xl divide-y rounded-xl border px-5">
                {faqs.map(({ question, answer }) => (
                    <details key={question} className="group py-5">
                        <summary className="cursor-pointer list-none pr-6 font-semibold marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {question}
                  <span
                      aria-hidden="true"
                      className="text-xl text-muted-foreground transition-transform group-open:rotate-45"
                  >
                  +
                </span>
              </span>
                        </summary>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                            {answer}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    );
}
