import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Café",
  description: "The Husk & Honey café in Pradhan Nagar, Siliguri is under construction.",
};

export default function CafePage() {
  return (
    <>
<section className="sec cafe" id="cafe" aria-labelledby="cafe-h">
  <div className="ghost-page" aria-hidden="true">
    <div className="gp-bar"><i></i><i></i><i></i><i></i></div>
    <div className="gp-h"></div>
    <div className="gp-grid"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
  </div>
  <div className="card cafe-card rv in">
    <p className="lab pulse">Under construction</p>
    <h1 className="disp h2" id="cafe-h">café. coming soon.</h1>
    <p className="lead">Currently brewing concrete.</p>
    <p className="lab dim">Pradhan Nagar, Siliguri</p>
  </div>
</section>
    </>
  );
}
