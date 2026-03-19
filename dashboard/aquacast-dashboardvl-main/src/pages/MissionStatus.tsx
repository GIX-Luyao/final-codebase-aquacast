import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, HardDrive, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const timeline = [
  { time: "10:00", event: "Mission synced to device", status: "done" },
  { time: "10:01", event: "Device disconnected — ready for deployment", status: "done" },
  { time: "—", event: "Deployment in progress (offline)", status: "current" },
  { time: "—", event: "Retrieval", status: "pending" },
  { time: "—", event: "Import SD card CSV", status: "pending" },
];

export default function MissionStatus() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done">("idle");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      setUploadState("uploading");
      setTimeout(() => {
        setUploadState("done");
        setTimeout(() => navigate("/history"), 1200);
      }, 1500);
    }
  }, [navigate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-aqua p-8">
        <h2 className="text-xl font-semibold text-foreground mb-1">Mission Status</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Your mission is running offline on the device. Retrieve and import data when complete.
        </p>

        {/* Timeline */}
        <div className="space-y-0 mb-8">
          {timeline.map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.status === "done"
                      ? "bg-success/10"
                      : item.status === "current"
                        ? "bg-primary/10"
                        : "bg-muted"
                  }`}
                >
                  {item.status === "done" ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : item.status === "current" ? (
                    <Clock className="w-4 h-4 text-primary" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                {i < timeline.length - 1 && (
                  <div className="w-px h-8 bg-border" />
                )}
              </div>
              <div className="pb-6">
                <p className={`text-sm font-medium ${item.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>
                  {item.event}
                </p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Import CTA with drag-and-drop */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`rounded-xl border-2 border-dashed p-6 transition-colors ${
            uploadState === "done"
              ? "border-success bg-success/5"
              : isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/50"
          }`}
        >
          {uploadState === "done" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <CheckCircle className="w-8 h-8 text-success" />
              <p className="font-medium text-sm text-foreground">Upload complete!</p>
              <p className="text-xs text-muted-foreground">Redirecting to History…</p>
            </div>
          ) : uploadState === "uploading" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="font-medium text-sm text-foreground">Importing CSV…</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Ready to import?</p>
                  <p className="text-xs text-muted-foreground">
                    Drag & drop a CSV file here, or click to import.
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".csv"
                id="csv-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.name.endsWith(".csv")) {
                    setUploadState("uploading");
                    setTimeout(() => {
                      setUploadState("done");
                      setTimeout(() => navigate("/history"), 1200);
                    }, 1500);
                  }
                }}
              />
              <Button onClick={() => document.getElementById("csv-upload")?.click()}>
                <Upload className="w-4 h-4 mr-1.5" />
                Import CSV
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
