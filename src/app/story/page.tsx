import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Story",
  description: "The Husk & Honey story: a Himalayan coffee brand from Siliguri, with a café on the way.",
};

export default function StoryPage() {
  return (
    <>
<section className="sec t-honey page" id="story" aria-labelledby="story-h">
  <div className="story">
    <div className="col rv">
      <p className="lab dim">Story</p>
      <h1 className="disp h2" id="story-h">coffee first. the café follows.</h1>
      <p className="lead">Husk &amp; Honey is a coffee brand from Siliguri, with Himalayan soul and modern coffee culture. We want good coffee to feel easy, and part of an ordinary day.</p>
      <ul className="chain" aria-label="From mountain to moment"><li>Mountain</li><li>Bean</li><li>Roast</li><li>Cup</li><li>Moment</li></ul>
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
