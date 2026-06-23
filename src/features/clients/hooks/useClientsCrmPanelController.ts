"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useClients } from "@/features/clients/useClients";
import { useClientSites } from "@/features/clients/useClientSites";
import { buildClientDisplayName } from "@/features/clients/clientDisplayName";
import { parseClientsCsv } from "@/features/clients/parseClientsCsv";
import { clearClientsOfflineCache } from "@/features/clients/clientCrmOfflineCache";
import {
  bulkCreateClients,
  createClient,
  createSite,
  deleteClientWithSites,
  updateClient,
} from "@/features/clients/clientFirestore";
import { useDashboardPagerOptional } from "@/features/dashboard";

export function useClientsCrmPanelController() {
  const { t } = useTranslation();
  const crmEnabled = useFeatureFlag("crmContacts");
  const pwaV2 = useFeatureFlag("pwaV2Bundle");
  const equipmentEnabled = useFeatureFlag("equipmentInventory");
  const maintenanceEnabled = useFeatureFlag("maintenanceContracts");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const pager = useDashboardPagerOptional();
  const { clients, loading, offline } = useClients();
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
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selected) return;
    setEditFirstName(selected.firstName ?? "");
    setEditLastName(selected.lastName ?? "");
    setEditPhone(selected.phone ?? "");
    setEditEmail(selected.email ?? "");
    setEditCompanyName(selected.companyName ?? "");
  }, [selected]);

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

  const handleDeleteClient = async () => {
    if (!firestore || !companyId || !selected) return;
    const name = buildClientDisplayName(selected) || selected.id;
    if (!window.confirm(t("crm.delete_client_confirm").replace("{{name}}", name))) return;
    setBusy(true);
    try {
      await deleteClientWithSites(firestore, companyId, selected.id);
      clearClientsOfflineCache(companyId);
      setSelectedId(null);
      toast.success(String(t("crm.client_deleted")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selected) return;
    const displayName = buildClientDisplayName({
      displayName: "",
      firstName: editFirstName,
      lastName: editLastName,
      companyName: editCompanyName,
    });
    if (!displayName) {
      toast.error(String(t("crm.client_name_required")));
      return;
    }
    setBusy(true);
    try {
      await updateClient(firestore, selected.id, {
        displayName,
        firstName: editFirstName.trim() || null,
        lastName: editLastName.trim() || null,
        companyName: editCompanyName.trim() || null,
        phone: editPhone.trim() || null,
        email: editEmail.trim() || null,
      });
      toast.success(String(t("crm.client_updated")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !firestore || !companyId) return;
    setBusy(true);
    try {
      const text = await file.text();
      const rows = parseClientsCsv(text);
      if (rows.length === 0) {
        toast.error(String(t("crm.import_empty")));
        return;
      }
      const n = await bulkCreateClients(
        firestore,
        companyId,
        rows.map((r) => ({
          displayName: r.displayName,
          firstName: r.firstName ?? null,
          lastName: r.lastName ?? null,
          companyName: r.companyName ?? null,
          phone: r.phone ?? null,
          email: r.email ?? null,
        }))
      );
      toast.success(String(t("crm.import_success")).replace("{{count}}", String(n)));
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

  return {
    t,
    crmEnabled,
    pwaV2,
    equipmentEnabled,
    maintenanceEnabled,
    companyId,
    pager,
    clients,
    loading,
    offline,
    query,
    setQuery,
    selectedId,
    setSelectedId,
    selected,
    sites,
    sitesLoading,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    email,
    setEmail,
    siteLabel,
    setSiteLabel,
    siteAddress,
    setSiteAddress,
    busy,
    editFirstName,
    setEditFirstName,
    editLastName,
    setEditLastName,
    editPhone,
    setEditPhone,
    editEmail,
    setEditEmail,
    importInputRef,
    filtered,
    handleCreateClient,
    handleDeleteClient,
    handleSaveClient,
    handleImportCsv,
    handleCreateSite,
  };
}
