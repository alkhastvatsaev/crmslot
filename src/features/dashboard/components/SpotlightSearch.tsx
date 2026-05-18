"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import { X, Globe, Search, Map, Building2, Wrench, LayoutDashboard, CloudOff, Smartphone, FileText, Phone, Navigation, ExternalLink, Download, BarChart3 } from 'lucide-react';
import { BACKOFFICE_HUB_SLOT_INDEX } from '@/features/backoffice/backofficeHubConstants';
import { AI_ASSISTANT_SLOT_INDEX } from '@/features/ai/aiAssistantConstants';
import { TECHNICIAN_LAB_SLOT_INDEX } from '@/features/technicians/technicianLabConstants';
import { useDashboardPagerOptional } from '@/features/dashboard/dashboardPagerContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DASHBOARD_PANEL_CHROME_BLUR,
  DASHBOARD_PANEL_CHROME_BORDER,
  DASHBOARD_PANEL_CHROME_ROUNDED,
  DASHBOARD_PANEL_INNER_CLIP_CLASS,
  DASHBOARD_PANEL_SHADOW_CLASS,
  GLASS_PANEL_OVERFLOW_PADDING,
} from '@/core/ui/glassPanelChrome';
import { dashboardHeaderPanelShellClass } from '@/core/ui/dashboardDesktopLayout';
import { useTranslation, Language } from '@/core/i18n/I18nContext';
import { useCompanyWorkspaceOptional } from '@/context/CompanyWorkspaceContext';
import { isCompanyDispatchViewer } from '@/features/company/isCompanyDispatchViewer';
import { useBackOfficeInterventions } from '@/features/backoffice/useBackOfficeInterventions';
import { useTechnicianAssignments } from '@/features/interventions/useTechnicianAssignments';
import { interventionClientLabel } from '@/features/interventions/technicianSchedule';

const languages: { code: Language; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'nl', label: 'NL' },
];

