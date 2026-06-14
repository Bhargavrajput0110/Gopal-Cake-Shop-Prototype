import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-secondary/30 mt-20">
      <div className="container mx-auto max-w-screen-2xl px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="font-heading text-xl font-bold text-primary mb-4">Gopal Cake Shop</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Crafting premium cakes and unforgettable memories since 1995. Freshly baked with love in Vadodara.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/menu" className="hover:text-primary transition-colors">Menu</Link></li>
              <li><Link href="/custom" className="hover:text-primary transition-colors">Custom Cakes</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Branches</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Uma Branch</li>
              <li>Alkapuri Branch</li>
              <li>Gotri Branch</li>
              <li>Manjalpur Branch</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>+91 98765 43210</li>
              <li>hello@gopalcakeshop.com</li>
              <li>Vadodara, Gujarat</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Gopal Cake Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
