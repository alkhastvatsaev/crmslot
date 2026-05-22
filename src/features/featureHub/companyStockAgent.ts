import { filterStockItemsBySearch } from "@/features/featureHub/filterCompanyStock";
import { stockHealth, sortStockByPatronPriority } from "@/features/featureHub/companyStockMetrics";
import {
  classifyCompanyStockAgentIntent,
  extractStockSearchQuery,
  isCompanyStockAgentInScope,
} from "@/features/featureHub/companyStockAgentScope";
import type {
  CompanyStockAgentContext,
  CompanyStockAgentTurnResult,
} from "@/features/featureHub/companyStockAgentTypes";
import type { StockItem } from "@/features/materials/stockFirestore";

const MAX_LINES = 8;

function formatItemLine(item: StockItem): string {
  const h = stockHealth(item);
  const flag = h === "out" ? "⛔" : h === "low" ? "⚠" : "✓";
  const ref = item.reference?.trim() ? ` (${item.reference})` : "";
  return `${flag} ${item.description}${ref} — ${item.quantity}/${item.alertThreshold}`;
}

function listLines(items: StockItem[], emptyLabel: string): string {
  if (items.length === 0) return emptyLabel;
  const slice = sortStockByPatronPriority(items).slice(0, MAX_LINES);
  const lines = slice.map(formatItemLine).join("\n");
  const more = items.length > MAX_LINES ? `\n… +${items.length - MAX_LINES} autres` : "";
  return `${lines}${more}`;
}

