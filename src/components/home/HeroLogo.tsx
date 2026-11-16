import { LOGO_PATH } from "@/lib/logo-path";

/**
 * The home-page hero logo, drawn from the traced vector wordmark so it stays
 * sharp at any size and on any screen. (The old animated picture was only
 * 320 px wide and went soft when scaled up; an animated "boil" on the vector
 * roughened the edges, so the hero uses the clean still logo.)
 */
export function HeroLogo() {
  return (
    <svg className="hero-logo hero-logo-svg" viewBox="0 0 640 405" role="img" aria-label="Husk and Honey">
      <path className="hero-logo-ink" d={LOGO_PATH} fillRule="evenodd" />
    </svg>
  );
}
