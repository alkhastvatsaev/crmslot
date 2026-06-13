/**
 * Abstraction point d'accès Peppol. Aucun compte requis : sans variable
 * d'environnement `PEPPOL_PROVIDER`, le provider mock simule l'envoi
 * (transmissionId local) pour préparer l'intégration réelle (Billit, Banqup…).
 */

export type PeppolSendMeta = {
  invoiceNumber: string;
  companyId: string;
  interventionId: string;
};

export type PeppolSendResult = {
  ok: boolean;
  provider: string;
  transmissionId?: string;
  error?: string;
};

export interface PeppolProvider {
  readonly name: string;
  send(ublXml: string, meta: PeppolSendMeta): Promise<PeppolSendResult>;
}

import { BillitPeppolProvider } from "./billitProvider";

export class MockPeppolProvider implements PeppolProvider {
  readonly name = "mock";

  async send(ublXml: string, meta: PeppolSendMeta): Promise<PeppolSendResult> {
    if (!ublXml.includes("<cbc:ID>")) {
      return { ok: false, provider: this.name, error: "UBL invalide (cbc:ID manquant)" };
    }
    return {
      ok: true,
      provider: this.name,
      transmissionId: `mock-${meta.invoiceNumber}-${Date.now().toString(36)}`,
    };
  }
}

/** Retourne le provider configuré — mock par défaut (aucun compte requis). */
export function getPeppolProvider(
  env: Record<string, string | undefined> = process.env
): PeppolProvider {
  const configured = env.PEPPOL_PROVIDER?.trim().toLowerCase();
  if (configured === "billit") return new BillitPeppolProvider();
  return new MockPeppolProvider();
}
