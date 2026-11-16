"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/disiplin/store";
import { parentApi } from "@/lib/disiplin/api";
import type { AppConfig } from "@/lib/disiplin/store";
import { AppHeader } from "@/components/disiplin/AppHeader";
import { AppFooter } from "@/components/disiplin/AppFooter";

// Public views
import { PublicHome } from "@/components/disiplin/public/PublicHome";
import { SearchResults } from "@/components/disiplin/public/SearchResults";
import { VerifyStudent } from "@/components/disiplin/public/VerifyStudent";
import { StudentReport } from "@/components/disiplin/public/StudentReport";

// Staff views
import { StaffLogin } from "@/components/disiplin/staff/StaffLogin";
import { StaffShell } from "@/components/disiplin/staff/StaffShell";
import { Dashboard } from "@/components/disiplin/staff/Dashboard";
import { StudentsManager } from "@/components/disiplin/staff/StudentsManager";
import { AttendanceBulk } from "@/components/disiplin/staff/AttendanceBulk";
import { RecordMerit } from "@/components/disiplin/staff/RecordMerit";
import { Approvals } from "@/components/disiplin/staff/Approvals";
import { CategoriesManager } from "@/components/disiplin/staff/CategoriesManager";
import { Settings } from "@/components/disiplin/staff/Settings";
import { AuditLog } from "@/components/disiplin/staff/AuditLog";

export default function Home() {
  const mode = useStore((s) => s.mode);
  const publicView = useStore((s) => s.publicView);
  const staffView = useStore((s) => s.staffView);
  const staffToken = useStore((s) => s.staffToken);
  const staffUser = useStore((s) => s.staffUser);
  const setConfig = useStore((s) => s.setConfig);
  const setStaffView = useStore((s) => s.setStaffView);

  // Hydrate persisted store on client mount.
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  // Load global config once.
  useEffect(() => {
    parentApi
      .get<AppConfig>("/api/config")
      .then((c) => setConfig(c))
      .catch(() => {
        // ignore — UI will fall back to defaults
      });
  }, [setConfig]);

  // If staff has token but view state got out of sync, route into dashboard.
  useEffect(() => {
    if (mode === "staff" && staffToken && staffUser && staffView === "login") {
      setStaffView("dashboard");
    }
    if (mode === "staff" && (!staffToken || !staffUser) && staffView !== "login") {
      setStaffView("login");
    }
  }, [mode, staffToken, staffUser, staffView, setStaffView]);

  function renderPublic() {
    switch (publicView) {
      case "home":
        return <PublicHome />;
      case "results":
        return <SearchResults />;
      case "verify":
        return <VerifyStudent />;
      case "report":
        return <StudentReport />;
      default:
        return <PublicHome />;
    }
  }

  function renderStaff() {
    if (!staffToken || !staffUser) return <StaffLogin />;
    let inner: React.ReactNode = null;
    switch (staffView) {
      case "dashboard":
        inner = <Dashboard />;
        break;
      case "students":
        inner = <StudentsManager />;
        break;
      case "kedatangan":
        inner = <AttendanceBulk />;
        break;
      case "rekod":
        inner = <RecordMerit />;
        break;
      case "kelulusan":
        inner = <Approvals />;
        break;
      case "kategori":
        inner = <CategoriesManager />;
        break;
      case "tetapan":
        inner = <Settings />;
        break;
      case "audit":
        inner = <AuditLog />;
        break;
      default:
        inner = <Dashboard />;
    }
    return <StaffShell>{inner}</StaffShell>;
  }

  return (
    <>
      <AppHeader />
      <div className="flex-1">
        {mode === "staff" ? renderStaff() : renderPublic()}
      </div>
      <AppFooter />
    </>
  );
}
