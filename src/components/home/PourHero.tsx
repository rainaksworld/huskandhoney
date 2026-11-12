"use client";
/* eslint-disable */
// @ts-nocheck — ported verbatim from the static site's scroll-driven pour; kept as-is to preserve the motion exactly.
import Link from "next/link";
import { useEffect } from "react";

export function PourHero() {
  useEffect(() => {
/* ---------- coffee pour (scroll-driven) ---------- */
  var $=function(s:string){return document.querySelector(s) as any},$$=function(s:string){return Array.prototype.slice.call(document.querySelectorAll(s)) as any[]};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var track=$('#top'),kettle=$('#kettle'),stream=$('#stream'),streamHi=$('#streamHi'),surf=$('#surf'),crema=$('#crema'),rips=$$('.rg'),steam=$('#steam'),hint=$('#hint'),pctEl=$('#pct'),foam=$('#foam'),splash=$('#splash'),drops=splash.children,sheen=$('#sheen');
  var cur=0,target=0,busy=false,SS={s:0,tx:0,ty:0,cy:494,ptx:0,vx:0},CX=250,KS=.88,TIPX=-298.0,TIPY=-79.0;
  function c(v){return v<0?0:v>1?1:v}
  function ease(t){return t*t*(3-2*t)}
  function lerp(a,b,t){return a+(b-a)*t}
  function drawStream(t){
    var s=SS.s;
    if(s<.01){stream.style.opacity=0;streamHi.style.opacity=0;foam.setAttribute('opacity',0);splash.style.opacity=0;return}
    var x0=SS.tx,y0=SS.ty,x3=CX-1,y3=SS.cy,x1=x0-6,y1=y0+34,x2=CX,y2=y3-120,N=30,L=[],R=[],C=[];
    var w0=2.2+4.8*s;
    for(var i=0;i<=N;i++){
      var u=i/N,m=1-u,
      x=m*m*m*x0+3*m*m*u*x1+3*m*u*u*x2+u*u*u*x3,y=m*m*m*y0+3*m*m*u*y1+3*m*u*u*y2+u*u*u*y3,
      dx=3*m*m*(x1-x0)+6*m*u*(x2-x1)+3*u*u*(x3-x2),dy=3*m*m*(y1-y0)+6*m*u*(y2-y1)+3*u*u*(y3-y2),
      len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,
      w=w0*(1-.42*u+.5*Math.pow(u,7))*(1+.06*Math.sin(u*16-t*18)),
      wob=Math.sin(u*6-t*8)*.9*u*s;
      x+=nx*wob;y+=ny*wob;
      x-=Math.max(-30,Math.min(30,SS.vx*.05))*Math.pow(u,1.6);
      L.push((x+nx*w/2).toFixed(1)+' '+(y+ny*w/2).toFixed(1));R.push((x-nx*w/2).toFixed(1)+' '+(y-ny*w/2).toFixed(1));C.push((x-nx*w*.18).toFixed(1)+' '+y.toFixed(1));
    }
    stream.setAttribute('d','M'+L.join('L')+'L'+R.reverse().join('L')+'Z');
    streamHi.setAttribute('d','M'+C.join('L'));streamHi.setAttribute('stroke-width',(.6+.9*s).toFixed(1));
    stream.style.opacity=Math.min(1,s*1.3).toFixed(2);streamHi.style.opacity=(s*.5).toFixed(2);
    foam.setAttribute('cy',SS.cy.toFixed(1));foam.setAttribute('rx',(10+6*s+Math.sin(t*10)*1.4).toFixed(1));foam.setAttribute('ry',(2.6+Math.sin(t*10)*.4).toFixed(1));foam.setAttribute('opacity',(.5*s).toFixed(2));
    splash.style.opacity=s>.45?1:0;
    for(var k=0;k<drops.length;k++){
      var ph=((t*1.5+k*.41)%1),dir=(k%2?1:-1),vx=(7+k*4)*dir,vy=34+k*6,tau=ph*.5;
      drops[k].setAttribute('cx',(CX+vx*tau).toFixed(1));drops[k].setAttribute('cy',(SS.cy-(vy*tau-150*tau*tau)).toFixed(1));drops[k].setAttribute('opacity',(.9*(1-ph)).toFixed(2));
    }
  }
  function apply(p,t,dt){
    var m=ease(c((p-.03)/.2))*(1-ease(c((p-.92)/.07)));
    var tilt=-35*m,px=lerp(528,508,m),py=lerp(236,138,m);
    kettle.setAttribute('transform','translate('+px.toFixed(1)+' '+py.toFixed(1)+') rotate('+tilt.toFixed(2)+') scale('+KS+')');
    var a=tilt*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a);
    var tx=px+KS*(TIPX*cs-TIPY*sn),ty=py+KS*(TIPX*sn+TIPY*cs);
    var s=ease(c((m-.82)/.18));
    var f=ease(c((p-.2)/.7));
    var cy=lerp(494,471,f),rx=lerp(70,105,f),ry=lerp(14,25,f);
    [surf,crema].forEach(function(e){e.setAttribute('cy',cy.toFixed(1));e.setAttribute('rx',rx.toFixed(1));e.setAttribute('ry',ry.toFixed(1))});
    sheen.setAttribute('cy',(cy-1).toFixed(1));sheen.setAttribute('rx',(rx*.28).toFixed(1));sheen.setAttribute('opacity',(.35*c((f-.05)/.2)).toFixed(2));
    SS.s=s;SS.tx=tx;SS.ty=ty;SS.cy=cy;
    if(dt>0){var vx=(tx-SS.ptx)/dt;SS.vx+=(vx-SS.vx)*Math.min(1,dt*9)}
    SS.ptx=tx;
    drawStream(t);
    rips.forEach(function(r){r.setAttribute('cy',cy.toFixed(1));r.setAttribute('rx',(rx*.8).toFixed(1));r.setAttribute('ry',(ry*.8).toFixed(1));r.style.visibility=(s>.1&&f>.2)?'visible':'hidden'});
    steam.style.opacity=(c((p-.4)/.4)*.9).toFixed(2);
    hint.style.opacity=(1-c(p/.06)).toFixed(2);
    pctEl.textContent=Math.round(f*100);
  }
  function targetP(){var r=track.getBoundingClientRect(),tot=r.height-2*window.innerHeight;return tot>0?c(-r.top/tot):0}
  var last=0,vis=true,tgtDirty=true,alive=true;
  function pourTick(now){
    var dt=last?Math.min(.05,(now-last)/1000):.016;last=now;
    if(tgtDirty){target=targetP();tgtDirty=false}
    var d=target-cur;
    if(reduce){cur=target}
    else{
      var step=d*(1-Math.exp(-dt/.16)),cap=.42*dt;
      if(step>cap)step=cap;else if(step<-cap)step=-cap;
      cur+=step;if(Math.abs(target-cur)<.0003)cur=target;
    }
    apply(cur,now/1000,dt);
    if(alive&&vis&&(!reduce||cur!==target))requestAnimationFrame(pourTick);else busy=false;
  }
  function wake(){tgtDirty=true;if(!busy){busy=true;last=0;requestAnimationFrame(pourTick)}}
  function onPour(){wake()}
  var io:IntersectionObserver|null=null;if('IntersectionObserver' in window){io=new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis)wake()},{rootMargin:'100px'}).observe(track)}
  window.addEventListener('scroll',onPour,{passive:true});window.addEventListener('resize',onPour);onPour();
  return function(){alive=false;window.removeEventListener('scroll',onPour);window.removeEventListener('resize',onPour);io&&io.disconnect()};

  }, []);

  return (
<section className="hero-track" id="top" aria-label="Husk and Honey">
  <div className="hero-sticky">
    <div className="hero-top">
      <p className="lab">Coffee. Food. A little time well spent.</p>
      <h1 className="sr">Husk &amp; Honey</h1>
      <div className="logo hero-logo" role="img" aria-label="Husk and Honey"></div>
      <div className="hero-cta">
        <Link className="btn btn-fill" href="/shop?c=coffee">Shop coffee</Link>
        <Link className="btn btn-ghost" href="/shop?c=kits">Starter kits</Link>
      </div>
      <p className="lab hint" id="hint"><i aria-hidden="true"></i>Scroll to pour</p>
    </div>
    <aside className="card info" aria-label="About">
      <p className="lab">A café that lets you take the experience home.</p>
      <hr />
      <p className="dim">Husk &amp; Honey is a Himalayan coffee brand from Siliguri. The coffee is ready to order now. The café in Pradhan Nagar is still being built.</p>
    </aside>
    <svg className="pour" id="pour" viewBox="0 0 700 700" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{__html:"\n      <defs>\n        <clipPath id=\"rimClip\"><ellipse cx=\"250\" cy=\"470\" rx=\"106\" ry=\"25\"/></clipPath>\n        <filter id=\"blur6\" x=\"-30%\" y=\"-30%\" width=\"160%\" height=\"160%\"><feGaussianBlur stdDeviation=\"6\"/></filter>\n        <filter id=\"blur3\" x=\"-30%\" y=\"-30%\" width=\"160%\" height=\"160%\"><feGaussianBlur stdDeviation=\"2.6\"/></filter>\n        <filter id=\"blur1\"><feGaussianBlur stdDeviation=\"1\"/></filter>\n        <linearGradient id=\"cup\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#3F5E96\"/><stop offset=\".16\" stop-color=\"#6E92CE\"/><stop offset=\".3\" stop-color=\"#86A6DA\"/><stop offset=\".55\" stop-color=\"#6A8EC9\"/><stop offset=\".85\" stop-color=\"#4A6BA3\"/><stop offset=\"1\" stop-color=\"#37548A\"/></linearGradient>\n        <linearGradient id=\"cupV\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff\" stop-opacity=\".16\"/><stop offset=\".35\" stop-color=\"#fff\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#0F1A2E\" stop-opacity=\".28\"/></linearGradient>\n        <linearGradient id=\"inner\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#E9DCC0\"/><stop offset=\".55\" stop-color=\"#C9B88F\"/><stop offset=\"1\" stop-color=\"#7B6A4C\"/></linearGradient>\n        <linearGradient id=\"sauc\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#D8CAA6\"/><stop offset=\".3\" stop-color=\"#F6EBC6\"/><stop offset=\".7\" stop-color=\"#EBDDB1\"/><stop offset=\"1\" stop-color=\"#C9BA92\"/></linearGradient>\n        <radialGradient id=\"cof\" cx=\".5\" cy=\".4\" r=\".7\"><stop offset=\"0\" stop-color=\"#8A5530\"/><stop offset=\".6\" stop-color=\"#4E2D16\"/><stop offset=\"1\" stop-color=\"#2A170A\"/></radialGradient>\n        <linearGradient id=\"kbody\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#2F4420\"/><stop offset=\".22\" stop-color=\"#4C6B30\"/><stop offset=\".38\" stop-color=\"#6A8F46\"/><stop offset=\".6\" stop-color=\"#4B682F\"/><stop offset=\"1\" stop-color=\"#22331A\"/></linearGradient>\n        <linearGradient id=\"kbodyV\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff\" stop-opacity=\".12\"/><stop offset=\".4\" stop-color=\"#fff\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#000\" stop-opacity=\".25\"/></linearGradient>\n        <linearGradient id=\"strm\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#5A3417\"/><stop offset=\".5\" stop-color=\"#8E5A2E\"/><stop offset=\"1\" stop-color=\"#4A2A12\"/></linearGradient>\n      </defs>\n      <!-- table shadow, saucer, cup -->\n      <ellipse cx=\"262\" cy=\"652\" rx=\"215\" ry=\"17\" fill=\"#1E2A15\" opacity=\".22\" filter=\"url(#blur6)\"/>\n      <ellipse cx=\"250\" cy=\"645\" rx=\"196\" ry=\"30\" fill=\"#BFAF85\"/>\n      <ellipse cx=\"250\" cy=\"639\" rx=\"196\" ry=\"30\" fill=\"url(#sauc)\"/>\n      <ellipse cx=\"250\" cy=\"640\" rx=\"132\" ry=\"19\" fill=\"#D7C79B\"/>\n      <ellipse cx=\"250\" cy=\"638\" rx=\"128\" ry=\"17\" fill=\"#E8DBB2\"/>\n      <ellipse cx=\"262\" cy=\"636\" rx=\"104\" ry=\"11\" fill=\"#1E2A15\" opacity=\".25\" filter=\"url(#blur3)\"/>\n      <path d=\"M362 498C436 478 452 580 356 592\" fill=\"none\" stroke=\"#2E4574\" stroke-width=\"22\" stroke-linecap=\"round\"/>\n      <path d=\"M362 498C436 478 452 580 356 592\" fill=\"none\" stroke=\"#5F82BE\" stroke-width=\"16\" stroke-linecap=\"round\"/>\n      <path d=\"M364 493C430 476 444 572 356 585\" fill=\"none\" stroke=\"#9DB8E3\" stroke-width=\"3.5\" stroke-linecap=\"round\" opacity=\".7\"/>\n      <path d=\"M134 470C136 568 176 628 214 634L286 634C324 628 364 568 366 470Z\" fill=\"url(#cup)\"/>\n      <path d=\"M134 470C136 568 176 628 214 634L286 634C324 628 364 568 366 470Z\" fill=\"url(#cupV)\"/>\n      <path d=\"M156 500C164 560 184 598 206 616\" fill=\"none\" stroke=\"#fff\" stroke-opacity=\".5\" stroke-width=\"9\" stroke-linecap=\"round\" filter=\"url(#blur1)\"/>\n      <path d=\"M338 520C332 566 318 596 300 614\" fill=\"none\" stroke=\"#fff\" stroke-opacity=\".12\" stroke-width=\"6\" stroke-linecap=\"round\" filter=\"url(#blur1)\"/>\n      <ellipse cx=\"250\" cy=\"470\" rx=\"118\" ry=\"30\" fill=\"#A9C0E6\"/>\n      <ellipse cx=\"250\" cy=\"470\" rx=\"118\" ry=\"30\" fill=\"none\" stroke=\"#6E92CE\" stroke-width=\"1.5\"/>\n      <ellipse cx=\"250\" cy=\"472\" rx=\"108\" ry=\"26.5\" fill=\"url(#inner)\"/>\n      <g clip-path=\"url(#rimClip)\">\n        <ellipse cx=\"250\" cy=\"456\" rx=\"110\" ry=\"22\" fill=\"#fff\" opacity=\".18\"/>\n        <ellipse id=\"surf\" cx=\"250\" cy=\"494\" rx=\"70\" ry=\"14\" fill=\"url(#cof)\"/>\n        <ellipse id=\"crema\" cx=\"250\" cy=\"494\" rx=\"70\" ry=\"14\" fill=\"none\" stroke=\"#D9B07A\" stroke-width=\"2.2\" opacity=\".6\"/>\n        <ellipse class=\"rg\" cx=\"250\" cy=\"494\" rx=\"40\" ry=\"8\"/>\n        <ellipse class=\"rg r2\" cx=\"250\" cy=\"494\" rx=\"40\" ry=\"8\"/>\n        <ellipse id=\"sheen\" cx=\"226\" cy=\"492\" rx=\"26\" ry=\"3.2\" fill=\"#fff\" opacity=\".0\"/>\n      </g>\n      <path d=\"M144 478Q250 505 356 478\" fill=\"none\" stroke=\"#fff\" stroke-opacity=\".45\" stroke-width=\"2.2\" opacity=\".0\"/>\n      <path d=\"M142 480C170 508 330 508 358 480\" fill=\"none\" stroke=\"#fff\" stroke-opacity=\".55\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n      <g id=\"steam\" style=\"opacity:0\" fill=\"none\" stroke=\"#6C7556\" stroke-opacity=\".28\" stroke-width=\"9\" stroke-linecap=\"round\" filter=\"url(#blur3)\">\n        <path class=\"wisp\" d=\"M216 440c-18-30 16-48 0-80s16-48 0-84\"/>\n        <path class=\"wisp w2\" d=\"M252 436c-18-30 16-48 0-80s16-48 0-84\"/>\n        <path class=\"wisp w3\" d=\"M286 440c-18-30 16-48 0-80s16-48 0-84\"/>\n      </g>\n      <!-- pour -->\n      <path id=\"stream\" d=\"\" fill=\"url(#strm)\" style=\"opacity:0\"/>\n      <path id=\"streamHi\" d=\"\" fill=\"none\" stroke=\"#F0D3A0\" stroke-linecap=\"round\" style=\"opacity:0\"/>\n      <ellipse id=\"foam\" cx=\"250\" cy=\"494\" rx=\"14\" ry=\"3.5\" fill=\"#E3C18E\" opacity=\"0\"/>\n      <g id=\"splash\" fill=\"#8A5530\" style=\"opacity:0\"><circle r=\"1.7\"/><circle r=\"1.3\"/><circle r=\"1.9\"/><circle r=\"1.2\"/><circle r=\"1.5\"/><circle r=\"1.1\"/></g>\n      <!-- kettle -->\n      <g id=\"kettle\" transform=\"translate(528 236) scale(.88)\">\n        <path d=\"M92-46C180-60 184 62 98 56\" fill=\"none\" stroke=\"#141D0E\" stroke-width=\"17\" stroke-linecap=\"round\"/>\n        <path d=\"M92-46C180-60 184 62 98 56\" fill=\"none\" stroke=\"#2A3A1D\" stroke-width=\"12\" stroke-linecap=\"round\"/>\n        <path d=\"M95-52C170-64 174 52 100 49\" fill=\"none\" stroke=\"#6B7F52\" stroke-width=\"2.5\" stroke-linecap=\"round\" opacity=\".6\"/>\n        <path d=\"M-80.1 39.5 L-89.8 39.9 L-98.5 39.4 L-106.6 38.2 L-114.2 36.4 L-121.4 33.9 L-128.2 30.8 L-134.7 27.2 L-141.0 23.1 L-147.0 18.4 L-152.8 13.4 L-158.4 8.0 L-163.8 2.2 L-169.1 -3.9 L-174.3 -10.2 L-179.3 -16.6 L-184.4 -23.2 L-189.3 -29.8 L-194.3 -36.3 L-199.4 -42.9 L-204.5 -49.2 L-209.7 -55.4 L-215.2 -61.4 L-220.8 -67.0 L-226.7 -72.2 L-231.7 -76.0 L-236.6 -79.3 L-241.5 -82.3 L-246.4 -84.8 L-251.3 -87.0 L-256.1 -88.8 L-261.0 -90.3 L-265.7 -91.4 L-270.4 -92.1 L-275.0 -92.5 L-279.6 -92.5 L-284.0 -92.2 L-288.3 -91.5 L-292.5 -90.5 L-296.6 -89.2 L-300.2 -87.6 L-295.8 -76.4 L-292.6 -77.6 L-289.4 -78.4 L-286.2 -78.9 L-282.9 -79.2 L-279.5 -79.2 L-276.0 -79.0 L-272.4 -78.4 L-268.8 -77.6 L-265.0 -76.5 L-261.2 -75.1 L-257.4 -73.4 L-253.4 -71.3 L-249.4 -68.9 L-245.4 -66.2 L-241.3 -63.1 L-237.3 -59.8 L-232.4 -55.1 L-227.6 -49.9 L-222.9 -44.3 L-218.2 -38.3 L-213.6 -32.1 L-208.9 -25.6 L-204.3 -18.9 L-199.5 -12.1 L-194.6 -5.2 L-189.6 1.7 L-184.4 8.6 L-178.9 15.3 L-173.2 21.9 L-167.1 28.3 L-160.7 34.4 L-153.8 40.2 L-146.5 45.5 L-138.6 50.4 L-130.2 54.6 L-121.2 58.2 L-111.7 61.0 L-101.5 63.1 L-90.8 64.2 L-79.9 64.5Z\" fill=\"url(#kbody)\"/>\n        <path d=\"M-100.0 48.0 L-109.1 46.4 L-117.7 44.1 L-125.8 41.1 L-133.4 37.4 L-140.6 33.2 L-147.4 28.4 L-153.8 23.2 L-160.0 17.7 L-165.8 11.7 L-171.4 5.5 L-176.7 -0.9 L-181.9 -7.4 L-187.0 -14.1 L-191.9 -20.8 L-196.8 -27.5 L-201.6 -34.2 L-206.5 -40.7 L-211.4 -47.0 L-216.3 -53.1 L-221.4 -58.8 L-226.6 -64.2 L-232.0 -69.2 L-236.5 -72.8 L-241.0 -76.0 L-245.5 -78.8 L-249.9 -81.3 L-254.3 -83.4 L-258.7 -85.2 L-263.0 -86.6 L-267.2 -87.7 L-271.4 -88.5 L-275.5 -88.9 L-279.6 -89.1 L-283.5 -88.9 L-287.3 -88.4\" fill=\"none\" stroke=\"#B5D08F\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\".55\"/>\n        <path d=\"M-96-38Q-96-72-60-72H60Q96-72 96-38L102 56Q104 88 72 88H-72Q-104 88-102 56Z\" fill=\"url(#kbody)\"/>\n        <path d=\"M-96-38Q-96-72-60-72H60Q96-72 96-38L102 56Q104 88 72 88H-72Q-104 88-102 56Z\" fill=\"url(#kbodyV)\"/>\n        <path d=\"M-70-56L-80 70\" stroke=\"#fff\" stroke-opacity=\".2\" stroke-width=\"9\" stroke-linecap=\"round\" filter=\"url(#blur1)\"/>\n        <rect x=\"-103\" y=\"34\" width=\"206\" height=\"3\" fill=\"#F0E2B3\" opacity=\".75\"/>\n        <path d=\"M-62-72Q0-108 62-72Z\" fill=\"#2F4420\"/>\n        <path d=\"M-62-72Q0-108 62-72\" fill=\"none\" stroke=\"#7FA05A\" stroke-width=\"1.5\" opacity=\".6\"/>\n        <rect x=\"-64\" y=\"-76\" width=\"128\" height=\"6\" rx=\"3\" fill=\"#1D2B14\"/>\n        <circle cx=\"0\" cy=\"-104\" r=\"8\" fill=\"#1D2B14\"/><circle cx=\"-2\" cy=\"-106\" r=\"3\" fill=\"#F0E2B3\" opacity=\".6\"/>\n      </g>\n    "}} />
    <p className="lab side" aria-hidden="true">Husk &amp; Honey  /  Siliguri  /  26.72° N 88.39° E  /  Poured <span id="pct">0</span>%</p>
  </div>
</section>
  );
}
