import usePageTitle from "@/hooks/usePageTitle";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes, Building2, GraduationCap, Headset, Info, Keyboard, Maximize2,
  Mouse, RefreshCw, Sparkles, Users, Monitor as MonitorIcon,
} from "lucide-react";

const AFRAME_SRC = "https://aframe.io/releases/1.7.1/aframe.min.js";

type SceneKey = "office" | "meeting" | "training";

const SCENES: Record<SceneKey, {
  key: SceneKey; name: string; tagline: string; icon: any;
  accent: string; sky: string; ground: string;
}> = {
  office: {
    key: "office", name: "Modern Office", tagline: "Open-plan workspace with AI mentor avatar",
    icon: Building2, accent: "from-blue-500 to-cyan-500",
    sky: "#a8d0f0", ground: "#e8e2d6",
  },
  meeting: {
    key: "meeting", name: "Conference Room", tagline: "Virtual boardroom for hybrid all-hands",
    icon: Users, accent: "from-purple-500 to-pink-500",
    sky: "#d8c8f0", ground: "#3d2f4a",
  },
  training: {
    key: "training", name: "Training Lab", tagline: "Immersive onboarding stations",
    icon: GraduationCap, accent: "from-emerald-500 to-teal-500",
    sky: "#c8f0e0", ground: "#2a3a3a",
  },
};

