/* eslint-disable */
// One drawn icon set for the whole app: 24 × 24, 1.8 stroke, round ends. Plan types get line badges like
// Prague's metro and tram lines: a coloured square with the type's icon (styles.css, .lb).
import { svg } from "./dom";

const P={
  today:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  week:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
  rats:'<circle cx="6.5" cy="7" r="3.2"/><circle cx="17.5" cy="7" r="3.2"/><path d="M12 21c-4.2 0-7-3-7-6.8C5 11 8 9 12 9s7 2 7 5.2C19 18 16.2 21 12 21z"/><circle cx="12" cy="17" r="1" fill="currentColor"/><path d="M9.3 13.6h.01M14.7 13.6h.01" stroke-width="2.4"/>',
  money:'<ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  trip:'<rect x="4" y="7.5" width="16" height="12.5" rx="2.5"/><path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M4 12.5h16M10.5 12.5v2h3v-2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert:'<path d="M12 7.5v6M12 16.8v.01" stroke-width="2.4"/>',
  swap:'<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
  grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"/>',
  feed:'<rect x="4" y="3.5" width="16" height="11" rx="1.5"/><path d="M4 18h16M4 21h10"/>',
  // Plan types.
  work:'<rect x="4.5" y="5.5" width="15" height="10" rx="1.5"/><path d="M2.5 18.5h19"/>',
  food:'<path d="M7 3.5v7.5M4.5 3.5v4.5a2.5 2.5 0 0 0 5 0V3.5M7 11v9.5M17 20.5V3.5c-2.2 1-3.5 3.6-3.5 7h3.5"/>',
  coffee:'<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5c-.8 1 .8 2 0 3M12.5 3.5c-.8 1 .8 2 0 3"/>',
  sight:'<path d="M12 2.5l2.5 6H9.5zM9.5 8.5h5V20h-5zM6 20h12M11 13h2"/>',
  night:'<path d="M5 4.5h14l-7 8z"/><path d="M12 12.5V19M8 19.5h8M15.5 4.5l2-2"/>',
  travel:'<path d="M20.5 15.5v-2l-7.5-4.5V4.5a1.5 1.5 0 0 0-3 0V9l-7.5 4.5v2l7.5-2.2V17L8 18.6V20l3.5-.9L15 20v-1.4L13 17v-3.7z"/>',
};

export const icon=(name:string,extra?:string)=>{const e=svg(`<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[name]||""}</g>`,"0 0 24 24");e.classList.add("ic");if(extra)e.classList.add(extra);return e};

export const iconHTML=(name:string)=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[name]||""}</g></svg>`;
