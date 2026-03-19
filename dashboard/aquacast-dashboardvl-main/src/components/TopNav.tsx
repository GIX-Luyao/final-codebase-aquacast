import { NavLink, useLocation } from "react-router-dom";
import { Wifi, Compass, Clock, Plane, Settings, Droplets, User, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Device", path: "/device", icon: Wifi },
  { label: "Create Mission", path: "/create-mission", icon: Compass },
  { label: "Mission Status", path: "/mission-status", icon: Clock },
  { label: "History", path: "/history", icon: Droplets },
];

export function TopNav() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <header className="bg-card border-b border-border px-6">
      <div className="flex items-center justify-between h-14 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2 font-semibold text-lg text-foreground">
            <Droplets className="w-5 h-5 text-primary" />
            AquaCast
          </NavLink>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <NavLink
            to="/settings"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="w-5 h-5" />
          </NavLink>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
