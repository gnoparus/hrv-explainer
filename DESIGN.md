---
name: HRV Simulator
description: Interactive R-R interval / HRV simulator for live thesis-defense demos and teaching
colors:
  void: "#05080b"
  panel: "#0b1117"
  panel-raised: "#0e161d"
  hairline: "#1b2733"
  ink: "#d7e2ea"
  ink-dim: "#7c8fa0"
  signal-teal: "#2fe7c9"
  signal-violet: "#b18bff"
  signal-amber: "#ffc857"
typography:
  title:
    fontFamily: "-apple-system, 'SF Pro Text', 'Segoe UI', Roboto, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.2px"
  body:
    fontFamily: "-apple-system, 'SF Pro Text', 'Segoe UI', Roboto, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "-apple-system, 'SF Pro Text', 'Segoe UI', Roboto, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "0.6px"
  metric:
    fontFamily: "-apple-system, 'SF Pro Text', 'Segoe UI', Roboto, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    fontFeature: "tabular-nums"
rounded:
  sm: "10px"
  md: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "10px"
  md: "16px"
  lg: "24px"
components:
  metric-tile:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.md}"
    padding: "10px 14px 6px"
  export-btn:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 18px"
  preset-btn:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  toggle-group-btn:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.sm}"
    padding: "6px 14px"
---

# Design System: HRV Simulator

## 1. Overview

**Creative North Star: "The Bedside Monitor"**

The whole interface reads as an instrument, not an app: a near-black field, a
handful of glowing traces, numbers that visibly breathe. Every design
decision serves one goal — a thesis-defense audience or a student dragging a
slider should *see the physiology happen*, not read a caption explaining it.
Density stays low and the layout stays single-screen: no navigation, no
scrolling mid-demo, nothing between the presenter's hand and the result on
screen. A Live/History tab bar is the one accepted exception (added for
session-history/trend tracking, a secondary need for the self-learner
audience) — the Live tab is still the single, no-scroll instrument described
above; switching tabs is opt-in and never required during the live-demo flow.

This system explicitly rejects the generic SaaS-dashboard look (cream
backgrounds, card grids, gradient text, hero-metric tiles) and the static
textbook-figure look (flat, printed, non-responsive). It is not decorated;
every glow, pulse, and shadow earns its place by reinforcing that the signal
is live.

**Key Characteristics:**
- Near-black void with three glowing signal colors, nothing else competing for attention
- Numbers that pulse and glow in sync with the underlying data, not static labels
- Compact, dense, single-viewport layout — built to survive a live demo, not a scroll
- Tabular numerals everywhere a value updates, so nothing jitters mid-sentence

## 2. Colors

Three saturated signal colors on a near-black instrument panel; no filler hues.

