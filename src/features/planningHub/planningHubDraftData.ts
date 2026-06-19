export type PlanningDraftTech = {
  id: string;
  name: string;
  status: "available" | "on-mission" | "off";
  slots: { time: string; label: string; kind: "free" | "busy" | "conflict" }[];
};

export type PlanningDraftConfirmation = {
  id: string;
  client: string;
  slot: string;
  sentAt: string;
  state: "pending" | "confirmed" | "declined";
};

export const PLANNING_DRAFT_TECHS: PlanningDraftTech[] = [
  {
    id: "t1",
    name: "Jean D.",
    status: "available",
    slots: [
      { time: "08:00", label: "Libre", kind: "free" },
      { time: "09:00", label: "IV-1042 · Serrure", kind: "busy" },
      { time: "10:00", label: "Conflit ×2", kind: "conflict" },
      { time: "11:00", label: "Libre", kind: "free" },
    ],
  },
  {
    id: "t2",
    name: "Marie L.",
    status: "on-mission",
    slots: [
      { time: "08:00", label: "IV-1038 · Porte", kind: "busy" },
      { time: "09:00", label: "Libre", kind: "free" },
      { time: "10:00", label: "IV-1051", kind: "busy" },
      { time: "11:00", label: "Libre", kind: "free" },
    ],
  },
  {
    id: "t3",
    name: "Paul K.",
    status: "off",
    slots: [
      { time: "08:00", label: "Congé", kind: "busy" },
      { time: "09:00", label: "Congé", kind: "busy" },
      { time: "10:00", label: "Congé", kind: "busy" },
      { time: "11:00", label: "Congé", kind: "busy" },
    ],
  },
];

export const PLANNING_DRAFT_CONFIRMATIONS: PlanningDraftConfirmation[] = [
  {
    id: "c1",
    client: "Dupont — IV-1042",
    slot: "Mar 18 juin · 09:00",
    sentAt: "Il y a 2 h",
    state: "pending",
  },
  {
    id: "c2",
    client: "Martin — IV-1035",
    slot: "Mer 19 juin · 14:00",
    sentAt: "Confirmé hier",
    state: "confirmed",
  },
  {
    id: "c3",
    client: "SA BXL — IV-1029",
    slot: "Jeu 20 juin · 10:00",
    sentAt: "Refus client",
    state: "declined",
  },
];
