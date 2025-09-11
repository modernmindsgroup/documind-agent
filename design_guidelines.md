# AI Agent Dashboard Design Guidelines

## Design Approach: Material Design (Data-Heavy Enterprise)
This enterprise-grade AI platform requires Material Design's robust component system to handle complex data visualization, multi-tenant architecture, and sophisticated workflow management while maintaining clarity and usability.

## Core Design Elements

### Color Palette
**Dark Mode Primary (Main Theme):**
- Background: 220 25% 8% (deep navy-black)
- Surface: 220 20% 12% (elevated dark surface)
- Primary: 210 100% 60% (vibrant blue for CTAs)
- Secondary: 220 15% 25% (muted for borders/dividers)
- Success: 142 76% 36% (green for active states)
- Warning: 38 92% 50% (amber for alerts)
- Error: 0 84% 60% (red for errors)
- Text Primary: 0 0% 95% (high contrast white)
- Text Secondary: 0 0% 70% (muted text)

### Typography
- **Primary Font:** Inter (Google Fonts)
- **Code Font:** JetBrains Mono (for API keys, webhooks)
- **Hierarchy:** text-2xl (headings), text-lg (subheadings), text-base (body), text-sm (metadata)

### Layout System
**Tailwind Spacing:** Consistent use of 2, 4, 6, 8, 12 units
- Micro spacing: p-2, m-2 (8px)
- Standard spacing: p-4, m-4 (16px) 
- Section spacing: p-8, m-8 (32px)
- Layout spacing: p-12, m-12 (48px)

### Component Library

**Navigation:**
- Fixed dark sidebar (w-64) with collapsible sub-menus
- Top bar with tenant switcher, notifications, user avatar
- Breadcrumb navigation for deep pages

**Data Display:**
- Cards with subtle shadows for metrics and content sections
- Tables with sticky headers, sorting, and row selection
- Timeline components for activity feeds and logs
- Progress indicators for agent deployment status

**Forms & Inputs:**
- Outlined input fields with floating labels
- Toggle switches for agent settings
- Multi-select dropdowns for integrations
- File upload zones with drag-and-drop

**Workflow Builder:**
- Canvas with grid background
- Rounded rectangular nodes with connection points
- Color-coded node types (blue=start, green=tools, red=conditions)
- Floating toolbar for node creation

**Overlays:**
- Modal dialogs for configuration forms
- Slide-out panels for detailed views
- Toast notifications for status updates
- Context menus for quick actions

### Visual Hierarchy
- Use card elevation to separate content sections
- Bold typography weights only for primary headings
- Consistent icon sizing (16px, 20px, 24px) from Heroicons
- Color coding for status indicators and agent types

### Responsive Behavior
- Sidebar collapses to icons on tablet/mobile
- Tables scroll horizontally with fixed columns
- Cards stack vertically on smaller screens
- Workflow canvas maintains touch gestures

### Key UX Principles
- **Progressive Disclosure:** Hide complexity behind expandable sections
- **Contextual Actions:** Show relevant options based on selected items
- **Immediate Feedback:** Real-time validation and status updates
- **Consistent Patterns:** Reuse interaction models across modules
- **Minimal Cognitive Load:** Group related functions and minimize navigation depth

This design system prioritizes enterprise usability while maintaining visual sophistication appropriate for an AI platform targeting technical users and decision-makers.