function buildOfficeScene(announcement: string): string {
  return `
    <a-sky color="#a8d0f0"></a-sky>
    <a-plane position="0 0 0" rotation="-90 0 0" width="40" height="40" color="#e8e2d6" shadow></a-plane>

    <!-- Walls -->
    <a-box position="0 2.5 -10" width="20" height="5" depth="0.2" color="#f5f0e8" shadow></a-box>
    <a-box position="-10 2.5 0" width="0.2" height="5" depth="20" color="#f0ebe0" shadow></a-box>
    <a-box position="10 2.5 0" width="0.2" height="5" depth="20" color="#f0ebe0" shadow></a-box>

    <!-- CoreHR AI logo wall display -->
    <a-text value="CoreHR AI" position="0 4 -9.85" align="center" color="#6366f1" width="14" font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"></a-text>
    <a-text value="Welcome to your virtual office" position="0 3.2 -9.85" align="center" color="#475569" width="8"></a-text>

    <!-- Desk row 1 -->
    <a-entity position="-5 0 -3">
      <a-box position="0 0.75 0" width="2.4" height="0.1" depth="1.2" color="#8b6f4e" shadow></a-box>
      <a-box position="-1.1 0.35 -0.5" width="0.1" height="0.7" depth="0.1" color="#5a4a35"></a-box>
      <a-box position="1.1 0.35 -0.5" width="0.1" height="0.7" depth="0.1" color="#5a4a35"></a-box>
      <a-box position="-1.1 0.35 0.5" width="0.1" height="0.7" depth="0.1" color="#5a4a35"></a-box>
      <a-box position="1.1 0.35 0.5" width="0.1" height="0.7" depth="0.1" color="#5a4a35"></a-box>
      <!-- Monitor -->
      <a-box position="0 1.3 -0.3" width="1.2" height="0.7" depth="0.05" color="#1e293b"></a-box>
      <a-box position="0 1.3 -0.32" width="1.1" height="0.6" depth="0.01" color="#3b82f6"></a-box>
      <!-- Plant -->
      <a-cylinder position="0.9 1.0 0.3" radius="0.12" height="0.2" color="#8b6f4e"></a-cylinder>
      <a-sphere position="0.9 1.25 0.3" radius="0.2" color="#22c55e"></a-sphere>
      <!-- Chair -->
      <a-box position="0 0.45 0.9" width="0.6" height="0.05" depth="0.6" color="#1e293b"></a-box>
      <a-box position="0 0.85 1.18" width="0.6" height="0.85" depth="0.05" color="#1e293b"></a-box>
      <a-cylinder position="0 0.2 0.9" radius="0.05" height="0.4" color="#475569"></a-cylinder>
    </a-entity>

    <!-- Desk row 2 -->
    <a-entity position="5 0 -3">
      <a-box position="0 0.75 0" width="2.4" height="0.1" depth="1.2" color="#8b6f4e" shadow></a-box>
      <a-box position="-1.1 0.35 -0.5" width="0.1" height="0.7" depth="0.1" color="#5a4a35"></a-box>
      <a-box position="1.1 0.35 -0.5" width="0.1" height="0.7" depth="0.1" color="#5a4a35"></a-box>
      <a-box position="-1.1 0.35 0.5" width="0.1" height="0.7" depth="0.1" color="#5a4a35"></a-box>
      <a-box position="1.1 0.35 0.5" width="0.1" height="0.7" depth="0.1" color="#5a4a35"></a-box>
      <a-box position="0 1.3 -0.3" width="1.2" height="0.7" depth="0.05" color="#1e293b"></a-box>
      <a-box position="0 1.3 -0.32" width="1.1" height="0.6" depth="0.01" color="#a855f7"></a-box>
      <a-box position="0 0.45 0.9" width="0.6" height="0.05" depth="0.6" color="#1e293b"></a-box>
      <a-box position="0 0.85 1.18" width="0.6" height="0.85" depth="0.05" color="#1e293b"></a-box>
    </a-entity>

    <!-- AI Mentor Avatar (CoreHR copilot) -->
    <a-entity position="0 0 3">
      <a-cylinder position="0 0.6 0" radius="0.35" height="1.2" color="#6366f1"></a-cylinder>
      <a-sphere position="0 1.5 0" radius="0.3" color="#fbbf24"></a-sphere>
      <a-sphere position="-0.1 1.55 0.25" radius="0.04" color="#000"></a-sphere>
      <a-sphere position="0.1 1.55 0.25" radius="0.04" color="#000"></a-sphere>
      <!-- Floating greeting -->
      <a-entity position="0 2.4 0" look-at="[camera]">
        <a-plane width="2.5" height="0.6" color="#1e293b" opacity="0.85"></a-plane>
        <a-text value="Hi! I'm your AI HR Mentor.${"\\n"}Walk around and explore." position="0 0 0.01" align="center" color="#fff" width="2.2"></a-text>
      </a-entity>
      <a-animation attribute="rotation" to="0 360 0" dur="20000" repeat="indefinite"></a-animation>
    </a-entity>

    <!-- Floating welcome panel -->
    <a-entity position="-6 2 4" rotation="0 30 0">
      <a-plane width="3" height="1.8" color="#fff" opacity="0.95"></a-plane>
      <a-text value="ANNOUNCEMENT" position="0 0.6 0.01" align="center" color="#6366f1" width="3"></a-text>
      <a-text value="${announcement.replace(/"/g, "'").slice(0, 120)}" position="0 0 0.01" align="center" color="#1e293b" width="2.6"></a-text>
    </a-entity>

    <!-- Plants -->
    <a-cylinder position="-9 0.5 -8" radius="0.3" height="1" color="#8b6f4e"></a-cylinder>
    <a-sphere position="-9 1.5 -8" radius="0.7" color="#16a34a"></a-sphere>
    <a-cylinder position="9 0.5 -8" radius="0.3" height="1" color="#8b6f4e"></a-cylinder>
    <a-sphere position="9 1.5 -8" radius="0.7" color="#16a34a"></a-sphere>

    <a-light type="ambient" color="#fff" intensity="0.7"></a-light>
    <a-light type="directional" position="5 10 5" intensity="0.6" castShadow="true"></a-light>
  `;
}

