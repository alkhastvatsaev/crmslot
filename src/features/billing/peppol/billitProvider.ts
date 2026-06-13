import { logger } from "@/core/logger";
import type { PeppolProvider, PeppolSendMeta, PeppolSendResult } from "./peppolProvider";

/**
 * Stub Billit — mock tant qu'aucune clé API n'est configurée.
 * Prêt pour brancher l'API REST Billit via `BILLIT_API_KEY`.
 */
export class BillitPeppolProvider implements PeppolProvider {
  readonly name = "billit";

  async send(ublXml: string, meta: PeppolSendMeta): Promise<PeppolSendResult> {
    const apiKey = process.env.BILLIT_API_KEY?.trim();
    if (apiKey) {
      logger.warn("[peppol/billit] BILLIT_API_KEY set but HTTP client not implemented — mock send");
    }
    if (!ublXml.includes("<cbc:ID>")) {
      return { ok: false, provider: this.name, error: "UBL invalide (cbc:ID manquant)" };
    }
    return {
      ok: true,
      provider: this.name,
      transmissionId: `billit-mock-${meta.invoiceNumber}-${Date.now().toString(36)}`,
    };
  }
}
