export const SMART_TIME_SLOT_WORKING_HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export type SmartTimeSlotNextSlot = {
  date: string;
  time: string;
  dateObj: Date;
  isToday: boolean;
  isTomorrow: boolean;
};

export type SmartTimeSlotSpecificSlot = {
  time: string;
  disabled: boolean;
};
