import { Features } from "@/components/home/features";
import { GithubCta } from "@/components/home/github-cta";
import { Hero } from "@/components/home/hero";
import { ModuleCards } from "@/components/home/module-cards";
import { StudioChooser } from "@/components/home/studio-chooser";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StudioChooser />
      <ModuleCards />
      <Features />
      <GithubCta />
    </>
  );
}
