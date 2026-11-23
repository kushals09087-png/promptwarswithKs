import React from "react";

/**
 * AppBackground ("Living Lab Atmosphere")
 * 
 * Multi-layered, GPU-accelerated atmospheric background:
 * 1. Base: Solid deep navy (#0A1020) with subtle vertical gradient
 * 2. Aurora Glows: 3 slow-drifting radial gradients (Indigo, Violet, Role Accent)
 * 3. Technical Grid: Faint 48px coordinate grid with radial edge mask
 * 4. Noise Grain: Clean inline SVG turbulence grain to prevent banding
 * 5. Vignette: Soft ambient dark vignette concentrating eye gaze
 *
 * Fully decorative and hidden from assistive technologies (aria-hidden="true").
 * Strictly pure CSS animations with zero runtime JS animation overhead.
 */
export default function AppBackground() {
  return (
    <div className="living-lab-bg" aria-hidden="true">
      <div className="living-lab-base" />
      <div className="living-lab-aurora aurora-glow-1" />
      <div className="living-lab-aurora aurora-glow-2" />
      <div className="living-lab-aurora aurora-glow-3" />
      <div className="living-lab-grid" />
      <div className="living-lab-grain" />
      <div className="living-lab-vignette" />
    </div>
  );
}
