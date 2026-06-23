"use client";

import { useEffect, useMemo, useState } from "react";
import { CRMSLOT_CRM_ORDERS_CHANGED_EVENT } from "../crmOrdersChangedEvent";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useCompanyMaterialOrdersRecent } from "@/features/featureHub/hooks/useCompanyMaterialOrdersRecent";
import { useCompanySupplierOrdersRecent } from "@/features/featureHub/hooks/useCompanySupplierOrdersRecent";
import { useCompanyEmailsFeed } from "./useCompanyEmailsFeed";
import { useCompanyCommissionsFeed } from "./useCompanyCommissionsFeed";
import {
  mergeAndSortCrmEvents,
  synthesizeCommissionEvents,
  synthesizeEmailEvents,
  synthesizeInterventionEvents,
  synthesizeInterventionLifecycleEvents,
  synthesizeMaterialOrderEvents,
  synthesizeSupplierOrderEvents,
} from "../crmActivitySynthesizer";
import { synthesizeCompanyCrmLogEvents } from "../crmActivityLog";
import { dedupeCrmEvents, synthesizeStatusEvents } from "../crmStatusEvents";
import { applyPeriod, applyTypeFilter, applySearch, applyDateFilter } from "../crmActivityFilters";
import type { CrmPeriodFilter, CrmTypeFilter } from "../crmActivityTypes";
import type { Intervention } from "@/features/interventions";
import { useCompanyStatusEventsFeed } from "./useCompanyStatusEventsFeed";
import { useCompanyCrmActivityLog } from "./useCompanyCrmActivityLog";
import { useCompanyIvanaChatFeed } from "./useCompanyIvanaChatFeed";
import { synthesizeIvanaChatEvents } from "../synthesizeIvanaChatEvents";

export function useCrmActivityFeed(
  companyId: string | null,
  period: CrmPeriodFilter,
  typeFilter: CrmTypeFilter,
  searchQuery: string,
  selectedDate?: Date | null
) {
  const [ordersRevision, setOrdersRevision] = useState(0);

  useEffect(() => {
    const onOrdersChanged = () => setOrdersRevision((n) => n + 1);
    window.addEventListener(CRMSLOT_CRM_ORDERS_CHANGED_EVENT, onOrdersChanged);
    return () => window.removeEventListener(CRMSLOT_CRM_ORDERS_CHANGED_EVENT, onOrdersChanged);
  }, []);

  const feedCompanyId = companyId;

  const { interventions, loading: ivLoading } = useBackOfficeInterventions(feedCompanyId);
  const { orders: materialOrders, loading: moLoading } =
    useCompanyMaterialOrdersRecent(feedCompanyId);
  const {
    orders: supplierOrders,
    loading: soLoading,
    error: supplierOrdersError,
  } = useCompanySupplierOrdersRecent(feedCompanyId);
  const { emails, loading: emailLoading } = useCompanyEmailsFeed(feedCompanyId);
  const { rows: commissions, loading: commLoading } = useCompanyCommissionsFeed(feedCompanyId);
  const { events: statusEvents, loading: statusLoading } =
    useCompanyStatusEventsFeed(feedCompanyId);
  const {
    rows: crmLogRows,
    loading: crmLogLoading,
    error: crmLogError,
  } = useCompanyCrmActivityLog(feedCompanyId);
  const { messages: ivanaMessages, loading: ivanaLoading } = useCompanyIvanaChatFeed(feedCompanyId);

  const anySourceLoading =
    ivLoading ||
    moLoading ||
    soLoading ||
    emailLoading ||
    commLoading ||
    statusLoading ||
    crmLogLoading ||
    ivanaLoading;

  const interventionMap = useMemo<Map<string, Intervention>>(
    () => new Map(interventions.map((iv) => [iv.id, iv])),
    [interventions]
  );

  const allEvents = useMemo(
    () =>
      dedupeCrmEvents(
        mergeAndSortCrmEvents(
          synthesizeInterventionEvents(interventions),
          synthesizeInterventionLifecycleEvents(interventions),
          synthesizeStatusEvents(statusEvents, interventionMap),
          synthesizeCompanyCrmLogEvents(crmLogRows),
          synthesizeIvanaChatEvents(ivanaMessages, interventionMap),
          synthesizeMaterialOrderEvents(materialOrders),
          synthesizeSupplierOrderEvents(supplierOrders),
          synthesizeEmailEvents(emails, interventionMap),
          synthesizeCommissionEvents(commissions, interventionMap)
        )
      ),
    [
      interventions,
      materialOrders,
      supplierOrders,
      emails,
      commissions,
      interventionMap,
      statusEvents,
      crmLogRows,
      ivanaMessages,
      ordersRevision,
    ]
  );

  const filteredEvents = useMemo(() => {
    let evts = selectedDate
      ? applyDateFilter(allEvents, selectedDate)
      : applyPeriod(allEvents, period);
    evts = applyTypeFilter(evts, typeFilter);
    evts = applySearch(evts, searchQuery);
    return evts;
  }, [allEvents, period, typeFilter, searchQuery, selectedDate]);

  const loading = allEvents.length === 0 && anySourceLoading;
  const refreshing = allEvents.length > 0 && anySourceLoading;

  return {
    events: filteredEvents,
    totalCount: allEvents.length,
    loading,
    refreshing,
    anySourceLoading,
    feedError:
      allEvents.length === 0 && (crmLogError ?? supplierOrdersError)
        ? (crmLogError ?? supplierOrdersError)
        : null,
  };
}