function buildSummary(ctx: CompanyStockAgentContext): string {
  const m = ctx.metrics;
  const parts = [
    `${m.totalSkus} réf. · couverture ${m.coveragePct} %`,
    m.outCount > 0 ? `${m.outCount} rupture(s)` : null,
    m.lowCount > 0 ? `${m.lowCount} sous seuil` : null,
    m.pendingFieldOrders > 0 ? `${m.pendingFieldOrders} demande(s) terrain` : null,
    m.waitingMaterialJobs > 0 ? `${m.waitingMaterialJobs} chantier(s) en attente matériel` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function handleIntent(
  intent: ReturnType<typeof classifyCompanyStockAgentIntent>,
  userText: string,
  ctx: CompanyStockAgentContext,
): CompanyStockAgentTurnResult {
  const outItems = ctx.items.filter((i) => i.quantity <= 0);
  const lowItems = ctx.items.filter((i) => i.quantity > 0 && i.quantity <= i.alertThreshold);
  const pendingOrders = ctx.orders.filter((o) => o.status === "pending");

  switch (intent) {
    case "off_topic":
      return {
        intent,
        refused: true,
        reply:
          "Je suis l'agent **Matériel** de votre société — stock, seuils, demandes terrain et commandes fournisseur uniquement. Pour facturation, planning, mails ou dossiers clients, utilisez l'assistant principal (page Ivana).",
        suggestions: [
          "État du stock",
          "Articles en rupture",
          "Demandes technicien",
        ],
      };

    case "greeting":
      return {
        intent,
        refused: false,
        reply: `Bonjour. Je gère le stock matériel (${ctx.metrics.totalSkus} réf.). Demandez un résumé, les ruptures, une recherche par nom/référence, ou les demandes en attente.`,
        suggestions: ["Résumé stock", "Ruptures", "Recherche gâche"],
      };

    case "help":
      return {
        intent,
        refused: false,
        reply:
          "Périmètre : inventaire, alertes (rupture / seuil), demandes technicien, commandes Lecot. Exemples : « état du stock », « ruptures », « cherche cylindre », « demandes en attente ». Les autres sujets (facture, mail, planning…) ne sont pas traités ici.",
        suggestions: ["État du stock", "Stock bas", "Demandes terrain"],
      };

    case "summary":
      return {
        intent,
        refused: false,
        reply: buildSummary(ctx),
        suggestions:
          ctx.metrics.outCount > 0
            ? ["Lister ruptures", "Stock bas"]
            : ["Rechercher un article"],
      };

    case "list_out":
      return {
        intent,
        refused: false,
        reply: listLines(outItems, "Aucune rupture — toutes les quantités sont > 0."),
        action:
          outItems[0] != null ? { focusStockItemId: sortStockByPatronPriority(outItems)[0]!.id } : undefined,
      };

    case "list_low":
      return {
        intent,
        refused: false,
        reply: listLines(lowItems, "Aucun article sous le seuil d'alerte."),
        action:
          lowItems[0] != null ? { focusStockItemId: sortStockByPatronPriority(lowItems)[0]!.id } : undefined,
      };

    case "list_alerts": {
      const alerts = [...outItems, ...lowItems];
      return {
        intent,
        refused: false,
        reply: listLines(alerts, "Aucune alerte stock — tout est au-dessus des seuils."),
        action:
          alerts[0] != null ? { focusStockItemId: sortStockByPatronPriority(alerts)[0]!.id } : undefined,
      };
    }

    case "search": {
      const q = extractStockSearchQuery(userText);
      const hits = filterStockItemsBySearch(ctx.items, q);
      return {
        intent,
        refused: false,
        reply:
          hits.length === 0
            ? `Aucun article pour « ${q} ».`
            : `${hits.length} résultat(s) :\n${listLines(hits, "")}`,
        action: {
          searchQuery: q,
          focusStockItemId: hits[0]?.id,
        },
      };
    }

    case "pending_orders":
      if (pendingOrders.length === 0) {
        return {
          intent,
          refused: false,
          reply: "Aucune demande matériel terrain en attente de validation.",
        };
      }
      const lines = pendingOrders.slice(0, MAX_LINES).map((o) => {
        const part = o.partsRequested?.[0];
        const label = part?.description?.trim() || part?.reference?.trim() || o.interventionId || o.id;
        return `• ${label} (${o.status})`;
      });
      const more =
        pendingOrders.length > MAX_LINES
          ? `\n… +${pendingOrders.length - MAX_LINES} autres`
          : "";
      return {
        intent,
        refused: false,
        reply: `${pendingOrders.length} demande(s) :\n${lines.join("\n")}${more}`,
      };

    case "waiting_jobs":
      if (ctx.metrics.waitingMaterialJobs === 0) {
        return { intent, refused: false, reply: "Aucun chantier en statut « attente matériel »." };
      }
      return {
        intent,
        refused: false,
        reply: `${ctx.metrics.waitingMaterialJobs} intervention(s) en attente matériel — consultez le back-office pour les dossiers concernés.`,
      };

    case "lecot":
      return {
        intent,
        refused: false,
        reply:
          "Pour commander chez Lecot : utilisez le bouton ✨ (autopilot) au centre, ou l'assistant Ivana avec le catalogue. Indiquez la référence ou le produit ; je peux d'abord chercher un article dans votre stock.",
        suggestions: ["Recherche lecot", "État du stock"],
      };

    case "add_item":
      return {
        intent,
        refused: false,
        reply:
          "Ajoutez une référence via le bouton **+** à côté de la recherche (description obligatoire, référence optionnelle).",
      };

    case "autopilot":
      return {
        intent,
        refused: false,
        reply:
          "Lancez **Régler le stock** (bouton ✨ en haut) : validation des demandes démo puis proposition d'achats via l'assistant si besoin.",
      };

    default:
      return {
        intent: "summary",
        refused: false,
        reply: buildSummary(ctx),
      };
  }
}

/** Tour agent 100 % logique — pas d'appel LLM. */
export function runCompanyStockAgentTurn(
  userText: string,
  ctx: CompanyStockAgentContext,
): CompanyStockAgentTurnResult {
  const trimmed = userText.trim();
  if (!ctx.companyId) {
    return {
      intent: "off_topic",
      refused: true,
      reply: "Sélectionnez une société active pour utiliser l'agent matériel.",
    };
  }

  const inScope = isCompanyStockAgentInScope(trimmed);
  const intent = classifyCompanyStockAgentIntent(trimmed, inScope);
  return handleIntent(intent, trimmed, ctx);
}
