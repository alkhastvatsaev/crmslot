export const requesterStepVariants = {
  initial: { opacity: 0, x: 20, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: -20, filter: "blur(4px)" },
};

export const requesterStepSpringTransition = { type: "spring", bounce: 0, duration: 0.4 } as const;

/** Calque d'étape — remplit la zone au-dessus du footer stepper (jamais en overlay). */
export const requesterStepLayerClass =
  "absolute inset-0 overflow-y-auto custom-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";
