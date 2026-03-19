import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Plus,
  X,
  CheckCircle,
  Thermometer,
  Waves,
  Droplets,
  Ruler,
  Play,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import sampler1 from "@/assets/1sampler.png";
import sampler2 from "@/assets/2sampler.png";
import sampler3 from "@/assets/3sampler.png";
import sampler4 from "@/assets/4sampler.png";
import sampler5 from "@/assets/5sampler.png";
import vol400 from "@/assets/400ml_sampler.png";
import vol600 from "@/assets/600ml_sampler.png";
import vol800 from "@/assets/800ml_sampler.png";

const samplerImages: Record<number, string> = {
  1: sampler1,
  2: sampler2,
  3: sampler3,
  4: sampler4,
  5: sampler5,
};

const volumeImages: Record<string, string> = {
  "400ml": vol400,
  "600ml": vol600,
  "800ml": vol800,
};

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const steps = ["Site", "Sampler", "Depth Plan", "Review & Launch"];

function LocationMarker({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition: (p: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position} />;
}

export default function CreateMission() {
  const navigate = useNavigate();
  const [currentStep] = useState(0);
  const [position, setPosition] = useState<[number, number]>([47.6805, -122.2613]);
  const [sampleSize, setSampleSize] = useState(5);
  const [volume, setVolume] = useState("400ml");
  const [depths, setDepths] = useState(["1m", "2m", "3m"]);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const leftRef = useRef<HTMLDivElement>(null);
  const [leftHeight, setLeftHeight] = useState<number | undefined>();

  useEffect(() => {
    if (!leftRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setLeftHeight(entry.contentRect.height + (leftRef.current ? leftRef.current.offsetHeight - leftRef.current.clientHeight : 0));
    });
    observer.observe(leftRef.current);
    setLeftHeight(leftRef.current.offsetHeight);
    return () => observer.disconnect();
  }, []);

  const [activeMeasurements, setActiveMeasurements] = useState<Record<string, boolean>>({
    Temperature: true,
    Turbidity: true,
  });

  const toggleMeasurement = (label: string) => {
    setActiveMeasurements((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div>
      {/* Stepper + Pre-flight */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i <= currentStep
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i <= currentStep ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </span>
              {i < steps.length - 1 && (
                <div className="w-12 h-px bg-border mx-1" />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="status-dot status-dot-muted" /> Troubleshoot
          </div>
          <Button variant="destructive" size="sm" onClick={() => setPreflightOpen(true)}>
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Run Pre-flight Check
          </Button>
        </div>
      </div>

      {/* Pre-flight Check Dialog */}
      <Dialog open={preflightOpen} onOpenChange={setPreflightOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="items-center text-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt="Sampler"
              className="w-24 h-24 mx-auto mb-2 object-contain"
            />
            <DialogTitle className="text-primary">Trip 1</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">SEO Description</p>
              <div className="flex gap-2">
                <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                  Lat {position[0].toFixed(4)}
                </div>
                <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                  Lon {position[1].toFixed(4)}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Sampling Depths</p>
              <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                {depths.join(", ")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Water Sampler</p>
              <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                {sampleSize}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">SEO Description</p>
              <div className="flex gap-2">
                {Object.entries(activeMeasurements).filter(([, v]) => v).map(([label]) => (
                  <div key={label} className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">Sample Size</p>
            <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm w-fit">
              {sampleSize}
            </div>
          </div>

          <Button className="w-full mt-6" size="lg" onClick={() => { setPreflightOpen(false); navigate("/mission-status"); }}>
            Submit
          </Button>
        </DialogContent>
      </Dialog>

      {/* Two column layout - 7/5 */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Map */}
        <div className="col-span-7 card-aqua p-6" ref={leftRef}>
          <h3 className="text-lg font-semibold text-foreground mb-1">Sampling Area</h3>
          <p className="text-sm text-muted-foreground mb-4">Click to drop a pin. Drag to reposition.</p>
          <div className="rounded-xl overflow-hidden border border-border relative z-0 aspect-[4/3]">
            <MapContainer
              center={position}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>
        </div>

        {/* Right: Config – fixed to left panel height, scrollable inside */}
        <div className="col-span-5" style={{ height: leftHeight || "auto" }}>
          <div className="h-full overflow-y-auto space-y-5 pr-1">
          {/* Location */}
          <div className="card-aqua p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Location</h3>
              <button className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Enter a location or GPS coordinates</p>
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 mb-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">7201 E Green Lake Dr N, Seattle, WA 98115</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border text-sm">
                <span className="text-muted-foreground text-xs">Lat</span>
                <p className="font-medium text-foreground">{position[0].toFixed(4)}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-lg border border-border text-sm">
                  <span className="text-muted-foreground text-xs">Lon</span>
                  <p className="font-medium text-foreground">{position[1].toFixed(4)}</p>
                </div>
                <button className="text-sm text-primary font-medium hover:underline">Clear</button>
              </div>
            </div>
          </div>

          {/* Water Sampler */}
          <div className="card-aqua p-5">
            <h3 className="font-semibold text-foreground mb-4">Water Sampler</h3>

            <div className="grid grid-cols-2 gap-5">
              {/* Sample Size column */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Sample Size</p>
                <div className="border border-border rounded-xl p-3 flex items-center justify-center mb-3" style={{ height: 140 }}>
                  <img
                    src={samplerImages[sampleSize]}
                    alt={`${sampleSize} sampler`}
                    className="max-h-full w-auto object-contain"
                  />
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSampleSize(n)}
                      className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${
                        sampleSize === n
                          ? "border-foreground bg-card text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sampling Volume column */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Sampling Volume</p>
                <div className="border border-border rounded-xl p-3 flex items-center justify-center mb-3" style={{ height: 140 }}>
                  <img
                    src={volumeImages[volume]}
                    alt={`${volume} volume`}
                    className="max-h-full w-auto object-contain"
                  />
                </div>
                <div className="flex gap-1.5">
                  {["400ml", "600ml", "800ml"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setVolume(v)}
                      className={`flex-1 h-9 rounded-lg border text-sm font-medium transition-colors ${
                        volume === v
                          ? "border-foreground bg-card text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sampling Depths */}
          <div className="card-aqua p-5">
            <h3 className="font-semibold text-foreground mb-2">Sampling Depths</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Set a target depth for each sample (0–8m). Samples will be collected from shallow to deep.
            </p>
            <div className="space-y-2">
              {depths.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <input
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground"
                    value={d}
                    onChange={(e) => {
                      const updated = [...depths];
                      updated[i] = e.target.value;
                      setDepths(updated);
                    }}
                  />
                  <button
                    onClick={() => setDepths(depths.filter((_, j) => j !== i))}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setDepths([...depths, `${depths.length + 1}m`])}
              className="mt-3 text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add depth
            </button>
          </div>

          {/* Optional Measurements */}
          <div className="card-aqua p-5">
            <h3 className="font-semibold text-foreground mb-3">Optional Measurements</h3>
          <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Thermometer, label: "Temperature" },
                { icon: Waves, label: "Turbidity" },
              ].map(({ icon: Icon, label }) => {
                const active = activeMeasurements[label];
                return (
                  <button
                    key={label}
                    onClick={() => toggleMeasurement(label)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
