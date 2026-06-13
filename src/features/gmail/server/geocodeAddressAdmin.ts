/** Géocode une adresse belge via Mapbox (serveur). */
export async function geocodeAddressAdmin(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const token =
    process.env.MAPBOX_ACCESS_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token) return null;

  const q = encodeURIComponent(address.trim());
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${encodeURIComponent(token)}&country=be&language=fr&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as {
    features?: Array<{ center?: [number, number] }>;
  } | null;
  const center = data?.features?.[0]?.center;
  if (!center || center.length !== 2) return null;
  const [lng, lat] = center;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}
