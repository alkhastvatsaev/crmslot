import type { Quote } from "@/features/quotes/types";

export type QuoteEditorPanelProps = {
  quote?: Quote;
  interventionId?: string;
  onSaved?: (id: string) => void;
};
