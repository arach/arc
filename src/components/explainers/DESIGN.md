---
name: Arc connection pool explainer
description: The implemented connection pool teaching surface, scoped to this directory.
colors:
  ink: "#1c2d38"
  muted: "#60717b"
  line: "#dce3e7"
  borrow: "#285ea8"
  return: "#26735c"
  paper: "#f7f9fa"
  surface: "#ffffff"
  insight: "#f7f9fb"
typography:
  display:
    fontFamily: "Space Grotesk, Segoe UI, sans-serif"
    fontSize: "clamp(30px, 3.5vw, 40px)"
    fontWeight: 550
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Space Grotesk, Segoe UI, sans-serif"
    fontSize: "13px"
    lineHeight: 1.7
  request:
    fontFamily: "ui-monospace, monospace"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.03em"
rounded:
  control: "6px"
  slot: "8px"
  figure: "16px"
spacing:
  panel: "28px"
  mobile-panel: "20px"
components:
  playback-primary:
    backgroundColor: "{colors.borrow}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  playback-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
---

# Design System: Arc connection pool explainer

## Overview

**Creative North Star: "Arc paper workbench"**

This directory documents the connection pool explainer only. It distills Arc's light identity into a compact teaching surface with a queue, four reusable slots, and database. The current local renderer and styles are the authority; this is not a global Arc design system.

**Key Characteristics:**

- A three-stage mechanism leads; shared insight and playback controls follow.
- Stable C1–C4 slots make changing request identity and lease phases visible.
- One deterministic model supplies the queue, lease bars, details, clock, and counts.

## Colors

Borrow blue marks active borrowing/querying slots, the next FIFO request, selected chapter, demand, and Run. Return green marks returning slots and the reuse insight. Idle slots and the database use quiet neutral tones. Soft blue and green fills reinforce phase labels; color never carries state alone.

## Typography

Space Grotesk carries prose, chapter controls, and stage labels. Monospace makes request IDs prominent and distinguishes C numbers and the clock. The headline uses the display token, with a mobile size of 32px. The chapter caption is 17px, reducing to 16px on mobile; connection request IDs grow from 24px to 26px on mobile. Supporting mechanism labels are 11px, and stage titles are 13px. Numeric readouts use tabular numerals where defined.

## Layout

The main column caps at 1080px with 32px desktop gutters. Reading order is introduction, figure title and clock, chapter tabs, caption, mechanism, shared insight, demand and playback controls, status, then explanation and assumptions.

Desktop places queue, pool, and database in three stages joined by two simple labeled arrows. The pool always uses a two-by-two grid of fixed C1–C4 slots. The queue shows up to six request tokens and an overflow count. At 900px, spacing tightens while retaining the stages. At 680px and below, stages stack vertically, arrows point down, tickets wrap, and controls and prose become single-column. Layout uses normal CSS sizing without a fitted or zoomed canvas.

## Elevation & Depth

The page adds no shadows. A white figure on pale paper, thin borders, tinted connection states, and a muted insight strip establish hierarchy.

## Shapes

The figure has generous rounded corners; slots have smaller corners, and tickets and playback buttons share the control radius. Slots are at least 105px tall. A thin lease bar sits at the bottom of each slot, leaving the ID and phase unobstructed. Chapter tabs use an underline instead of a filled pill.

## Components

- **Queue and connections:** FIFO tokens show zero-padded request IDs and a Next label on the first request. Four connection buttons show stable C numbers, request ID or Open, Borrowing/Querying/Returning phase, a state dot, and a shrinking lease bar. Selecting a connection toggles its details in the shared insight strip.
- **Request motion:** `usePoolHandoffs` moves a request ID from its queue position (or queue entry) into its assigned connection over 620ms, staggered by 90ms for simultaneous handoffs. The destination ID stays hidden during travel; remaining queue tokens close the gap with a 260ms FLIP animation. Pause holds flights, and Step resumes held flights. Reduced motion skips travel; reset, chapter changes, and resize clear flights. Coordinates are relative to the mechanism root, keeping source and destination aligned across scrolling. Motion presents model transitions without changing the simulation.
- **Insight:** selected details come from the retained semantic diagram projection, including remaining lease time, prior request, and queue wait. Without a selection, the strip explains a recent reuse handoff, identifies the next queued request, or invites selection.
- **Demand and playback:** native range from 0 to 6 requests/s in 0.5 increments; Run/Pause, Step 0.5 s, and Reset. Every visit starts paused. Step is disabled while running. Focus uses a blue outline with an offset.
- **Presets:** Borrow, Wait, and Reuse load fresh deterministic snapshots with live demand 1, 4, and 0 respectively. The snapshots demonstrate immediate borrowing, waiting, and C1's handoff from request #1 to #5. Chapter changes preserve playback state. Reset clears the model, returns to Borrow at demand 1, and pauses.
- **Model and access:** four reusable connections, two-second leases, FIFO capacity 24, and rejection beyond a full queue produce a maximum throughput of two requests/s. The clock advances in 50ms ticks. Playback suspends while hidden or offscreen; switching to reduced motion pauses it. Captions, insight, and categorical status use polite live regions; connection buttons expose pressed state and descriptive labels.
- **Maintenance:** `connectionPoolModel.ts` owns simulation and four-second lease history. `connectionPoolDiagram.ts` retains seeded chapters and the Arc-compatible semantic projection for details and other Arc consumers. `PoolMechanism.tsx` renders this route's compact mechanism and selection. `ConnectionPoolExplainer.tsx` owns playback and visibility; `connection-pool.css` owns the surface. This route does not mount the generic Arc diagram renderer; local request-token motion belongs to `usePoolHandoffs.ts`.

## Do's and Don'ts

- **Do** preserve stable C1–C4 positions and the mechanism-before-controls reading order.
- **Do** derive request identity, lease bars, insight, and queue order from the same model state.
- **Do** keep phase labels and connection selection usable alongside color cues.
- **Don't** imply that demand creates more connections or that the model measures real database performance.
- **Don't** add generated assets or promote this route's presentation choices into global Arc rules.
