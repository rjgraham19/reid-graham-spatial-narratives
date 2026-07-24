import { useState } from "react";

/**
 * Dark/light background toggle — flips a `white` class on <html>, same
 * mechanic as duncanbrazzil.com. Currently test-enabled on the Contact
 * page only (see contact.tsx, which resets the class on unmount so it
 * doesn't leak into other pages in this single-page app).
 */
export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  const toggle = () => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("white", next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light background"
      aria-pressed={isLight}
      className="relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border border-border bg-secondary transition-colors"
    >
      <span
        className={`inline-block h-5 w-5 translate-x-1 transform rounded-full bg-foreground transition-transform duration-300 ease-cinematic ${
          isLight ? "translate-x-8" : "translate-x-1"
        }`}
      />
    </button>
  );
}
