import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
<section className="sec page" aria-labelledby="n-h">
  <div className="doc rv">
    <p className="lab dim">404</p>
    <h1 className="disp h2" id="n-h">nothing brewing here.</h1>
    <p className="lead">That page does not exist or has moved.</p>
    <div className="row-btns"><Link className="btn btn-fill" href="/shop">Shop coffee</Link><Link className="btn btn-ghost" href="/">Back home</Link></div>
  </div>
</section>
    </>
  );
}
