import { Technician } from '@/features/technicians/types';
import { fetchWithAuth } from '@/core/api/fetchWithAuth';
import { haversineDistanceKm } from '@/features/dispatch/rankTechniciansForIntervention';
import { canResolveTechnicianAssignUid } from '@/features/dispatch/technicianAssignUid';
import { technicianHasRequiredSkills } from '@/features/technicians/skillConstants';


export async function findBestTechnician(
  technicians: Technician[],
  interventionLat: number,
  interventionLng: number,
  interventionProblem?: string | null,
  interventionAddress?: string | null,
  requiredSkills?: string[] | null,
): Promise<{ technician: Technician; reasoning?: string } | null> {


  const availableTechs = technicians.filter(t =>
    t.status === 'available' &&
    canResolveTechnicianAssignUid(t) &&
    typeof t.location?.lat === 'number' && !Number.isNaN(t.location?.lat) &&
    typeof t.location?.lng === 'number' && !Number.isNaN(t.location?.lng) &&
    technicianHasRequiredSkills(t.skills, requiredSkills)
  );
  
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


  // On met à jour les top3 avec leur realEta s'il a été trouvé
  const updatedTop3 = top3.map(t => {
    if (bestTech && t.id === bestTech.id) return bestTech;
    return t;
  });

  try {
    const res = await fetchWithAuth('/api/ai/smart-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problem: interventionProblem,
        address: interventionAddress,
        technicians: updatedTop3
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.bestTechnicianId) {
        const aiChosen = updatedTop3.find(t => t.id === data.bestTechnicianId);
        if (aiChosen) {
          return { technician: aiChosen, reasoning: data.reasoning };
        }
      }
    }
  } catch (e) {
    console.error("Erreur Smart Dispatch AI", e);
  }

  // Fallback if AI fails: return the closest one with Maps ETA
  return bestTech ? { technician: bestTech } : top3[0] ? { technician: top3[0] } : null;
}
