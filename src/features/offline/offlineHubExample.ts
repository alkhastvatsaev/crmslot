export type OfflineHubExampleMission = {
  id: string;
  title: string;
  problem?: string;
};

export const OFFLINE_HUB_EXAMPLE_QUEUE_COUNT = 2;

export const OFFLINE_HUB_EXAMPLE_MISSIONS: OfflineHubExampleMission[] = [
  {
    id: "ex-off-1",
    title: "Ouverture porte — Dupont SA",
    problem: "Clôture en attente d’envoi",
  },
  {
    id: "ex-off-2",
    title: "Remplacement cylindre — Ixelles",
    problem: "Photos terrain à synchroniser",
  },
  {
    id: "ex-off-3",
    title: "Sécurisation vitrine — Centre",
    problem: "Rapport PDF en file",
  },
];
