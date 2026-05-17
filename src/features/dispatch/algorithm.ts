import { Technician } from '@/features/technicians/types';
import { fetchWithAuth } from '@/core/api/fetchWithAuth';
import { haversineDistanceKm } from '@/features/dispatch/rankTechniciansForIntervention';


export async function findBestTechnician(
  technicians: Technician[], 
  interventionLat: number, 
  interventionLng: number
): Promise<Technician | null> {
  

  const availableTechs = technicians.filter(t => t.status === 'available');
  
  if (availableTechs.length === 0) return null;


  const sortedByHaversine = availableTechs.sort((a, b) => {
    return haversineDistanceKm(interventionLat, interventionLng, a.location.lat, a.location.lng)
         - haversineDistanceKm(interventionLat, interventionLng, b.location.lat, b.location.lng);
  });

  const top3 = sortedByHaversine.slice(0, 3);


  let bestTech: Technician | null = null;
  let minDuration = Infinity;

  for (const tech of top3) {
    try {
      const response = await fetchWithAuth('/api/maps/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originLat: tech.location.lat,
          originLng: tech.location.lng,
          destLat: interventionLat,
          destLng: interventionLng
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.durationSeconds < minDuration) {
        minDuration = data.durationSeconds;
        bestTech = { ...tech, realEta: data.durationText }; // Ajoute l'ETA réel
      }
    } catch(e) {
      console.error("Erreur Google Maps pour le tech", tech.name, e);
    }
  }


  return bestTech || top3[0];
}
