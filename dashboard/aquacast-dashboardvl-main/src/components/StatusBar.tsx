import { Bluetooth, Battery, Navigation, Clock, Plane, Monitor } from "lucide-react";

interface StatusBarProps {
  device?: { connected: boolean; name?: string };
  battery?: number | null;
  gps?: { fix: boolean; sats?: number } | null;
  lastSync?: string | null;
  drone?: { connected: boolean } | null;
  mode?: "Manual" | "Drone";
}

export function StatusBar({
  device = { connected: false },
  battery = null,
  gps = null,
  lastSync = null,
  drone = null,
  mode = "Manual",
}: StatusBarProps) {
  return (
    <div className="bg-card border-b border-border px-6 py-2">
      <div className="flex items-center gap-6 max-w-[1440px] mx-auto text-sm">
        <StatusItem
          icon={Bluetooth}
          label="Device"
          value={device.connected ? (device.name || "Connected") : "Not connected"}
          status={device.connected ? "success" : "muted"}
        />
        <Divider />
        <StatusItem
          icon={Battery}
          label="Battery"
          value={battery != null ? `${battery}%` : "—"}
          status={battery != null ? (battery > 20 ? "success" : "warning") : "muted"}
        />
        <Divider />
        <StatusItem
          icon={Navigation}
          label="GPS"
          value={gps?.fix ? `Fix (${gps.sats} sats)` : gps ? "No Fix" : "—"}
          status={gps?.fix ? "success" : "muted"}
        />
        <Divider />
        <StatusItem
          icon={Clock}
          label="Last Sync"
          value={lastSync || "—"}
          status={lastSync ? "success" : "muted"}
        />
        <Divider />
        <StatusItem
          icon={Plane}
          label="Drone"
          value={drone?.connected ? "Connected" : drone ? "Not detected" : "—"}
          status={drone?.connected ? "success" : "muted"}
        />
        <Divider />
        <StatusItem
          icon={Monitor}
          label="Mode"
          value={mode}
          status="muted"
        />
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-border" />;
}

function StatusItem({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  status: "success" | "warning" | "muted";
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
      {status !== "muted" && (
        <span className={`status-dot status-dot-${status}`} />
      )}
    </div>
  );
}
