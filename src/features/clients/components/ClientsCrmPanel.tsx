"use client";

import { useMemo, useState } from "react";
import { MapPin, Plus, Search, User } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useClients } from "@/features/clients/useClients";
import { useClientSites } from "@/features/clients/useClientSites";
import { buildClientDisplayName } from "@/features/clients/clientDisplayName";
import { createClient, createSite } from "@/features/clients/clientFirestore";

export default function ClientsCrmPanel() {
  const { t } = useTranslation();
  const crmEnabled = useFeatureFlag("crmContacts");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const { clients, loading } = useClients();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = clients.find((c) => c.id === selectedId) ?? null;
  const { sites, loading: sitesLoading } = useClientSites(companyId, selectedId);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [siteLabel, setSiteLabel] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const hay = [c.displayName, c.firstName, c.lastName, c.companyName, c.phone, c.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [clients, query]);

  if (!crmEnabled) {
    return (
      <p
        data-testid="crm-disabled-hint"
        className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500"
      >
        {t("crm.disabled_hint")}
      </p>
    );
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId) return;
    const displayName = buildClientDisplayName({
      displayName: "",
      firstName,
      lastName,
      companyName,
    });
    if (!displayName) {
      toast.error(String(t("crm.client_name_required")));
      return;
    }
    setBusy(true);
    try {
      const id = await createClient(firestore, {
        companyId,
        displayName,
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        companyName: companyName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      });
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setCompanyName("");
      setSelectedId(id);
      toast.success(String(t("crm.client_created")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId || !selected) return;
    if (!siteAddress.trim()) {
      toast.error(String(t("crm.site_address_required")));
      return;
    }
    setBusy(true);
    try {
      await createSite(firestore, {
        companyId,
        clientId: selected.id,
        label: siteLabel.trim() || siteAddress.trim(),
        address: siteAddress.trim(),
      });
      setSiteLabel("");
      setSiteAddress("");
      toast.success(String(t("crm.site_created")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div data-testid="clients-crm-panel" className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">