function buildMeetingScene(): string {
  return `
    <a-sky color="#1e1b3a"></a-sky>
    <a-plane position="0 0 0" rotation="-90 0 0" width="30" height="30" color="#3d2f4a" shadow></a-plane>

    <a-box position="0 3 -8" width="16" height="6" depth="0.2" color="#2a1f3d" shadow></a-box>
    <a-box position="-8 3 0" width="0.2" height="6" depth="16" color="#2a1f3d" shadow></a-box>
    <a-box position="8 3 0" width="0.2" height="6" depth="16" color="#2a1f3d" shadow></a-box>

    <!-- Whiteboard / screen -->
    <a-plane position="0 3 -7.85" width="10" height="3.5" color="#0f172a"></a-plane>
    <a-text value="ALL-HANDS MEETING" position="0 4.2 -7.84" align="center" color="#a855f7" width="14"></a-text>
    <a-text value="Q4 Workforce Update" position="0 3.5 -7.84" align="center" color="#fff" width="10"></a-text>
    <a-text value="• Org Health: 78/100${"\\n"}• 12 critical alerts cleared${"\\n"}• 47 new hires this quarter${"\\n"}• AI Autopilot: 1,284 actions" position="0 2.5 -7.84" align="center" color="#cbd5e1" width="8"></a-text>

    <!-- Conference table -->
    <a-cylinder position="0 0.75 0" radius="3" height="0.1" color="#5a4a35" shadow></a-cylinder>
    <a-cylinder position="0 0.4 0" radius="0.4" height="0.7" color="#1e293b"></a-cylinder>

    <!-- Chairs around table -->
    ${[0, 60, 120, 180, 240, 300].map(angle => {
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * 4.2;
      const z = Math.sin(rad) * 4.2;
      return `
        <a-entity position="${x.toFixed(2)} 0 ${z.toFixed(2)}" rotation="0 ${(-angle + 90).toFixed(0)} 0">
          <a-box position="0 0.45 0" width="0.7" height="0.05" depth="0.7" color="#a855f7"></a-box>
          <a-box position="0 0.95 0.32" width="0.7" height="1" depth="0.05" color="#a855f7"></a-box>
          <a-cylinder position="0 0.2 0" radius="0.05" height="0.4" color="#475569"></a-cylinder>
        </a-entity>`;
    }).join("")}

    <!-- Floating participant indicators -->
    <a-entity position="0 5 0">
      <a-text value="6 participants live" align="center" color="#10b981" width="6"></a-text>
    </a-entity>

    <a-light type="ambient" color="#fff" intensity="0.5"></a-light>
    <a-light type="point" position="0 4 0" color="#a855f7" intensity="1.2" distance="15"></a-light>
    <a-light type="directional" position="5 10 5" intensity="0.4"></a-light>
  `;
}

function buildTrainingScene(): string {
  const stations = [
    { x: -6, z: -4, color: "#10b981", label: "Onboarding\\n101", topic: "Welcome to CoreHR AI" },
    { x: 0, z: -5, color: "#3b82f6", label: "Compliance\\nTraining", topic: "GDPR & Data Privacy" },
    { x: 6, z: -4, color: "#f59e0b", label: "Leadership\\nLab", topic: "Effective 1:1s" },
    { x: -4, z: 2, color: "#ec4899", label: "Soft Skills\\nDojo", topic: "Conflict Resolution" },
    { x: 4, z: 2, color: "#a855f7", label: "AI Tools\\nWorkshop", topic: "Using your Copilot" },
  ];
  return `
    <a-sky color="#0a1628"></a-sky>
    <a-plane position="0 0 0" rotation="-90 0 0" width="30" height="30" color="#0f1f2e" shadow></a-plane>
    <!-- Grid floor effect -->
    ${[-12, -8, -4, 0, 4, 8, 12].map(x => `
      <a-box position="${x} 0.01 0" width="0.05" height="0.02" depth="30" color="#10b981" opacity="0.3"></a-box>
      <a-box position="0 0.01 ${x}" width="30" height="0.02" depth="0.05" color="#10b981" opacity="0.3"></a-box>
    `).join("")}

    ${stations.map(s => `
      <a-entity position="${s.x} 0 ${s.z}">
        <a-cylinder position="0 0.05 0" radius="1.5" height="0.1" color="${s.color}" opacity="0.3"></a-cylinder>
        <a-cylinder position="0 1 0" radius="0.15" height="2" color="${s.color}" opacity="0.6"></a-cylinder>
        <a-sphere position="0 2.2 0" radius="0.4" color="${s.color}">
          <a-animation attribute="position" to="${s.x} 2.5 ${s.z}" direction="alternate" dur="2000" repeat="indefinite"></a-animation>
        </a-sphere>
        <a-entity position="0 3.2 0" look-at="[camera]">
          <a-plane width="2" height="0.7" color="#000" opacity="0.7"></a-plane>
          <a-text value="${s.label}" position="0 0.1 0.01" align="center" color="#fff" width="3"></a-text>
          <a-text value="${s.topic}" position="0 -0.2 0.01" align="center" color="${s.color}" width="2.5"></a-text>
        </a-entity>
      </a-entity>
    `).join("")}

    <a-light type="ambient" color="#fff" intensity="0.4"></a-light>
    <a-light type="point" position="0 5 0" color="#10b981" intensity="1" distance="20"></a-light>
  `;
}

