
import { useState } from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Loader2 } from "lucide-react";

const galleryModules = import.meta.glob(
    "/src/assets/gallery/*.{png,jpg,jpeg,webp}",
    {
        eager: true,
        import: "default",
        query: "?url",
    },
) as Record<string, string>;

const galleryImages = Object.entries(galleryModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, src]) => ({
        src,
        alt: (path.split("/").pop() || "Trabajo geotécnico")
            .replace(/[-_]/g, " ")
            .replace(/\.[^.]+$/, ""),
    }));

function GalleryImage({ src, alt }: { src: string; alt: string }) {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);

    return (
        <CarouselItem className="basis-full sm:basis-1/2 lg:basis-1/3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md border bg-card">
                {!loaded && !failed && (
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        aria-label="Cargando imagen"
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {failed ? (
                    <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                        No se ha podido cargar esta imagen.
                    </div>
                ) : (
                    <img
                        src={src}
                        alt={alt}
                        loading="lazy"
                        onLoad={() => setLoaded(true)}
                        onError={() => setFailed(true)}
                        className={`h-full w-full object-cover transition-opacity duration-300 ${
                            loaded ? "opacity-100" : "opacity-0"
                        }`}
                    />
                )}
            </div>
        </CarouselItem>
    );
}

export function Gallery() {
    return (
        <section
            id="galeria"
            className="scroll-mt-28 bg-muted/30 py-20 md:py-28"
        >
            <div className="container mx-auto px-4 md:px-6">
                <header className="mx-auto mb-10 max-w-2xl text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                        TRABAJO DE CAMPO
                    </p>
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Conoce nuestro trabajo sobre el terreno
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                        Una muestra visual de los trabajos de investigación geotécnica, sondeos, ensayos y otras
                        actuaciones que forman parte de nuestra actividad.
                    </p>
                </header>

                {galleryImages.length > 0 ? (
                    <Carousel
                        className="mx-auto max-w-6xl"
                        opts={{ align: "start", loop: galleryImages.length > 1 }}
                    >
                        <CarouselContent>
                            {galleryImages.map(({ src, alt }) => (
                                <GalleryImage key={src} src={src} alt={alt} />
                            ))}
                        </CarouselContent>
                        <CarouselPrevious
                            aria-label="Imagen anterior"
                            className="left-2 lg:-left-12"
                        />
                        <CarouselNext
                            aria-label="Imagen siguiente"
                            className="right-2 lg:-right-12"
                        />
                    </Carousel>
                ) : (
                    <p className="text-center text-muted-foreground">
                        La galería se actualizará cuando haya imágenes disponibles.
                    </p>
                )}
            </div>
        </section>
    );
}
