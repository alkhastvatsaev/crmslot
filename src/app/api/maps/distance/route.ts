import { NextResponse } from 'next/server';
import { Client, TrafficModel } from '@googlemaps/google-maps-services-js';
import { requireAuthenticatedUser } from '@/core/api/routeAuth';

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ('response' in auth) return auth.response;

  try {
    const { originLat, originLng, destLat, destLng } = await request.json();

    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json({ error: 'Coordonnées manquantes' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé Google Maps manquante' }, { status: 500 });
    }

    const client = new Client({});

    const response = await client.distancematrix({
      params: {
        origins: [{ lat: originLat, lng: originLng }],
        destinations: [{ lat: destLat, lng: destLng }],
        key: apiKey,
        departure_time: 'now' as unknown as number,
        traffic_model: TrafficModel.best_guess,
      }
    });

    const element = response.data.rows[0].elements[0];

    if (element.status !== 'OK') {
      throw new Error(`Erreur de calcul d'itinéraire: ${element.status}`);
    }

    // On priorise 'duration_in_traffic' (avec bouchons) si disponible, sinon 'duration' (route fluide)
    const duration = element.duration_in_traffic || element.duration;

    return NextResponse.json({ 
      success: true, 
      durationSeconds: duration.value,
      durationText: duration.text,
      distanceMeters: element.distance.value 
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erreur Google Maps:', error);
    const message = error instanceof Error ? error.message : 'Échec du calcul de trafic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