export default function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const navPages = useMemo(() => [
    { index: 0, label: t('spotlight.nav_map'),        Icon: Map },
    { index: 1, label: t('spotlight.nav_company'),    Icon: Building2 },
    { index: 2, label: t('spotlight.nav_technician'), Icon: Wrench },
    { index: BACKOFFICE_HUB_SLOT_INDEX, label: t('spotlight.nav_backoffice'), Icon: LayoutDashboard },
    { index: AI_ASSISTANT_SLOT_INDEX, label: t('spotlight.nav_chatbot'), Icon: CloudOff },
    { index: TECHNICIAN_LAB_SLOT_INDEX, label: t('spotlight.nav_technician_lab'), Icon: Smartphone },
  ], [t]);

  const workspace = useCompanyWorkspaceOptional();
  const isDispatchMap = isCompanyDispatchViewer(workspace);
  const { interventions: boInterventions } = useBackOfficeInterventions(
    isDispatchMap ? workspace?.activeCompanyId ?? null : null,
  );
  const { interventions: techInterventions } = useTechnicianAssignments({ enabled: !isDispatchMap });
  const firestoreInterventions = isDispatchMap ? boInterventions : techInterventions;

  const quickActions = useMemo(() => [
    {
      id: 'new-intervention',
      label: 'Nouvelle intervention',
      searchTerms: 'nouvelle intervention créer demande client',
      Icon: FileText,
      badge: 'Créer',
      onSelect: () => pager?.setPageIndex(1),
    },
    {
      id: 'call-client',
      label: 'Appeler le client',
      searchTerms: 'appeler téléphone client contact',
      Icon: Phone,
      badge: 'Appel',
      onSelect: () => { /* handled by intervention context */ },
    },
    {
      id: 'navigate-waze',
      label: 'Naviguer vers le client',
      searchTerms: 'navigation waze google maps itinéraire route',
      Icon: Navigation,
      badge: 'GPS',
      onSelect: () => { /* handled by intervention context */ },
    },
    {
      id: 'open-technician',
      label: 'Espace technicien',
      searchTerms: 'technicien terrain missions planning',
      Icon: Wrench,
      badge: 'Tech',
      onSelect: () => pager?.setPageIndex(2),
    },
    {
      id: 'export-csv',
      label: 'Exporter les interventions (CSV)',
      searchTerms: 'export csv excel rapport interventions télécharger',
      Icon: Download,
      badge: 'Export',
      onSelect: () => {
        import('@/features/backoffice/exportInterventionsCSV').then(m => {
          m.exportInterventionsCSV([]);
        });
      },
    },
    {
      id: 'performance',
      label: 'Performance techniciens',
      searchTerms: 'performance statistiques technicien métriques taux complétion',
      Icon: BarChart3,
      badge: 'Stats',
      onSelect: () => pager?.setPageIndex(2),
    },
  ], [pager]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <button
        id="spotlight-search"
        data-testid="spotlight-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('spotlight.open_aria')}
        className={`${dashboardHeaderPanelShellClass} items-center justify-between bg-white/95 px-6 font-semibold text-gray-900/60 hover:bg-white hover:text-gray-900 group`}
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <span className="flex items-center gap-2 text-sm text-gray-400">
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-[20vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className={`relative flex max-h-[min(90vh,720px)] min-h-0 w-full max-w-xl flex-col ${DASHBOARD_PANEL_CHROME_ROUNDED} ${DASHBOARD_PANEL_CHROME_BORDER} bg-white/75 ${DASHBOARD_PANEL_SHADOW_CLASS} ${DASHBOARD_PANEL_CHROME_BLUR}`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <Command className={`flex min-h-0 w-full flex-1 flex-col ${DASHBOARD_PANEL_INNER_CLIP_CLASS}`}>
                
                {/* Header: Search Input & Close */}
                <div className="flex items-center px-8 border-b border-black/5 bg-white/50 backdrop-blur-md z-10">

                  <Command.Input 
                    autoFocus 
                    placeholder={t('spotlight.search_placeholder')}
                    className="flex h-[70px] w-full bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none text-[20px] font-medium"
                  />
                  <X 
                    className="w-5 h-5 opacity-30 cursor-pointer hover:opacity-60 transition-opacity shrink-0" 
                    onClick={() => setOpen(false)}
                  />
                </div>

                {/* Sub-header: Premium Language Selector */}
                <div className="flex items-center justify-between px-6 py-2 border-b border-black/5 bg-slate-50/40 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-sm text-gray-400 font-medium px-2">
                    <Globe className="w-4 h-4 opacity-70" />
                    <span className="hidden sm:inline">Langue / Language / Taal</span>
                  </div>
                  
                  {/* Apple Segmented Control Style */}
                  <div className="relative flex items-center p-1 bg-black/[0.04] rounded-full shadow-inner">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`relative z-10 px-5 py-1.5 text-sm font-bold transition-colors duration-200 rounded-full ${
                          language === lang.code ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {language === lang.code && (
                          <motion.div
                            layoutId="active-language"
                            className="absolute inset-0 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 tracking-wide">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <Command.List className={`${GLASS_PANEL_OVERFLOW_PADDING} max-h-[300px]`}>
                  <Command.Empty className="px-6 py-8 text-center text-gray-500/60 font-medium">
                    {t('spotlight.no_results')}
                  </Command.Empty>

                  {/* Navigation */}
                  <Command.Group heading={t('spotlight.nav_group_heading')} className="px-2 py-2">
                    {navPages.map((page) => {
                      const isActive = pager?.pageIndex === page.index;
                      return (
                        <Command.Item
                          key={page.index}
                          data-testid={`nav-item-${page.index}`}
                          value={page.label}
                          onSelect={() => {
                            pager?.setPageIndex(page.index);
                            setOpen(false);
                          }}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors hover:bg-black/5 aria-selected:bg-black/5 ${isActive ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                        >
                          <page.Icon className="w-4 h-4 shrink-0 opacity-60" />
                          <span className="flex-1">{page.label}</span>
                          {isActive && <span className="text-xs text-blue-500 font-medium">{t('spotlight.active_label')}</span>}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>

                  {/* Quick Actions */}
                  <Command.Group heading="Actions rapides" className="px-2 py-2">
                    {quickActions.map((action) => (
                      <Command.Item
                        key={action.id}
                        data-testid={`quick-action-${action.id}`}
                        value={action.searchTerms}
                        onSelect={() => {
                          action.onSelect();
                          setOpen(false);
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-black/5 aria-selected:bg-black/5"
                      >
                        <action.Icon className="w-4 h-4 shrink-0 opacity-60" />
                        <span className="flex-1">{action.label}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{action.badge}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>

                  {/* Interventions Actives */}
                  {firestoreInterventions.length > 0 && (
                    <Command.Group heading="Interventions" className="px-2 py-2">
                      {firestoreInterventions.slice(0, 15).map((iv) => {
                        const name = interventionClientLabel(iv) || 'Client inconnu';
                        const address = iv.address || '';
                        const phone = iv.clientPhone || iv.phone || '';
                        const searchTerms = `${name} ${address} ${phone} ${iv.id} ${iv.title || ''}`.toLowerCase();
                        return (
                          <Command.Item
                            key={iv.id}
                            data-testid={`search-intervention-${iv.id}`}
                            value={searchTerms}
                            onSelect={() => {
                              setOpen(false);
                              if (phone) {
                                window.location.href = `tel:${phone}`;
                              }
                            }}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-black/5 aria-selected:bg-black/5"
                          >
                            <FileText className="w-4 h-4 shrink-0 opacity-60" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-800 truncate">{name}</div>
                              {address && <div className="text-xs text-slate-500 truncate">{address}</div>}
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              {phone && (
                                <button 
                                  className="rounded-full bg-green-100 p-1.5 text-green-700 hover:bg-green-200 transition"
                                  onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${phone}`; }}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {address && (
                                <button 
                                  className="rounded-full bg-blue-100 p-1.5 text-blue-700 hover:bg-blue-200 transition"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank'); 
                                  }}
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  )}

                  {/* Supplier Links */}
                  <Command.Group heading="Fournisseurs" className="px-2 py-2">
                    <Command.Item
                      value="lecot fournisseur matériel pièces recherche"
                      onSelect={() => {
                        window.open('https://lecot.be/fr-be', '_blank', 'noopener');
                        setOpen(false);
                      }}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-black/5 aria-selected:bg-black/5"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
                      <span className="flex-1">Ouvrir Lecot.be</span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">Lecot</span>
                    </Command.Item>
                  </Command.Group>
                </Command.List>
              </Command>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