export default function VirtualOffice() {
  usePageTitle("/virtual-office");
  const [activeScene, setActiveScene] = useState<SceneKey>("office");
  const [aframeReady, setAframeReady] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const sceneContainerRef = useRef<HTMLDivElement>(null);

  const { data: announcements = [] } = useQuery<any[]>({ queryKey: ["/api/announcements"] });
  const latestAnnouncement = announcements[0]?.message || announcements[0]?.title || "Welcome to CoreHR AI's virtual office. Walk around with WASD + mouse.";

  // Load A-Frame from CDN once
  useEffect(() => {
    if ((window as any).AFRAME) { setAframeReady(true); return; }
    const existing = document.querySelector(`script[src="${AFRAME_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => setAframeReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = AFRAME_SRC;
    script.async = true;
    script.onload = () => setAframeReady(true);
    document.head.appendChild(script);
  }, []);

  // Detect WebXR
  useEffect(() => {
    const nav = navigator as any;
    if (nav.xr?.isSessionSupported) {
      nav.xr.isSessionSupported("immersive-vr").then((s: boolean) => setVrSupported(s)).catch(() => setVrSupported(false));
    }
  }, []);

  // Suppress non-Error A-Frame/WebXR rejections that bubble up as
  // "An uncaught exception occurred but the error was not an error object".
  // A-Frame throws plain strings/objects from internal WebXR/canvas init in
  // headless or unsupported environments, which Vite's overlay can't categorize.
  useEffect(() => {
    const isAframeNoise = (val: unknown) => {
      if (val instanceof Error) return false;
      const s = typeof val === "string" ? val : JSON.stringify(val ?? "");
      return /a-?frame|webxr|webgl|three|canvas|xr session/i.test(s);
    };
    const onUnhandled = (e: PromiseRejectionEvent) => {
      if (isAframeNoise(e.reason)) { e.preventDefault(); }
    };
    const onError = (e: ErrorEvent) => {
      if (!e.error && isAframeNoise(e.message)) { e.preventDefault(); }
    };
    window.addEventListener("unhandledrejection", onUnhandled);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandled);
      window.removeEventListener("error", onError);
    };
  }, []);

  // Render scene whenever activeScene/aframeReady/announcement changes
  useEffect(() => {
    if (!aframeReady || !sceneContainerRef.current) return;
    let cancelled = false;
    try {
      const sceneHTML =
        activeScene === "office" ? buildOfficeScene(latestAnnouncement) :
        activeScene === "meeting" ? buildMeetingScene() :
        buildTrainingScene();

      sceneContainerRef.current.innerHTML = `
        <a-scene embedded vr-mode-ui="enabled: true" loading-screen="dotsColor: #6366f1; backgroundColor: #0f172a" style="width: 100%; height: 100%;">
          <a-entity id="rig" position="0 1.6 5" movement-controls="speed: 0.15" wasd-controls-enabled="true">
            <a-camera look-controls="pointerLockEnabled: false" wasd-controls position="0 0 0">
              <a-cursor color="#6366f1"></a-cursor>
            </a-camera>
          </a-entity>
          ${sceneHTML}
        </a-scene>
      `;
    } catch (err) {
      console.warn("[VirtualOffice] Scene render skipped:", err);
    }
    return () => {
      cancelled = true;
      // Tear down A-Frame scene cleanly to avoid post-unmount XR rejections
      const scene = sceneContainerRef.current?.querySelector("a-scene") as any;
      try { scene?.exitVR?.(); scene?.parentNode?.removeChild(scene); } catch {}
      if (sceneContainerRef.current && !cancelled) sceneContainerRef.current.innerHTML = "";
    };
  }, [activeScene, aframeReady, latestAnnouncement]);

  const resetPosition = () => {
    const rig = sceneContainerRef.current?.querySelector("#rig") as any;
    if (rig?.setAttribute) rig.setAttribute("position", "0 1.6 5");
  };

  const enterFullscreen = () => {
    sceneContainerRef.current?.requestFullscreen?.();
  };

  const active = SCENES[activeScene];
  const Icon = active.icon;

  return (
    <div className="relative min-h-screen p-4 sm:p-6 space-y-4">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-200/60 flex items-center gap-1.5">
              <Boxes className="h-3 w-3 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">WebXR Powered · A-Frame 1.7</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
            Virtual Office
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Step into your workspace — works on desktop, mobile, and any VR headset
          </p>
        </div>
        <div className="flex items-center gap-2">
          {vrSupported ? (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1.5">
              <Headset className="h-3 w-3" /> Headset detected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5">
              <MonitorIcon className="h-3 w-3" /> Desktop mode
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={resetPosition} data-testid="button-reset-position">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={enterFullscreen} data-testid="button-fullscreen">
            <Maximize2 className="h-4 w-4 mr-1.5" /> Fullscreen
          </Button>
        </div>
      </div>

      {/* Scene picker */}
      <div className="flex flex-wrap gap-2">
        {Object.values(SCENES).map(s => {
          const SI = s.icon;
          const isActive = s.key === activeScene;
          return (
            <button
              key={s.key}
              onClick={() => setActiveScene(s.key)}
              className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all ${
                isActive
                  ? `bg-gradient-to-r ${s.accent} text-white shadow-lg shadow-purple-500/25`
                  : "bg-white/70 border border-slate-200/60 text-slate-700 hover:bg-white hover:shadow-md"
              }`}
              data-testid={`scene-${s.key}`}
            >
              <SI className="h-4 w-4" />
              <div className="text-left">
                <div className="text-sm font-bold leading-tight">{s.name}</div>
                <div className={`text-[10px] leading-tight ${isActive ? "text-white/80" : "text-slate-500"}`}>{s.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active scene info */}
      <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-md ring-1 ring-slate-200/60 overflow-hidden">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${active.accent}`} />
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${active.accent} flex items-center justify-center shadow-md shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900">{active.name}</div>
            <div className="text-xs text-slate-500">{active.tagline}</div>
          </div>
          <Badge variant="outline" className="hidden md:flex gap-1.5 bg-white/60">
            <Sparkles className="h-3 w-3 text-indigo-600" /> Live
          </Badge>
        </CardContent>
      </Card>

      {/* The 3D scene */}
      <Card className="border-0 bg-slate-900 shadow-2xl shadow-purple-500/10 overflow-hidden ring-1 ring-slate-800">
        <div
          ref={sceneContainerRef}
          className="w-full"
          style={{ height: "min(70vh, 640px)", minHeight: "420px", position: "relative" }}
        >
          {!aframeReady && (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-3" />
                <p className="text-sm text-slate-400">Loading WebXR runtime…</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Controls help */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-0 bg-white/70 backdrop-blur-xl ring-1 ring-slate-200/60">
          <CardContent className="p-4 flex items-start gap-3">
            <Keyboard className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-slate-900 mb-0.5">Desktop controls</div>
              <p className="text-xs text-slate-600 leading-relaxed">Use <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">W A S D</kbd> to walk, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Q E</kbd> to strafe.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white/70 backdrop-blur-xl ring-1 ring-slate-200/60">
          <CardContent className="p-4 flex items-start gap-3">
            <Mouse className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-slate-900 mb-0.5">Look around</div>
              <p className="text-xs text-slate-600 leading-relaxed">Click + drag with the mouse to look around. On mobile, drag your finger.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white/70 backdrop-blur-xl ring-1 ring-slate-200/60">
          <CardContent className="p-4 flex items-start gap-3">
            <Headset className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-slate-900 mb-0.5">VR headset</div>
              <p className="text-xs text-slate-600 leading-relaxed">Click the goggles icon (bottom-right of scene) on Quest, Vision Pro, or any WebXR device.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-blue-200/60 bg-blue-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <strong>This is a real WebXR scene</strong>, not a video. It runs entirely in your browser using A-Frame 1.7. Walk around with WASD, look with your mouse, and switch scenes anytime. Open this page on a Meta Quest 2/3/Pro, Apple Vision Pro, or any WebXR-compatible headset to enter immersive VR — your same login, same data, same scene.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
