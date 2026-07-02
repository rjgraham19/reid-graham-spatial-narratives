import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16 px-6 md:px-12 lg:px-16 py-16 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-end">
        <div className="md:col-span-6">
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
            Reid Graham Design
          </p>
          <h2 className="font-display font-black uppercase tracking-[-0.02em] leading-[0.9] text-3xl md:text-5xl text-balance">
            Design what you want the world to feel like.
          </h2>
        </div>
        <div className="md:col-span-3 space-y-3 text-sm text-foreground/70">
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50">Contact</p>
          <a
            href="mailto:hello@reidgraham.design"
            className="block hover:text-accent transition-colors"
          >
            hello@reidgraham.design
          </a>
          <Link to="/contact" className="pill inline-flex mt-3">
            Start a conversation
          </Link>
        </div>
        <div className="md:col-span-3 space-y-3 text-sm text-foreground/70">
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50">Elsewhere</p>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-accent transition-colors">Instagram</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">LinkedIn</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Vimeo</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-6 border-t border-border flex flex-wrap justify-between items-center text-[10px] tracking-[0.3em] uppercase text-foreground/50">
        <span>© {new Date().getFullYear()} Reid Graham</span>
        <span>Brooklyn / Ann Arbor</span>
      </div>
    </footer>
  );
}
