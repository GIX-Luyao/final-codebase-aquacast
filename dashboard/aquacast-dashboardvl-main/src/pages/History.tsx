import { useState, useRef, useCallback } from "react";
import { Download, Upload, Eye, MapPin, Droplets, Ruler, Thermometer, Waves, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Mission {
  id: string;
  name: string;
  date: string;
  samples: number;
  status: "complete" | "partial";
  location: string;
  coords: string;
  avgTemp: string;
  avgTurbidity: string;
  depths: number;
  data: SampleRow[];
}

interface SampleRow {
  num: number;
  depth: string;
  temp: string;
  turbidity: string;
  time: string;
}

const mockMissions: Mission[] = [
  {
    id: "1",
    name: "Lake Zurich — Dock A",
    date: "2025-06-12",
    samples: 9,
    status: "complete",
    location: "GreenLake — Dock A",
    coords: "47.3667, 8.5500",
    avgTemp: "15.3°C",
    avgTurbidity: "8.3 NTU",
    depths: 3,
    data: [
      { num: 1, depth: "1.0m", temp: "18.2°C", turbidity: "12.4 NTU", time: "10:02:14" },
      { num: 2, depth: "1.0m", temp: "18.1°C", turbidity: "12.8 NTU", time: "10:02:44" },
      { num: 3, depth: "1.0m", temp: "18.3°C", turbidity: "12.2 NTU", time: "10:03:14" },
      { num: 4, depth: "3.0m", temp: "15.7°C", turbidity: "8.1 NTU", time: "10:04:30" },
      { num: 5, depth: "3.0m", temp: "15.6°C", turbidity: "8.3 NTU", time: "10:05:00" },
      { num: 6, depth: "3.0m", temp: "15.8°C", turbidity: "7.9 NTU", time: "10:05:30" },
      { num: 7, depth: "5.0m", temp: "12.1°C", turbidity: "4.2 NTU", time: "10:06:45" },
      { num: 8, depth: "5.0m", temp: "12.0°C", turbidity: "4.5 NTU", time: "10:07:15" },
      { num: 9, depth: "5.0m", temp: "12.2°C", turbidity: "4.1 NTU", time: "10:07:45" },
    ],
  },
  {
    id: "2",
    name: "Rhine Intake #3",
    date: "2025-06-10",
    samples: 6,
    status: "complete",
    location: "Rhine River — Intake #3",
    coords: "47.5596, 7.5886",
    avgTemp: "14.1°C",
    avgTurbidity: "6.7 NTU",
    depths: 2,
    data: [],
  },
  {
    id: "3",
    name: "Reservoir B Deep",
    date: "2025-06-08",
    samples: 4,
    status: "partial",
    location: "Reservoir B",
    coords: "47.4100, 8.5400",
    avgTemp: "11.8°C",
    avgTurbidity: "3.2 NTU",
    depths: 2,
    data: [],
  },
  {
    id: "4",
    name: "Rhine Intake #2",
    date: "2025-06-10",
    samples: 6,
    status: "complete",
    location: "Rhine River — Intake #2",
    coords: "47.5500, 7.5900",
    avgTemp: "14.5°C",
    avgTurbidity: "7.1 NTU",
    depths: 2,
    data: [],
  },
];

export default function History() {
  const [selected, setSelected] = useState(mockMissions[0]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a .csv file.", variant: "destructive" });
      return;
    }
    toast({ title: "CSV imported", description: `${file.name} uploaded successfully.` });
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Mission list */}
      <div className="col-span-4 card-aqua p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Past missions</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Import
          </Button>
        </div>
        <div className="space-y-2">
          {mockMissions.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                selected.id === m.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="font-medium text-sm text-foreground">{m.name}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>📅 {m.date}</span>
                <span>{m.samples} samples</span>
                <span
                  className={
                    m.status === "complete" ? "chip-success" : "chip-warning"
                  }
                >
                  {m.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Mission detail */}
      <div className="col-span-8 card-aqua p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{selected.location}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {selected.coords} · {selected.date}
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard icon={Droplets} label="Samples" value={String(selected.samples)} />
          <StatCard icon={Ruler} label="Depths" value={String(selected.depths)} />
          <StatCard icon={Thermometer} label="Avg temp" value={selected.avgTemp} />
          <StatCard icon={Waves} label="Avg turbidity" value={selected.avgTurbidity} />
        </div>

        {/* Data table */}
        {selected.data.length > 0 ? (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Depth</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Temp</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Turbidity</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {selected.data.map((row) => (
                  <tr key={row.num} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground">{row.num}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{row.depth}</td>
                    <td className="px-4 py-3 text-foreground">{row.temp}</td>
                    <td className="px-4 py-3 text-foreground">{row.turbidity}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.time}</td>
                    <td className="px-4 py-3">
                      <Eye className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl py-12 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <FileUp className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop a <span className="font-medium text-foreground">.csv</span> file here, or{" "}
              <span className="text-primary font-medium">click to browse</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
