import Link from "next/link";
import { PourHero } from "@/components/home/PourHero";
import { COFFEE_PRICE, formatINR } from "@/lib/catalogue";

export default function Home() {
  return (
    <>
      <PourHero />
<section className="sec t-honey over-hero" id="shop" aria-labelledby="shop-h">
  <div className="shop-intro">
    <div className="shop-txt rv">
      <p className="lab dim">Shop</p>
      <h2 className="disp h2" id="shop-h">coffee first. everything to brew it.</h2>
      <p className="shop-lead">In the Darjeeling hills, nearly every slope grows tea. Our two estates grow coffee, which makes every bag a rare find. Our roasters taste the hills in it: a soft, tea-like note behind the coffee. A small indulgence from very few trees.</p>
      <div className="est-cards">
        <article className="est-card">
          <p className="lab est-k">Rare estate</p>
          <h3 className="est-n">Darjeeling</h3>
          <p className="est-d">One of the very few coffee estates among Darjeeling&apos;s tea gardens. Delicate, with a hint of tea on the finish.</p>
          <Link className="crumb" href="/coffee/arabica-01">Shop Darjeeling Specialty →</Link>
        </article>
        <article className="est-card">
          <p className="lab est-k">Rare estate</p>
          <h3 className="est-n">Kalebung</h3>
          <p className="est-d">Coffee from a hillside known for tea. Floral to cocoa across three roasts, each with a soft tea-like finish.</p>
          <Link className="crumb" href="/coffee/arabica-02">Shop Kalebung Specialty →</Link>
        </article>
      </div>
      <div><Link className="btn btn-fill" href="/find">Not sure? Find your coffee</Link></div>
    </div>
    <figure className="shop-ph rv">
      <img src="/img/kits.jpg" alt="Packaging concept: three Husk and Honey coffee bags in cream, blue and green" loading="lazy" />
      <figcaption>Packaging concept</figcaption>
    </figure>
  </div>
</section>
<section className="sec" id="range" aria-labelledby="range-h">
  <div className="range-head rv">
    <div className="col"><p className="lab dim">Shop by category</p><h2 className="disp h2" id="range-h">what are you after?</h2></div>
    <p className="range-help">Not sure where to start? <Link href="/find">Answer 3 questions and we&apos;ll pick your coffee →</Link></p>
  </div>
  <div className="cats">
    <Link className="cat k-blue rv" href="/shop?c=coffee"><span className="cat-ph bags" aria-hidden="true"><img src="/img/coffee/bag-light.webp" alt="" loading="lazy" /><img src="/img/coffee/bag-dark.webp" alt="" loading="lazy" /><img src="/img/coffee/bag-medium.webp" alt="" loading="lazy" /></span><span className="for">Already brewing at home</span><p className="lab">Coffee</p><h3 className="disp">beans and grounds.</h3><p>Two rare estates, packed for how you brew.</p><ul className="facts"><li>2 estates</li><li>3 roasts</li><li>5 grinds</li><li>250 g or 500 g</li></ul><span className="pfrom">From {formatINR(COFFEE_PRICE["250"])}</span><span className="go">Shop coffee <i aria-hidden="true">→</i></span></Link>
    <Link className="cat k-olive rv" href="/shop?c=kits"><span className="cat-ph"><img src="/img/bags.jpg" alt="Starter box concept with coffee, a mug and a French press" loading="lazy" /></span><span className="for">New to brewing</span><p className="lab">Starter kits</p><h3 className="disp">start brewing.</h3><p>A brewer, a mug and coffee in one box.</p><ul className="facts"><li>French press</li><li>V60</li><li>Moka pot</li></ul><span className="pfrom">Price at launch</span><span className="go">See the kits <i aria-hidden="true">→</i></span></Link>
    <Link className="cat k-honey rv" href="/shop?c=equipment"><span className="cat-ph"><img src="/img/photos/pour-over-gear.webp" alt="A gooseneck kettle pouring water into a pour-over dripper over a glass server on a scale" loading="lazy" /></span><span className="for">Upgrading your setup</span><p className="lab">Equipment</p><h3 className="disp">brew gear.</h3><p>Everything to go with the coffee, one piece at a time.</p><ul className="facts"><li>Grinder</li><li>Kettle</li><li>Scale</li><li>Brewers</li><li>Filters</li><li>Mug</li></ul><span className="pfrom">Prices at launch</span><span className="go">Browse equipment <i aria-hidden="true">→</i></span></Link>
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
    <div className="story-right rv">
      <figure className="hills">
        <img src="/img/photos/darjeeling-hills.webp" alt="Snow-capped Himalayan peaks above the Darjeeling hills" loading="lazy" />
        <figcaption><span>The Darjeeling hills</span></figcaption>
      </figure>
      <ol className="seq2">
        <li><span className="when now">Now</span><p>Beans and grounds, packed for how you brew.</p></li>
        <li><span className="when">Next</span><p>The café in Pradhan Nagar, Siliguri, with coffee and food.</p></li>
        <li><span className="when">Later</span><p>Brewing sessions and small gatherings for people who like a good cup.</p></li>
      </ol>
    </div>
  </div>
</section>
    </>
  );
}
