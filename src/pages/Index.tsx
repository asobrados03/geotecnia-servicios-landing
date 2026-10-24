import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

import { Hero } from "@/components/sections/Hero.tsx";
import { ValueProposition } from "@/components/sections/ValueProposition.tsx";
import { Services } from "@/components/sections/Services.tsx";
import { Gallery } from "@/components/sections/Gallery.tsx";
import { Projects } from "@/components/sections/Projects.tsx";
import { Collaboration } from "@/components/sections/Collaboration.tsx";
import { Methodology } from "@/components/sections/Methodology.tsx";
import { Trust } from "@/components/sections/Trust.tsx";
import { Faq } from "@/components/sections/Faq.tsx";
import { Contact } from "@/components/sections/Contact.tsx";

const Index = () => {
  return (
      <>
        <SiteHeader />

        <main>
          <Hero />
          <ValueProposition />
          <Services />
          <Gallery />
          <Projects />
          <Collaboration />
          <Methodology />
          <Trust />
          <Faq />
          <Contact />
        </main>

        <SiteFooter />
      </>
  );
};

export default Index;
