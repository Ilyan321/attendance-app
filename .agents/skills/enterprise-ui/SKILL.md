---
name: enterprise-ui
description: Enforces strict Enterprise SaaS UI/UX architecture for a clean, highly functional, professional aesthetic.
---
# Knowledge

## 1. Core Enterprise Design Philosophy
- **Cognitive Load Reduction**: Never display the same data point twice on the same screen. Favor clean, functional whitespace over decorative background elements.
- **Data-Ink Ratio**: Remove all UI elements that do not actively transmit data or provide utility. Eliminate glowing text, generic glassmorphism, heavy drop shadows, and oversized typography (e.g., avoid `text-5xl` or `text-6xl` unless it's a critical KPI).
- **The Inverted Pyramid**: Start with the broadest, most high-level summaries at the top of the layout (Global KPIs). Move to searchable, filterable grids/lists of core entities in the middle (Classes). Place detailed schedules or logs at the bottom.

## 2. Component Layout & Spacing (Gestalt Principles)
- **Law of Proximity**: Interactive elements (like buttons) MUST be physically grouped with the entity they control. (e.g., Place a primary "+ Add" button directly adjacent to the section header it affects).
- **Flexbox Alignments**: Use `flex justify-between items-center` for standard row headers to perfectly balance left-aligned titles with right-aligned actions.
- **Card Architecture**: Strictly follow this visual hierarchy inside cards: Title (Bold, dark) > Primary Meta-data (Medium weight, lighter color) > Secondary Context (Small, muted text).

## 3. Action Clarity & Fitts's Law
- **Primary Actions**: Every distinct UI view or major card must have exactly ONE highly visible primary action (e.g., a solid background button).
- **Secondary/Tertiary Actions**: Do not clutter UIs with standalone Edit/Delete/History buttons. Group all secondary actions inside a discreet kebab menu (`⋮`) or dropdown overlay to prevent button fatigue.
- **Destructive Actions**: Always style destructive actions (like Delete) in a warning color (e.g., `text-red-600`) and ensure they are tucked away from accidental clicks.

## 4. Typography & Color Systems
- **Utility-Driven Text**: Rely on standard, predictable UI scale classes (`text-sm`, `text-base`, `text-lg`, `text-xl`). Use `text-gray-900` for primary headings, and `text-gray-500` for secondary context.
- **Borders & Separators**: Separate sections using subtle borders (`border-gray-200`) and slight background shifts (`bg-gray-50`), avoiding heavy layered box-shadows.

## 5. Perceived Performance & State
- **Flash of Empty State (FOES)**: Never show an empty state ("No items") before data has finished fetching from the database. Always implement an `isLoading` boolean.
- **Skeleton Loaders**: Use `animate-pulse` and `bg-gray-200` to create placeholder UIs that exactly match the geometry of the resolved data layout while waiting for fetch promises to resolve.

# Instructions
When the user requests UI updates, dashboard modifications, or new React components:
1. STRICTLY adhere to this Enterprise UI/UX Protocol.
2. Prioritize functional utility, clean spacing, and logical component hierarchy over flashy visual trends.
3. Ensure all code output strictly adheres to the layout, proximity, and hierarchy rules defined above.
