"use client";

import type { StarCategory } from "./galaxyData";
import styles from "./InteractiveGalaxy.module.scss";

interface GalaxyHUDProps {
  category: StarCategory;
  onSelectCategory: (cat: StarCategory) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  focusedTitle?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  /** Embedded preview: drop the zoom readout so the filter labels fit uncropped. */
  compact?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  telemetryLogs: string[];
}

export default function GalaxyHUD({
  category,
  onSelectCategory,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onReset,
  focusedTitle,
  isFullscreen,
  onToggleFullscreen,
  compact = false,
  isMuted,
  onToggleMute,
  telemetryLogs,
}: GalaxyHUDProps) {
  const categories: { key: StarCategory; label: string }[] = [
    { key: "all", label: "All Stars" },
    { key: "navigation", label: "Hubs" },
    { key: "telematics", label: "Telematics" },
    { key: "platform", label: "Platform" },
  ];

  return (
    <>
      {/* Top Telemetry Header */}
      <div className={styles.hudTop}>
        <div className={styles.telemetry}>
          <span className={styles.statusIndicator}>SYSTEM ONLINE</span>
          <span>RA 14h 29m / DEC +60&deg;</span>
          {focusedTitle && <span style={{ color: "var(--text-primary)" }}>FOCUSED: {focusedTitle}</span>}
        </div>
      </div>

      {/* Telemetry scrolling feed terminal console - hidden in compact preview */}
      {!compact && (
        <div className={styles.telemetryConsole}>
          <div className={styles.consoleHeader}>
            <span className={styles.consoleDot} />
            REAL-TIME TELEMETRY LOG
          </div>
          <div className={styles.consoleBody}>
            {telemetryLogs.map((log, i) => (
              <div key={i} className={styles.consoleLine}>
                <span className={styles.consoleArrow}>&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filters + zoom/camera controls share one wrapping row so
          they resolve space between themselves instead of overlapping. */}
      <div className={styles.hudBottom}>
        <nav className={styles.filterBar} aria-label="Filter galaxy star nodes by category">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`${styles.filterBtn} ${category === cat.key ? styles.active : ""}`}
              onClick={() => onSelectCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        <div className={styles.hudControls}>
          {/* Web Audio Toggle Switch */}
          <button
            type="button"
            className={`${styles.ctrlBtn} ${!isMuted ? styles.soundOn : ""}`}
            onClick={onToggleMute}
            aria-label={isMuted ? "Activate sound effects" : "Mute sound effects"}
            style={{ fontWeight: 600, letterSpacing: "0.05em" }}
          >
            {isMuted ? "📡 COMMS MUTE" : "🟢 COMMS OPEN"}
          </button>

          <button type="button" className={styles.ctrlBtn} onClick={onZoomIn} aria-label="Zoom camera in">
            +
          </button>
          <button type="button" className={styles.ctrlBtn} onClick={onZoomOut} aria-label="Zoom camera out">
            &minus;
          </button>
          <button type="button" className={styles.ctrlBtn} onClick={onReset} aria-label="Reset galaxy camera view">
            Reset
          </button>
          {onToggleFullscreen && (
            <button type="button" className={styles.ctrlBtn} onClick={onToggleFullscreen} aria-label="Toggle full screen galaxy map">
              {isFullscreen ? "Exit" : "Full"}
            </button>
          )}
          {!compact && (
            <span className={styles.zoomReadout}>{Math.round(zoomLevel * 100)}%</span>
          )}
        </div>
      </div>
    </>
  );
}
