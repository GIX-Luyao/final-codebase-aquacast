import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { StatusBar } from "./StatusBar";
import { Info } from "lucide-react";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <StatusBar
        device={{ connected: true, name: "AquaCast-023" }}
        battery={82}
        gps={{ fix: true, sats: 12 }}
        lastSync="3s ago"
        drone={null}
        mode="Manual"
      />
      {/* Offline banner */}
      <div className="bg-primary/5 border-b border-primary/10 px-6 py-2">
        <div className="max-w-[1440px] mx-auto flex items-center gap-2 text-sm text-primary">
          <Info className="w-4 h-4" />
          No live monitoring. Missions run offline. Import SD card CSV after retrieval to view results.
        </div>
      </div>
      <main className="max-w-[1440px] mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