### Primary
- **Signal Teal** (#2fe7c9): the default trace/positive-signal color — RMSSD, HF power, the tachogram line, the beat pulse-dot. Reads as "vagal / healthy / active."

### Secondary
- **Signal Violet** (#b18bff): the second data series — SDNN and the Poincaré scatter. Distinguishes "total variability" from the vagally-specific teal metric at a glance.

### Tertiary
- **Signal Amber** (#ffc857): reserved for the contested metric — LF power and the LF frequency band. The one warm color in the system; its rarity flags "interpret with caution" (see README: LF/HF-as-balance is invalid).

### Neutral
- **Void** (#05080b): page background. A faint teal radial glow bleeds in from the top (`radial-gradient(ellipse 80% 60% at 50% -10%, rgba(47,231,201,0.08), transparent)`) — the only ambient decoration in the system.
- **Panel** (#0b1117): the resting surface for every card, metric tile, and control group.
- **Panel Raised** (#0e161d): one step brighter — buttons and popovers that sit above a panel.
- **Hairline** (#1b2733): all borders and SVG gridlines. Never darker or lighter than this for structural lines.
- **Ink** (#d7e2ea): primary text and active values.
- **Ink Dim** (#7c8fa0): labels, units, captions, uppercase eyebrows — anything secondary.

A fourth color, `--c-red` (#ff6b6b), is reserved for error/alert states — its one use today is the file-upload parse-error message. Don't repurpose it for anything else without updating this doc.

### Named Rules
**The Three-Signal Rule.** Only teal, violet, and amber ever represent data. If a fourth data series is ever added, do not reach for a new hue — reuse one of the three with a different visual encoding (dash pattern, opacity) before introducing a new color.

## 3. Typography

**Body/UI Font:** -apple-system, SF Pro Text, Segoe UI, Roboto, system-ui, sans-serif
**Character:** A single system-native sans, used at only a few sizes. No display face, no editorial pairing — the typography is instrumentation, not identity. What personality exists comes from color and motion, not letterforms.

### Hierarchy
- **Title** (600, 22px, -0.2px tracking): the app name in the header. The only place weight and size combine for emphasis.
- **Metric** (600, 28px, tabular-nums): live RMSSD/SDNN/LF/HF values. Glows in its own signal color; the visual and numeric focal point of the screen.
- **Body** (400, 17px/1.4): base document font; rarely seen directly since the UI is mostly labels and numbers, not prose.
- **Label** (400, 13–14px, 0.6px tracking, uppercase for panel/metric-tile headers): panel titles, metric-tile headers, control captions. Always `--text-dim`, never full-contrast ink.

### Named Rules
**The Tabular Rule.** Any number that updates in real time (metric values, slider readouts) uses `font-variant-numeric: tabular-nums`. A jittering digit width undercuts credibility in front of a thesis committee.

## 4. Elevation

Flat by default — no box-shadows on panels or cards. Depth is conveyed by two background steps (Panel → Panel Raised) plus a 1px hairline border, not by shadow. The one place elevation-like depth appears is glow: `drop-shadow` and `text-shadow` in a trace's own signal color simulate a CRT/monitor phosphor glow rather than a physical lift.

### Shadow Vocabulary
- **Signal glow** (`filter: drop-shadow(0 0 6px currentColor)` on SVG traces, `text-shadow: 0 0 8–18px color-mix(in srgb, var(--tile-color) 40–70%, transparent)` on metric values): the only "elevation" in the system. Always colored by the signal it's attached to, never neutral black/gray.
- **Popover shadow** (`box-shadow: 0 12px 32px rgba(0,0,0,0.5)` on `.info-tag__popover`): the single physical drop-shadow in the system, reserved for the one floating/overlay element.

### Named Rules
**The No-Gray-Shadow Rule.** Panels and cards never cast a shadow. The only shadows in the system are colored signal glow and the one popover overlay above.

## 5. Components

Instrument-panel components: flat, bordered, low-radius, glow on the data — never on the chrome.

### Buttons
- **Shape:** 10px radius (`--rounded-sm`), min-height 44px (touch target for the live-demo iPad/tablet use case)
- **Primary (export-btn, preset-buttons):** Panel Raised background (#0e161d), 1px hairline border, ink text, 500 weight
- **Active/pressed:** border shifts to the relevant signal color (teal for export, violet for presets) — no hover state is designed; this is a touch-first, live-demo interface
- **No filled/CTA button exists.** Every button in the system is the same bordered-panel treatment; there is no higher-emphasis button variant

### Metric Tiles
- **Corner Style:** 14px radius (`--rounded-md`)
- **Background:** Panel (#0b1117), 1px hairline border
- **Content:** uppercase dim label + info-tag, then a large glowing tabular-nums value in the metric's own signal color
- **Motion:** `glowBreathe` — a 2.4s ease-in-out infinite pulse between 40% and 70% glow opacity, signaling "this is live" even when the value itself hasn't changed

### Panels (chart containers)
- **Corner Style:** 14px radius, matches Metric Tiles
- **Background:** Panel (#0b1117), 1px hairline border
- **Header:** uppercase dim label, 13px, 0.6px tracking
- **Content:** full-bleed SVG chart; gridlines and bands in hairline/signal colors per the Colors section

### Inputs (range sliders)
- **Track:** 8px pill, teal-to-violet gradient — the slider track itself doubles as a color-coded scale
- **Thumb:** 30px white circle, 3px teal border, teal glow shadow — always the largest touch target on screen (44px hit area via the input's own height)
- **Focus ring:** teal double-ring on `:focus-visible` (3px `--bg` halo + teal outer ring), styled via `input[type='range']:focus-visible::-webkit-slider-thumb` in `src/index.css`

### Toggle Group (tab bar, window toggle, source toggle)
Two-or-three-way exclusive choice, all sharing one CSS shape (`.window-toggle`/`.tabbar` in `src/index.css`): bordered-panel buttons (Panel Raised background, 1px hairline), the selected option's border and text shift to signal teal (`aria-pressed`/`aria-selected`), unselected options stay `--text-dim`. Used for the Live/History tab bar, the metrics-window toggle (60s live / 5-min clinical), and the data-source toggle (Simulated / Uploaded). Same rule as Buttons above: no filled/CTA treatment, no second selected-state color — teal is the one "active" signal across every toggle group in the app.

### Info Tag (signature component)
Tap-to-reveal definition popover (deliberately touch-first, no hover dependency — see the component's own comment). A 20px circular "i" button in ink-dim; tapping reveals a 240px popover in Panel Raised with the one true drop-shadow in the system. Used to carry the physiology explanations (e.g. why LF/HF is contested) without cluttering the metric tile itself.

## 6. Do's and Don'ts

### Do:
- **Do** keep the Live tab a single screen with no scrolling during a live demo — the Live/History tab bar is the one accepted navigation exception, and it must never be required mid-demo.
- **Do** use tabular-nums on every value that updates in real time.
- **Do** reserve signal glow (drop-shadow / text-shadow in the data's own color) for things that are actually live data, not decoration.
- **Do** keep buttons at the single bordered-panel treatment; don't invent a second, higher-emphasis button style.
- **Do** respect `prefers-reduced-motion` for the pulse-dot flash and metric-tile glow-breathe animation — swap to a static/instant state per PRODUCT.md's accessibility requirement.

### Don't:
- **Don't** introduce a cream/warm-neutral background or card-grid dashboard layout — this is a clinical instrument, not a SaaS product (per PRODUCT.md anti-references).
- **Don't** flatten the charts into static, non-glowing figures — that reads as a textbook diagram, the explicit anti-reference in PRODUCT.md.
- **Don't** add a fourth data color. Reuse teal/violet/amber with a different encoding first.
- **Don't** add a gray/black box-shadow to a panel or metric tile — depth here comes from background-step + hairline border + colored glow, never a neutral shadow.
- **Don't** repurpose `--c-red` for anything but a genuine error/alert state.
