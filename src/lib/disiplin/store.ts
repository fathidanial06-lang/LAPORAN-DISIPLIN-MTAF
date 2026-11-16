// Zustand store for the "Laporan Disiplin Murid" single-page app.
// Persists tokens (parent + staff) in localStorage; SSR-safe via skipHydration.

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AmbangDisiplin,
  AmbangKehadiran,
} from "@/lib/disiplin/domain";

// ---------- Config type ----------
export interface AppConfig {
  ambangKehadiran: AmbangKehadiran;
  ambangDisiplin: AmbangDisiplin;
  pengesahanIbuBapa: boolean;
  hariCuti: string[]; // YYYY-MM-DD
  penggalAktif: string;
}

// ---------- Public types ----------
export type PublicView = "home" | "results" | "verify" | "report";
export type PeriodFilter = "bulan_ini" | "penggal_ini" | "tahun_ini" | "custom";
export type ReportTab = "ringkasan" | "kedatangan" | "sahsiah" | "merit";

export interface SearchStudentResult {
  id: string;
  nama: string;
  kelas: string;
  ic?: string; // full IC only when IC-exact match (12-digit input)
  icMasked: string;
}

// ---------- Staff types ----------
export type StaffView =
  | "login"
  | "dashboard"
  | "students"
  | "kedatangan"
  | "rekod"
  | "kelulusan"
  | "kategori"
  | "tetapan"
  | "audit";

export interface StaffUser {
  id: string;
  nama: string;
  username: string;
  peranan: "GURU" | "HEM" | "PENTADBIR";
}

// ---------- Store state ----------
interface StoreState {
  // mode
  mode: "public" | "staff";

  // public flow
  publicView: PublicView;
  searchQuery: string;
  searchResults: SearchStudentResult[];
  selectedStudentId: string | null;
  parentToken: string | null;
  reportData: any | null;
  periodFilter: PeriodFilter;
  customFrom: string;
  customTo: string;
  activeTab: ReportTab;

  // staff flow
  staffView: StaffView;
  staffToken: string | null;
  staffUser: StaffUser | null;

  // config + ui
  config: AppConfig | null;
  loading: boolean;
  error: string | null;

  // actions
  setMode: (m: "public" | "staff") => void;
  setPublicView: (v: PublicView) => void;
  setSearchQuery: (q: string) => void;
  setSearchResults: (r: SearchStudentResult[]) => void;
  setSelectedStudentId: (id: string | null) => void;
  setParentToken: (t: string | null) => void;
  setReportData: (d: any | null) => void;
  setPeriodFilter: (p: PeriodFilter) => void;
  setCustomFrom: (d: string) => void;
  setCustomTo: (d: string) => void;
  setActiveTab: (t: ReportTab) => void;

  setStaffView: (v: StaffView) => void;
  setStaffToken: (t: string | null) => void;
  setStaffUser: (u: StaffUser | null) => void;

  setConfig: (c: AppConfig | null) => void;
  setLoading: (l: boolean) => void;
  setError: (e: string | null) => void;

  // navigation helpers
  goPublicHome: () => void;
  goStaffLogin: () => void;
  logoutParent: () => void;
  logoutStaff: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      mode: "public",

      publicView: "home",
      searchQuery: "",
      searchResults: [],
      selectedStudentId: null,
      parentToken: null,
      reportData: null,
      periodFilter: "bulan_ini",
      customFrom: "",
      customTo: "",
      activeTab: "ringkasan",

      staffView: "login",
      staffToken: null,
      staffUser: null,

      config: null,
      loading: false,
      error: null,

      setMode: (m) => set({ mode: m }),
      setPublicView: (v) => set({ publicView: v }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSearchResults: (r) => set({ searchResults: r }),
      setSelectedStudentId: (id) => set({ selectedStudentId: id }),
      setParentToken: (t) => set({ parentToken: t }),
      setReportData: (d) => set({ reportData: d }),
      setPeriodFilter: (p) => set({ periodFilter: p }),
      setCustomFrom: (d) => set({ customFrom: d }),
      setCustomTo: (d) => set({ customTo: d }),
      setActiveTab: (t) => set({ activeTab: t }),

      setStaffView: (v) => set({ staffView: v }),
      setStaffToken: (t) => set({ staffToken: t }),
      setStaffUser: (u) => set({ staffUser: u }),

      setConfig: (c) => set({ config: c }),
      setLoading: (l) => set({ loading: l }),
      setError: (e) => set({ error: e }),

      goPublicHome: () =>
        set({
          mode: "public",
          publicView: "home",
          searchQuery: "",
          searchResults: [],
          selectedStudentId: null,
          reportData: null,
          activeTab: "ringkasan",
          periodFilter: "bulan_ini",
        }),
      goStaffLogin: () =>
        set({ mode: "staff", staffView: "login" }),

      logoutParent: () =>
        set({
          parentToken: null,
          reportData: null,
          publicView: "home",
          selectedStudentId: null,
        }),
      logoutStaff: () =>
        set({ staffToken: null, staffUser: null, staffView: "login" }),
    }),
    {
      name: "disiplin-store",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          // SSR-safe: return a no-op storage that pretends to persist.
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          } as any;
        }
        return window.localStorage;
      }),
      partialize: (s) => ({
        parentToken: s.parentToken,
        staffToken: s.staffToken,
        staffUser: s.staffUser,
        staffView: s.staffView,
        mode: s.mode,
      }),
      skipHydration: true,
    }
  )
);
