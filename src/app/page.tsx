import Link from "next/link";
import { PourHero } from "@/components/home/PourHero";
import { COFFEE_PRICE, formatINR } from "@/lib/catalogue";

export default function Home() {
  return (
    <>
      <PourHero />
<section className="sec t-honey over-hero" id="shop" aria-labelledby="shop-h">
  <div className="page-head rv"><p className="lab dim">Shop</p><h2 className="disp h2" id="shop-h">coffee first. everything to brew it.</h2><div><Link className="btn btn-fill" href="/find">Not sure? Find your coffee</Link></div></div>
  <article className="pack-card rv" aria-labelledby="pack-h">
    <figure className="pack-img"><img src="/img/kits.jpg" alt="Packaging concept: three Husk and Honey coffee bags in cream, blue and green" loading="lazy" /><figcaption>Packaging concept</figcaption></figure>
    <div className="pack-txt">
      <p className="lab dim">Two estates, two coffees</p>
      <h2 className="disp h3" id="pack-h">from the estate to your cup.</h2>
      <p className="pack-intro">Our coffee comes from two estates. Each one is roasted light, medium or dark, and packed as whole beans or ground for the way you brew.</p>
      <div className="estates">
        <div className="estate"><p className="lab">Arabica 01</p><p className="est-n">Darjeeling</p><p className="est-d">From the Darjeeling estate. Tasting notes coming soon.</p><Link className="crumb" href="/coffee/arabica-01">Shop Arabica 01 →</Link></div>
        <div className="estate"><p className="lab">Arabica 02</p><p className="est-n">Kalebung</p><p className="est-d">From the Kalebung estate. Light is floral and citrusy, medium is caramel and milk chocolate, dark is cocoa and smoky.</p><Link className="crumb" href="/coffee/arabica-02">Shop Arabica 02 →</Link></div>
      </div>
    </div>
  </article>
</section>
<section className="sec" id="range" aria-labelledby="range-h">
  <div className="range-head rv">
    <div className="col"><p className="lab dim">Shop by category</p><h2 className="disp h2" id="range-h">what are you after?</h2></div>
    <p className="range-help">Not sure where to start? <Link href="/find">Answer 3 questions and we'll pick your coffee →</Link></p>
  </div>
  <div className="cats">
    <Link className="cat k-blue rv" href="/shop?c=coffee"><svg className="art" viewBox="0 0 240 190" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:"<path d=\"M78 34h84l10 20v104a8 8 0 0 1-8 8H76a8 8 0 0 1-8-8V54z\" fill=\"rgba(255,255,255,.35)\"/><path d=\"M68 54h104M96 34v-8h48v8\"/><circle cx=\"120\" cy=\"104\" r=\"20\"/><path d=\"M110 96c8 6 12 10 20 16\" />"}} /><span className="for">Already brewing at home</span><p className="lab">Coffee</p><h3 className="disp">beans and grounds.</h3><p>Arabica 01 and Arabica 02, packed for how you brew.</p><ul className="facts"><li>2 estates</li><li>3 roasts</li><li>5 grinds</li><li>250 g or 500 g</li></ul><span className="pfrom">From {formatINR(COFFEE_PRICE["250"])}</span><span className="go">Shop coffee <i aria-hidden="true">→</i></span></Link>
    <Link className="cat k-olive rv" href="/shop?c=kits"><svg className="art" viewBox="0 0 240 190" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:"<path d=\"M30 52h100l-34 52H64z\" fill=\"rgba(255,255,255,.3)\"/><path d=\"M54 64l16 36M80 60v42M106 64l-16 36\"/><rect x=\"58\" y=\"112\" width=\"44\" height=\"46\" rx=\"9\"/><rect x=\"138\" y=\"96\" width=\"56\" height=\"62\" rx=\"10\" fill=\"rgba(255,255,255,.3)\"/><path d=\"M194 112c18 0 18 30 0 30\"/><path d=\"M20 168h190\"/>"}} /><span className="for">New to brewing</span><p className="lab">Starter kits</p><h3 className="disp">start brewing.</h3><p>A brewer, a mug and coffee in one box.</p><ul className="facts"><li>French press</li><li>V60</li><li>Moka pot</li></ul><span className="pfrom">Price at launch</span><span className="go">See the kits <i aria-hidden="true">→</i></span></Link>
    <Link className="cat k-honey rv" href="/shop?c=equipment"><svg className="art" viewBox="0 0 240 190" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:"<path d=\"M78 76h80l8 66a10 10 0 0 1-10 12H80a10 10 0 0 1-10-12z\" fill=\"rgba(255,255,255,.35)\"/><path d=\"M88 76q30-26 60 0\"/><circle cx=\"118\" cy=\"56\" r=\"5\"/><path d=\"M74 134c-28 0-40-34-48-62\"/><path d=\"M164 88c34-6 34 50 0 46\"/>"}} /><span className="for">Upgrading your setup</span><p className="lab">Equipment</p><h3 className="disp">brew gear.</h3><p>Everything to go with the coffee, one piece at a time.</p><ul className="facts"><li>Grinder</li><li>Kettle</li><li>Scale</li><li>Brewers</li><li>Filters</li><li>Mug</li></ul><span className="pfrom">Prices at launch</span><span className="go">Browse equipment <i aria-hidden="true">→</i></span></Link>
  </div>
  <Link className="cat-strip k-navy rv" href="/brew">
    <div className="col"><p className="lab">Brew guide · free</p><h3 className="disp">brew it your way.</h3><p>Pick a method, set your cup size and get the coffee weight, grind, time and steps.</p></div>
    <ul className="facts"><li>Pour over</li><li>French press</li><li>Moka pot</li><li>AeroPress</li><li>Espresso</li></ul>
    <span className="go">Open the brew guide <i aria-hidden="true">→</i></span>
  </Link>
</section>
<section className="sec t-honey" id="story" aria-labelledby="story-h">
  <div className="story">
    <div className="col rv">
      <p className="lab dim">Story</p>
      <h2 className="disp h2" id="story-h">coffee first. the café follows.</h2>
      <p className="lead">Husk &amp; Honey is a coffee brand from Siliguri, with Himalayan soul and modern coffee culture. We want good coffee to feel easy, and part of an ordinary day.</p>
      <ul className="chain" aria-label="From mountain to moment"><li>Mountain</li><li>Bean</li><li>Roast</li><li>Cup</li><li>Moment</li></ul>
      <div><Link className="btn btn-fill" href="/story">Read the story</Link></div>
    </div>
    <div className="seq rv">
      <div><p className="lab now">Now</p><p>Beans and grounds, packed for how you brew.</p></div>
      <div><p className="lab dim">Next</p><p>The café in Pradhan Nagar, Siliguri, with coffee and food.</p></div>
      <div><p className="lab dim">Later</p><p>Brewing sessions and small gatherings for people who like a good cup.</p></div>
    </div>
  </div>
</section>
    </>
  );
}
