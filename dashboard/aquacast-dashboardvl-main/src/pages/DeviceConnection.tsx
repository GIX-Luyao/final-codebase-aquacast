import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bluetooth,
  Usb,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Wifi,
  Plane,
  Hand,
  Thermometer,
  Droplets,
  Waves,
  HardDrive,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockDevices = [
  { name: "AquaCast-023", id: "AC:23:F1:9B", signal: 3 },
  { name: "AquaCast-041", id: "AC:41:A2:7D", signal: 2 },
];

export default function DeviceConnection() {
  const navigate = useNavigate();
  const [connType, setConnType] = useState<"bluetooth" | "manual">("bluetooth");
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState(mockDevices);
  const [paired, setPaired] = useState<string | null>(null);
  const [deployMode, setDeployMode] = useState<"manual" | "drone">("manual");

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 1500);
  };

  const handlePair = (id: string) => {
    setPaired(id);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Card A: Connect */}
      <div className="card-aqua p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Connect your sampler</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Pair with your AquaCast device to configure missions.
        </p>

        {/* Segmented control */}
        <div className="flex bg-muted rounded-lg p-1 mb-5">
          <button
            onClick={() => setConnType("bluetooth")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              connType === "bluetooth" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <Bluetooth className="w-4 h-4" /> Bluetooth
          </button>
          <button
            onClick={() => setConnType("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              connType === "manual" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <Usb className="w-4 h-4" /> Manual
          </button>
        </div>

        {connType === "bluetooth" ? (
          <>
            <Button onClick={handleScan} className="w-full mb-4" disabled={scanning}>
              <Search className="w-4 h-4 mr-2" />
              {scanning ? "Scanning…" : "Scan for devices"}
            </Button>

            <div className="space-y-2">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    paired === d.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wifi className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Signal bars */}
                    <div className="flex gap-0.5 items-end">
                      {[1, 2, 3].map((bar) => (
                        <div
                          key={bar}
                          className={`w-1 rounded-sm ${
                            bar <= d.signal ? "bg-success" : "bg-border"
                          }`}
                          style={{ height: `${bar * 5 + 4}px` }}
                        />
                      ))}
                    </div>
                    {paired === d.id ? (
                      <span className="chip-success"><CheckCircle className="w-3 h-3" /> Paired</span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handlePair(d.id)}>
                        Pair
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Device health when paired */}
            {paired && (
              <div className="mt-5 p-4 rounded-xl bg-muted/50 space-y-3">
                <p className="text-sm font-medium text-foreground">Device Health</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <SensorItem icon={Droplets} label="Depth" ok />
                  <SensorItem icon={Thermometer} label="Temp" ok />
                  <SensorItem icon={Waves} label="Turbidity" ok />
                  <SensorItem icon={HardDrive} label="SD Card" ok />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Connection type</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground">
                <option>USB</option>
                <option>LoRa Gateway</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Port</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground" placeholder="/dev/ttyUSB0" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Baud rate</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground" placeholder="115200" />
              </div>
            </div>
            <Button className="w-full">Connect</Button>
          </div>
        )}
      </div>

      {/* Card B: Deployment mode */}
      <div className="card-aqua p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Deployment mode</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Choose how you'll deploy the sampler.
        </p>

        <div className="space-y-3 mb-6">
          <DeployTile
            icon={Plane}
            title="Drone deployment"
            desc="Coordinate with a drone for deployment and retrieval."
            selected={deployMode === "drone"}
            onClick={() => setDeployMode("drone")}
            warning="Drone not detected"
          />
          <DeployTile
            icon={Hand}
            title="Manual deployment"
            desc="Use sampler as a standalone device."
            selected={deployMode === "manual"}
            onClick={() => setDeployMode("manual")}
          />
        </div>

        {deployMode === "manual" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/5 border border-warning/20 text-sm">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-muted-foreground">No drone detected — Manual mode selected.</span>
          </div>
        )}

        <div className="mt-auto pt-6 flex justify-end">
          <Button
            size="lg"
            disabled={!paired}
            onClick={() => navigate("/create-mission")}
          >
            Continue to Create Mission <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SensorItem({ icon: Icon, label, ok }: { icon: React.ElementType; label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-foreground">{label}</span>
      {ok ? (
        <CheckCircle className="w-3.5 h-3.5 text-success ml-auto" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 text-destructive ml-auto" />
      )}
    </div>
  );
}

function DeployTile({
  icon: Icon,
  title,
  desc,
  selected,
  onClick,
  warning,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
  warning?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          {warning && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle className="w-3 h-3 text-warning" />
              <span className="text-xs text-warning">{warning}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
