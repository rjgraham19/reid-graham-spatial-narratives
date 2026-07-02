import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-32 px-6 md:px-10 py-24 flex flex-col md:flex-row justify-between items-start gap-16">
      <div className="max-w-xl">
        <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.9] uppercase mb-8 text-balance">
          Let's construct
          <br />
          the next world.
        </h2>
        <Link
          to="/contact"
          className="inline-flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:text-accent transition-colors group"
        >
          Start a conversation
          <span className="h-px w-8 bg-foreground group-hover:w-16 group-hover:bg-accent transition-all duration-500" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-12 md:gap-16 text-[10px] font-bold tracking-[0.2em] uppercase">
        <div className="space-y-4">
          <p className="text-muted-foreground">Studio</p>
          <p className="leading-loose font-normal normal-case tracking-normal text-sm font-serif italic text-foreground/80">
            88 Wythe Ave
            <br />
            Brooklyn, NY 11249
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-muted-foreground">Elsewhere</p>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-accent transition-colors">
                Instagram
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-accent transition-colors">
                LinkedIn
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-accent transition-colors">
                Are.na
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground md:self-end">
        © {new Date().getFullYear()} Reid Graham Studio
      </div>
    </footer>
  );
}
