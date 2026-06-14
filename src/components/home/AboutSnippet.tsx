import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/aceternity/text-generate-effect";

export function AboutSnippet() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Image */}
          <div className="relative aspect-[4/5] w-full max-w-md mx-auto md:mx-0">
            <div className="absolute inset-0 bg-primary/20 rounded-t-full -rotate-6 transform scale-105" />
            <div className="relative h-full w-full rounded-t-full overflow-hidden border-8 border-background">
              <Image 
                src="https://images.unsplash.com/photo-1557925923-33b251dc3296?q=80&w=800&auto=format&fit=crop"
                alt="Chef decorating a cake"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 text-center md:text-left">
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground">
              The Secret Ingredient is <span className="text-primary italic">Passion</span>
            </h2>
            <div className="text-muted-foreground text-lg leading-relaxed min-h-[150px]">
              <TextGenerateEffect 
                words="Since 1995, Gopal Cake Shop has been the heart of Vadodara's celebrations. We don't just bake cakes; we craft edible art. From using the finest Belgian chocolate to hand-picking fresh berries, our master chefs ensure every bite tells a story of perfection." 
              />
            </div>
            <div className="pt-4">
              <Button variant="link" className="text-primary hover:text-primary/80 px-0 text-lg font-medium">
                Read Our Story &rarr;
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
