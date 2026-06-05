/** Icône camionnette Mapbox (DOM marker). */
export function createTechnicianVanMarkerElement(name: string): HTMLDivElement {
  const slug = name.trim().toLowerCase().replace(/\s+/g, "-") || "technician";
  const el = document.createElement("div");
  el.className =
    "map-technician-van-marker relative flex flex-col items-center pointer-events-none select-none";
  el.setAttribute("data-testid", `map-technician-marker-${slug}`);
  el.title = name;

  const bubble = document.createElement("div");
  bubble.className =
    "flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue-500 bg-white shadow-[0_4px_14px_rgba(59,130,246,0.45)]";
  bubble.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`;

  const label = document.createElement("span");
  label.className =
    "mt-0.5 max-w-[72px] truncate rounded-md bg-blue-700/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm";
  label.textContent = name;

  el.appendChild(bubble);
  el.appendChild(label);
  return el;
}
