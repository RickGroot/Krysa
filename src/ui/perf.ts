/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).


export const PAUSE_IO=("IntersectionObserver" in window)?new IntersectionObserver(es=>{for(const e of es)e.target.classList.toggle("offscreen",!e.isIntersecting)},{rootMargin:"160px"}):null;

export function watchAnims(){if(!PAUSE_IO)return;PAUSE_IO.disconnect();document.querySelectorAll(".alive,.meme,.fl-plane,.hero-slot").forEach(el=>PAUSE_IO.observe(el))}
