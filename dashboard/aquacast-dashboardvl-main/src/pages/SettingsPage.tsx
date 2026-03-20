import { Button } from "@/components/ui/button";
import { User, Wifi, Bell, HardDrive, Info } from "lucide-react";

const sections = [
  {
    icon: User,
    title: "Profile",
    desc: "Manage your account and preferences.",
    fields: [
      { label: "Name", value: "Alex Chen" },
      { label: "Email", value: "alex@aquacast.io" },
    ],
  },
  {
    icon: Wifi,
    title: "Device Defaults",
    desc: "Set default connection and sampling preferences.",
    fields: [
      { label: "Default connection", value: "Bluetooth" },
      { label: "Default sample size", value: "5" },
      { label: "Default volume", value: "100ml" },
    ],
  },
  {
    icon: HardDrive,
    title: "Data & Storage",
    desc: "Manage imported data and export settings.",
    fields: [
      { label: "CSV delimiter", value: "Comma" },
      { label: "Temperature unit", value: "Celsius" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Settings</h2>
      {sections.map((section) => (
        <div key={section.title} className="card-aqua p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <section.icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{section.title}</h3>
              <p className="text-xs text-muted-foreground">{section.desc}</p>
            </div>
          </div>
          <div className="space-y-3">
            {section.fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{f.label}</span>
                <span className="text-sm font-medium text-foreground">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="card-aqua p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">AquaCast v1.2.0</p>
            <p className="text-xs text-muted-foreground">Firmware: 3.1.4 · Last updated: 2025-05-20</p>
          </div>
        </div>
        <Button variant="outline" size="sm">Check for updates</Button>
      </div>
    </div>
  );
}
