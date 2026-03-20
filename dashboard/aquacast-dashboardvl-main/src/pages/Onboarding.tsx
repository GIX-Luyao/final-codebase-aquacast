import { useNavigate } from "react-router-dom";
import { Bluetooth, MapPin, Upload, Play, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Bluetooth,
    title: "Connect your sampler",
    desc: "Pair via Bluetooth or USB to configure missions.",
  },
  {
    icon: MapPin,
    title: "Create a mission",
    desc: "Set your site, depths, and number of samples.",
  },
  {
    icon: Upload,
    title: "Deploy → Retrieve → Import CSV",
    desc: "After retrieval, import SD card data to view results.",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Droplets className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AquaCast</h1>
        </div>

        {/* Main card */}
        <div className="card-aqua p-10 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-3">Welcome to AquaCast</h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">
            Configure sampling missions, sync to the device, then import SD card data to view results.
          </p>

          {/* Steps */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                </div>
                <p className="text-muted-foreground text-xs">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Watch demo card */}
          <div className="bg-muted rounded-xl p-4 flex items-center justify-center gap-3 mb-8 cursor-pointer hover:bg-muted/80 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Play className="w-4 h-4 text-primary ml-0.5" />
            </div>
            <span className="text-sm font-medium text-foreground">Watch how it works (20s)</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/device")}
            >
              Skip
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/device")}
            >
              Get started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
