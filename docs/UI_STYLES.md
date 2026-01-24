# Wheely Partner - Complete UI Styles Reference

This document provides a comprehensive reference of all UI styles, design tokens, and styling patterns used throughout the Wheely Partner application.

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Border Radius](#border-radius)
5. [Borders](#borders)
6. [Shadows](#shadows)
7. [Sizing](#sizing)
8. [Z-Index Layers](#z-index-layers)
9. [Opacity](#opacity)
10. [Backdrop Effects](#backdrop-effects)
11. [Transitions & Animations](#transitions--animations)
12. [Grid System](#grid-system)
13. [Responsive Breakpoints](#responsive-breakpoints)
14. [Component-Specific Styles](#component-specific-styles)
15. [Custom Utilities](#custom-utilities)
16. [CSS Variables](#css-variables)

---

## Color System

### CSS Variable Colors (shadcn/ui)

The application uses CSS variables for theme-aware colors that support light and dark modes:

#### Light Mode Variables
```css
--background: 0 0% 100%           /* White */
--foreground: 0 0% 3.9%           /* Near black */
--card: 0 0% 100%                 /* White */
--card-foreground: 0 0% 3.9%      /* Near black */
--popover: 0 0% 100%              /* White */
--popover-foreground: 0 0% 3.9%   /* Near black */
--primary: 0 0% 9%                /* Dark gray */
--primary-foreground: 0 0% 98%    /* Near white */
--secondary: 0 0% 96.1%           /* Light gray */
--secondary-foreground: 0 0% 9%   /* Dark gray */
--muted: 0 0% 96.1%               /* Light gray */
--muted-foreground: 0 0% 45.1%   /* Medium gray */
--accent: 0 0% 96.1%              /* Light gray */
--accent-foreground: 0 0% 9%      /* Dark gray */
--destructive: 0 84.2% 60.2%      /* Red */
--destructive-foreground: 0 0% 98% /* Near white */
--border: 0 0% 89.8%              /* Light gray border */
--input: 0 0% 89.8%              /* Light gray input border */
--ring: 0 0% 3.9%                 /* Dark ring */
--radius: 0.5rem                  /* 8px border radius */
```

#### Dark Mode Variables
```css
--background: 0 0% 3.9%            /* Dark */
--foreground: 0 0% 98%             /* Near white */
--card: 0 0% 3.9%                  /* Dark */
--card-foreground: 0 0% 98%       /* Near white */
--popover: 0 0% 3.9%               /* Dark */
--popover-foreground: 0 0% 98%     /* Near white */
--primary: 0 0% 98%                /* Near white */
--primary-foreground: 0 0% 9%      /* Dark */
--secondary: 0 0% 14.9%            /* Dark gray */
--secondary-foreground: 0 0% 98%   /* Near white */
--muted: 0 0% 14.9%                /* Dark gray */
--muted-foreground: 0 0% 63.9%    /* Medium gray */
--accent: 0 0% 14.9%               /* Dark gray */
--accent-foreground: 0 0% 98%     /* Near white */
--destructive: 0 62.8% 30.6%      /* Dark red */
--destructive-foreground: 0 0% 98% /* Near white */
--border: 0 0% 14.9%               /* Dark border */
--input: 0 0% 14.9%                /* Dark input border */
--ring: 0 0% 83.1%                 /* Light ring */
```

### Tailwind Color Palette

#### Primary Colors (Blue Gradient)
- `blue-600`: `#2563EB` - Used in gradients, icons, focus states
- `blue-700`: `#1D4ED8` - Primary gradient start
- `blue-800`: `#1E40AF` - Primary gradient middle
- `blue-900`: `#1E3A8A` - Primary gradient end, text gradients, buttons
- `indigo-800`: `#4F46E5` - Gradient accent

**Usage Examples:**
```tsx
// Gradient backgrounds
className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"
className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900"

// Text gradients
className="bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent"

// Buttons
className="bg-blue-900 text-white hover:bg-blue-800"
className="bg-blue-600 hover:bg-blue-700"
```

#### Status Colors

**Green (Success/Active)**
- `green-500`: `#10B981` - Success states, available status, status dots
- `green-600`: `#059669` - Darker green accents
- `green-100`: `#D1FAE5` - Light green backgrounds
- `green-700`: `#047857` - Green text on light backgrounds
- `green-200`: `#A7F3D0` - Green borders

**Yellow (Pending/Warning)**
- `yellow-500`: `#EAB308` - Pending status
- `yellow-100`: `#FEF3C7` - Light yellow backgrounds
- `yellow-700`: `#A16207` - Yellow text
- `yellow-200`: `#FDE68A` - Yellow borders

**Orange (Warnings/Stats)**
- `orange-500`: `#F97316` - Warnings, stats
- `orange-100`: `#FFEDD5` - Light orange backgrounds
- `orange-700`: `#C2410C` - Orange text
- `orange-200`: `#FED7AA` - Orange borders

**Red (Errors/Destructive)**
- `red-500`: `#EF4444` - Errors, cancelled status
- `red-600`: `#DC2626` - Darker red, delete buttons
- `red-100`: `#FEE2E2` - Light red backgrounds
- `red-700`: `#B91C1C` - Red text
- `red-200`: `#FECACA` - Red borders

**Purple (Calendar/Analytics)**
- `purple-500`: `#A855F7` - Calendar, analytics
- `purple-100`: `#F3E8FF` - Light purple backgrounds
- `purple-700`: `#7E22CE` - Purple text
- `purple-200`: `#E9D5FF` - Purple borders

#### Neutral Colors
- `white`: `#FFFFFF` - Primary backgrounds, cards
- `gray-50`: `#F9FAFB` - Section backgrounds, disabled states
- `gray-100`: `#F3F4F6` - Light backgrounds, borders
- `gray-200`: `#E5E7EB` - Borders, dividers
- `gray-300`: `#D1D5DB` - Lighter borders, hover states
- `gray-400`: `#9CA3AF` - Icons, secondary text
- `gray-500`: `#6B7280` - Muted text
- `gray-600`: `#4B5563` - Secondary text
- `gray-700`: `#374151` - Body text, labels
- `gray-900`: `#111827` - Primary text, headings

#### Background Blobs (Login Page)
- `blue-700` with `opacity-20` and `blur-xl`
- `blue-800` with `opacity-20` and `blur-xl`
- `indigo-800` with `opacity-20` and `blur-xl`

---

## Typography

### Font Families

#### Primary Font: Urbanist
- **Source**: Google Fonts
- **Variable**: `--font-urbanist`
- **Applied to**:
  - Body text
  - Headings (h1-h6)
  - Buttons
  - Labels

**Usage:**
```tsx
className="font-urbanist"
// or via CSS variable
fontFamily: 'var(--font-urbanist), sans-serif'
```

#### System Fonts (Inputs)
For better readability in form inputs:
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
'Helvetica Neue', sans-serif
```

**Applied to:**
- `input[type="text"]`
- `input[type="email"]`
- `input[type="password"]`
- `input[type="number"]`
- `input[type="tel"]`
- `input[type="url"]`
- `input[type="search"]`
- `input[type="date"]`
- `input[type="time"]`
- `input[type="datetime-local"]`
- `textarea`
- `select`

#### Monospace Fonts (Code)
```
'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 
Consolas, 'Courier New', monospace
```

**Applied to:**
- `code`
- `pre`
- `kbd`
- `samp`

### Font Sizes

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `text-xs` | 0.75rem | 12px | Labels, badges, small text |
| `text-sm` | 0.875rem | 14px | Secondary text, descriptions, buttons |
| `text-base` | 1rem | 16px | Body text, button text, inputs |
| `text-lg` | 1.125rem | 18px | Subheadings |
| `text-xl` | 1.25rem | 20px | Section headings |
| `text-2xl` | 1.5rem | 24px | Page titles (mobile) |
| `text-3xl` | 1.875rem | 30px | Page titles (tablet) |
| `text-4xl` | 2.25rem | 36px | Large headings |
| `text-5xl` | 3rem | 48px | Hero text (mobile) |
| `text-6xl` | 3.75rem | 60px | Hero text (desktop) |

### Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Default body text |
| `font-medium` | 500 | Buttons, labels |
| `font-semibold` | 600 | Badges, stats, important text |
| `font-bold` | 700 | Headings, important text |

### Line Heights

| Class | Value | Usage |
|-------|-------|-------|
| `leading-tight` | 1.25 | Headings |
| `leading-normal` | 1.5 | Body text (default) |
| `leading-relaxed` | 1.625 | Long-form text |

### Letter Spacing

| Class | Value | Usage |
|-------|-------|-------|
| `tracking-wide` | 0.025em | Uppercase labels |
| `tracking-tight` | -0.025em | Condensed text |

---

## Spacing System

### Padding

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `p-2` | 0.5rem | 8px | Small padding |
| `p-3` | 0.75rem | 12px | Medium-small padding |
| `p-4` | 1rem | 16px | Standard card padding (mobile) |
| `p-5` | 1.25rem | 20px | Medium padding |
| `p-6` | 1.5rem | 24px | Standard card padding (desktop) |
| `p-8` | 2rem | 32px | Large containers |
| `p-10` | 2.5rem | 40px | Extra large containers |
| `p-12` | 3rem | 48px | Empty states |

### Responsive Padding

**Horizontal:**
```tsx
className="px-4 sm:px-6 lg:px-8"  // 1rem / 1.5rem / 2rem
```

**Vertical:**
```tsx
className="py-3 sm:py-4"           // 0.75rem / 1rem
className="py-4 sm:py-6 lg:py-8"   // 1rem / 1.5rem / 2rem
```

### Margin

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `mb-1` | 0.25rem | 4px | Tiny spacing |
| `mb-2` | 0.5rem | 8px | Small spacing |
| `mb-3` | 0.75rem | 12px | Medium-small spacing |
| `mb-4` | 1rem | 16px | Standard spacing |
| `mb-6` | 1.5rem | 24px | Large spacing |

### Gap (Flexbox/Grid)

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `gap-2` | 0.5rem | 8px | Small gaps |
| `gap-3` | 0.75rem | 12px | Standard gaps |
| `gap-4` | 1rem | 16px | Medium gaps |
| `gap-6` | 1.5rem | 24px | Large gaps |

**Responsive:**
```tsx
className="gap-3 sm:gap-4 lg:gap-6"  // 0.75rem / 1rem / 1.5rem
className="gap-2 sm:gap-3"            // 0.5rem / 0.75rem
```

---

## Border Radius

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `rounded-lg` | 0.5rem | 8px | Standard buttons, inputs |
| `rounded-xl` | 0.75rem | 12px | Cards, larger buttons |
| `rounded-2xl` | 1rem | 16px | Large cards, modals |
| `rounded-3xl` | 1.5rem | 24px | Extra large cards, login form |
| `rounded-full` | 9999px | - | Pills, badges, status dots |
| `rounded-t-full` | Top only | - | Active nav indicators |
| `rounded-t-3xl` | Top 1.5rem | - | Mobile modals |

**CSS Variable:**
- `--radius: 0.5rem` (8px) - Base radius
- `rounded-lg`: `var(--radius)`
- `rounded-md`: `calc(var(--radius) - 2px)`
- `rounded-sm`: `calc(var(--radius) - 4px)`

---

## Borders

### Border Width

| Class | Width | Usage |
|-------|-------|-------|
| `border` | 1px | Standard borders |
| `border-2` | 2px | Thicker borders (inputs, cards) |
| `border-t-2` | 2px top | Top border only |

### Border Colors

| Class | Color | Usage |
|-------|-------|-------|
| `border-gray-100` | `#F3F4F6` | Light borders |
| `border-gray-200` | `#E5E7EB` | Standard borders |
| `border-gray-300` | `#D1D5DB` | Hover borders |
| `border-white` | `#FFFFFF` | White borders (status dots) |
| `border-blue-600` | `#2563EB` | Focus borders |
| `border-red-200` | `#FECACA` | Error borders |
| `border-green-200` | `#A7F3D0` | Success borders |
| `border-yellow-200` | `#FDE68A` | Warning borders |

**CSS Variable Borders:**
- `border-border` - Uses `--border` variable
- `border-input` - Uses `--input` variable

---

## Shadows

| Class | Shadow | Usage |
|-------|--------|-------|
| `shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle shadows |
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle shadows |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Medium shadows |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Large shadows |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | Extra large shadows |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Maximum shadows (modals, login card) |

**Hover Shadows:**
- `hover:shadow-xl` - Elevates on hover
- `hover:shadow-lg` - Moderate elevation

---

## Sizing

### Width

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `w-3` | 0.75rem | 12px | Small icons, status dots |
| `w-4` | 1rem | 16px | Standard icons |
| `w-5` | 1.25rem | 20px | Medium icons |
| `w-6` | 1.5rem | 24px | Large icons |
| `w-8` | 2rem | 32px | Extra large icons |
| `w-10` | 2.5rem | 40px | Container icons |
| `w-11` | 2.75rem | 44px | Logo size |
| `w-12` | 3rem | 48px | Large containers |
| `w-16` | 4rem | 64px | Avatar sizes |
| `w-20` | 5rem | 80px | Large avatars |
| `w-24` | 6rem | 96px | Extra large elements |
| `w-80` | 20rem | 320px | Blob sizes |
| `w-full` | 100% | - | Full width |

### Height

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `h-3` | 0.75rem | 12px | Status dots |
| `h-4` | 1rem | 16px | Small icons |
| `h-5` | 1.25rem | 20px | Standard icons |
| `h-6` | 1.5rem | 24px | Large icons |
| `h-8` | 2rem | 32px | Extra large icons |
| `h-9` | 2.25rem | 36px | Avatar sizes |
| `h-10` | 2.5rem | 40px | Container icons |
| `h-11` | 2.75rem | 44px | Logo size |
| `h-12` | 3rem | 48px | Large containers |
| `h-14` | 3.5rem | 56px | Extra large containers |
| `h-16` | 4rem | 64px | Avatar sizes, mobile nav |
| `h-20` | 5rem | 80px | Large avatars |
| `h-24` | 6rem | 96px | Extra large elements |
| `h-40` | 10rem | 160px | Card images |
| `h-48` | 12rem | 192px | Large card images |
| `h-full` | 100% | - | Full height |
| `h-screen` | 100vh | - | Full viewport height |
| `min-h-screen` | 100vh | - | Minimum full height |
| `min-h-[44px]` | 44px | - | Touch target minimum |

### Custom Sizes (Tailwind Config)

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `h-7` | 1.75rem | 28px | Custom height |
| `h-8.5` | 2.125rem | 34px | Custom height |
| `h-10` | 2.5rem | 40px | Custom height |
| `w-7` | 1.75rem | 28px | Custom width |
| `w-8.5` | 2.125rem | 34px | Custom width |

---

## Z-Index Layers

| Class | Value | Usage |
|-------|-------|-------|
| `z-10` | 10 | Dropdowns, tooltips |
| `z-20` | 20 | Overlays |
| `z-40` | 40 | Backdrops |
| `z-50` | 50 | Modals, mobile nav, toasts |

---

## Opacity

| Class | Value | Usage |
|-------|-------|-------|
| `opacity-10` | 0.1 | Very subtle overlays |
| `opacity-20` | 0.2 | Background patterns |
| `opacity-50` | 0.5 | Disabled states, overlays |
| `opacity-80` | 0.8 | Semi-transparent backgrounds |
| `/80` | 80% | Opacity modifier (e.g., `bg-red-50/80`) |

---

## Backdrop Effects

| Class | Effect | Usage |
|-------|--------|-------|
| `backdrop-blur-sm` | `blur(4px)` | Subtle blur |
| `backdrop-blur-md` | `blur(8px)` | Medium blur |
| `backdrop-blur-lg` | `blur(16px)` | Large blur |
| `backdrop-blur-xl` | `blur(24px)` | Extra large blur |
| `mix-blend-multiply` | Multiply blend mode | For blobs |

---

## Transitions & Animations

### Transition Duration

| Class | Duration | Usage |
|-------|----------|-------|
| `duration-150` | 150ms | Global default |
| `duration-200` | 200ms | Button interactions |
| `duration-300` | 300ms | Card hovers, page transitions |
| `duration-500` | 500ms | Background animations |

### Transition Timing

| Class | Function | Usage |
|-------|----------|-------|
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Standard easing |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Custom easing |

### Transform Values

| Class | Transform | Usage |
|-------|-----------|-------|
| `translate-y-0` | `translateY(0)` | Reset |
| `-translate-y-1` | `translateY(-0.25rem)` | Hover lift |
| `-translate-y-0.5` | `translateY(-0.125rem)` | Subtle lift |
| `translate-x-1` | `translateX(0.25rem)` | Icon slide |
| `scale-95` | `scale(0.95)` | Active press |
| `scale-105` | `scale(1.05)` | Hover scale |
| `scale-110` | `scale(1.1)` | Icon hover |
| `scale-150` | `scale(1.5)` | Background effects |

### Custom Animations

#### Keyframe Animations

**Fade In:**
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```
- Class: `animate-fade-in`
- Duration: `0.3s ease-out`

**Slide In (from bottom):**
```css
@keyframes slide-in {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```
- Class: `animate-slide-in`
- Duration: `0.3s ease-out`

**Slide In (from top):**
```css
@keyframes slide-in-top {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```
- Class: `animate-slide-in-top`
- Duration: `0.3s ease-out`

**Slide Down (for dropdowns):**
```css
@keyframes slide-down {
  from {
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    max-height: 500px;
    opacity: 1;
    transform: translateY(0);
  }
}
```
- Class: `animate-slide-down`
- Duration: `0.3s ease-out`

**Scale Fade (for modals):**
```css
@keyframes scale-fade {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```
- Class: `animate-scale-fade`
- Duration: `0.2s ease-out`

**Pulse (for loading states):**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```
- Class: `animate-pulse`
- Duration: `2s cubic-bezier(0.4, 0, 0.6, 1) infinite`

**Shimmer (for skeleton loading):**
```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

**Blob (for background elements):**
```css
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
```
- Class: `animate-blob`
- Duration: `7s infinite`

### Animation Delays

| Class | Delay | Usage |
|-------|-------|-------|
| `animation-delay-2000` | 2s | Staggered animations |
| `animation-delay-4000` | 4s | Staggered animations |
| `animate-delay-100` | 0.1s | List items |
| `animate-delay-200` | 0.2s | List items |
| `animate-delay-300` | 0.3s | List items |

### Custom Transition Classes

| Class | Transition | Usage |
|-------|-----------|-------|
| `transition-smooth` | `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` | Smooth transitions |
| `transition-slow` | `all 0.4s cubic-bezier(0.4, 0, 0.2, 1)` | Slow transitions |

### Performance Optimizations

| Class | Property | Usage |
|-------|----------|-------|
| `gpu-accelerated` | `transform: translateZ(0); will-change: transform` | GPU acceleration |
| `will-animate` | `will-change: transform, opacity` | Pre-optimize animations |
| `animation-complete` | `will-change: auto` | Remove after animation |

---

## Grid System

### Grid Columns

| Class | Columns | Usage |
|-------|---------|-------|
| `grid-cols-1` | 1 | Single column (mobile) |
| `sm:grid-cols-2` | 2 | 2 columns (tablet) |
| `lg:grid-cols-3` | 3 | 3 columns (desktop) |
| `lg:grid-cols-4` | 4 | 4 columns (large desktop) |

### Max Widths

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `max-w-md` | 28rem | 448px | Forms, modals |
| `max-w-3xl` | 48rem | 768px | Large modals |
| `max-w-5xl` | 64rem | 1024px | Extra large modals |
| `max-w-7xl` | 80rem | 1280px | Page containers |

---

## Responsive Breakpoints

| Breakpoint | Size | Usage |
|------------|------|-------|
| `xs` | 375px | Extra small phones |
| `sm` | 640px | Small tablets, large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | Extra large desktops |

**Usage Example:**
```tsx
className="text-2xl sm:text-3xl lg:text-4xl"
className="p-4 sm:p-6 lg:p-8"
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
```

---

## Component-Specific Styles

### Buttons

#### Button Variants (shadcn/ui)

**Default:**
```tsx
className="bg-primary text-primary-foreground hover:bg-primary/90"
```

**Destructive:**
```tsx
className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
```

**Outline:**
```tsx
className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"
```

**Secondary:**
```tsx
className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
```

**Ghost:**
```tsx
className="hover:bg-accent hover:text-accent-foreground"
```

**Link:**
```tsx
className="text-primary underline-offset-4 hover:underline"
```

#### Button Sizes

| Size | Classes | Height | Usage |
|------|---------|--------|-------|
| Default | `h-10 px-4 py-2` | 40px | Standard buttons |
| Small | `h-9 rounded-md px-3` | 36px | Compact buttons |
| Large | `h-11 rounded-md px-8` | 44px | Prominent buttons |
| Icon | `h-10 w-10` | 40px | Icon-only buttons |

#### Custom Button Styles

**Primary Button:**
```tsx
className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-900 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm sm:text-base min-h-[44px]"
```

**Secondary Button:**
```tsx
className="px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
```

**Danger Button:**
```tsx
className="px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-semibold transition-colors"
```

### Inputs

**Standard Input:**
```tsx
className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all min-h-[44px]"
```

**Input with Icon:**
```tsx
className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all min-h-[44px]"
```

**Error Input:**
```tsx
className="w-full px-4 py-3.5 text-base border-2 border-red-500 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
```

### Cards

**Standard Card:**
```tsx
className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all"
```

**Card with Gradient Header:**
```tsx
className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-2xl shadow-xl overflow-hidden"
```

**Card Content:**
```tsx
className="p-4 sm:p-6"
```

### Modals

**Modal Backdrop:**
```tsx
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
```

**Modal Container:**
```tsx
className="fixed inset-0 z-50 overflow-y-auto"
```

**Modal Content:**
```tsx
className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-h-screen sm:max-h-[90vh] overflow-hidden animate-scale-fade"
```

**Mobile Modal:**
```tsx
className="bg-white rounded-t-3xl shadow-2xl border-t-2 border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto safe-area-inset-bottom"
```

### Status Badges

**Active Status:**
```tsx
className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-green-100 text-green-700 border-green-200"
```

**Pending Status:**
```tsx
className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-yellow-100 text-yellow-700 border-yellow-200"
```

**Error Status:**
```tsx
className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-red-100 text-red-700 border-red-200"
```

### Navigation

**Header:**
```tsx
className="bg-white sticky top-0 z-50 transition-all duration-300 shadow-sm border-b border-gray-100"
```

**Header (Scrolled):**
```tsx
className="bg-white sticky top-0 z-50 transition-all duration-300 shadow-lg border-b border-gray-200"
```

**Nav Item (Active):**
```tsx
className="text-blue-700 bg-blue-50 shadow-sm"
```

**Nav Item (Inactive):**
```tsx
className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
```

**Mobile Nav:**
```tsx
className="lg:hidden border-t border-gray-100 bg-white animate-slide-down z-50 max-h-[calc(100vh-4rem)] overflow-y-auto safe-area-inset-bottom"
```

### Alerts

**Default Alert:**
```tsx
className="relative w-full rounded-lg border p-4 bg-background text-foreground"
```

**Warning Alert:**
```tsx
className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border-amber-200"
```

**Destructive Alert:**
```tsx
className="border-destructive/50 text-destructive bg-red-50"
```

### Dropdowns

**Dropdown Button:**
```tsx
className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white flex items-center justify-between hover:border-blue-400 min-h-[44px] text-base sm:text-sm"
```

**Dropdown Menu:**
```tsx
className="absolute z-50 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-slide-in-top"
```

**Dropdown Item:**
```tsx
className="w-full px-4 py-3 text-left flex items-center gap-2.5 hover:bg-blue-50 transition-colors min-h-[44px] text-gray-900"
```

**Dropdown Item (Selected):**
```tsx
className="bg-blue-50 text-blue-900 font-medium"
```

### Forms

**Form Container:**
```tsx
className="space-y-4 sm:space-y-6"
```

**Form Label:**
```tsx
className="block text-sm font-medium text-gray-700"
```

**Form Input Group:**
```tsx
className="space-y-2"
```

**Form Error Message:**
```tsx
className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3"
```

**Form Success Message:**
```tsx
className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3"
```

### Toast Notifications

**Success Toast:**
```tsx
className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in"
```

**Error Toast:**
```tsx
className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in"
```

---

## Custom Utilities

### Mobile Optimizations

**Touch Manipulation:**
```tsx
className="touch-manipulation"
```
- Prevents double-tap zoom on mobile
- Applied to buttons, links, interactive elements

**Safe Area Insets:**
```tsx
className="safe-area-inset-bottom"  // padding-bottom: env(safe-area-inset-bottom)
className="safe-area-inset-top"    // padding-top: env(safe-area-inset-top)
```
- For notched devices (iPhone X+)
- Applied to mobile navigation

**Mobile Padding:**
```tsx
className="mobile-padding"  // px-4 on mobile
```

### Scrollbar Utilities

**Hide Scrollbar:**
```tsx
className="scrollbar-hide"
```
- Hides scrollbar but keeps functionality
- Works in Chrome, Safari, Firefox, Edge

### Text Utilities

**Truncate:**
```tsx
className="truncate"  // text-overflow: ellipsis; overflow: hidden; white-space: nowrap;
```

**Line Clamp:**
```tsx
className="line-clamp-2"  // Clamp to 2 lines
className="line-clamp-3"  // Clamp to 3 lines
```

### Layout Utilities

**Container:**
```tsx
className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8"
```

**Flex Center:**
```tsx
className="flex items-center justify-center"
```

**Grid Center:**
```tsx
className="grid place-items-center"
```

### Responsive Text Sizing

**Mobile-First Approach:**
```tsx
className="text-2xl sm:text-3xl lg:text-4xl"  // Smaller on mobile, larger on desktop
```

### Responsive Spacing

**Mobile-First Padding:**
```tsx
className="p-4 sm:p-6 lg:p-8"  // 16px / 24px / 32px
```

**Mobile-First Gap:**
```tsx
className="gap-3 sm:gap-4 lg:gap-6"  // 12px / 16px / 24px
```

---

## CSS Variables

### Root Variables (Light Mode)

Defined in `app/globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}
```

### Font Variable

```css
--font-urbanist: 'Urbanist', sans-serif;
```

### Usage in Tailwind

These variables are used via Tailwind's color system:

```tsx
className="bg-background"           // Uses --background
className="text-foreground"          // Uses --foreground
className="bg-primary"               // Uses --primary
className="text-primary-foreground" // Uses --primary-foreground
className="border-border"           // Uses --border
className="rounded-lg"               // Uses --radius
```

---

## Best Practices

### Mobile-First Design

Always start with mobile styles and use responsive prefixes:

```tsx
// ✅ Good
className="text-2xl sm:text-3xl lg:text-4xl"
className="p-4 sm:p-6 lg:p-8"

// ❌ Bad
className="text-4xl lg:text-2xl"  // Desktop-first
```

### Touch Targets

Ensure all interactive elements meet the 44px minimum:

```tsx
className="min-h-[44px] min-w-[44px] touch-manipulation"
```

### Accessibility

- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure sufficient color contrast
- Support keyboard navigation
- Respect `prefers-reduced-motion`

### Performance

- Use GPU-accelerated transforms for animations
- Remove `will-change` after animations complete
- Use `backdrop-blur` sparingly (performance impact)
- Optimize images and use Next.js Image component

### Consistency

- Use design tokens from this document
- Follow component patterns
- Maintain consistent spacing scales
- Use semantic color names (e.g., `destructive` instead of `red-600`)

---

## Icon Specifications

### Icon Sizes

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `w-3 h-3` | 0.75rem | 12px | Small inline icons |
| `w-4 h-4` | 1rem | 16px | Standard inline icons |
| `w-5 h-5` | 1.25rem | 20px | Medium icons (most common) |
| `w-6 h-6` | 1.5rem | 24px | Large icons |
| `w-8 h-8` | 2rem | 32px | Extra large icons |
| `w-10 h-10` | 2.5rem | 40px | Hero icons |

### Icon Libraries

- **Lucide React** - Primary icon library
- **Heroicons** - Secondary (SVG paths)
- **ViewBox**: `0 0 24 24` - Standard viewbox

### Icon Stroke Width

- `strokeWidth={2}` - Standard stroke
- `strokeWidth={2.5}` - Thicker stroke (logo)

---

## Animation Best Practices

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### GPU Acceleration

Use transforms for smooth animations:

```tsx
className="transform transition-transform duration-300 hover:scale-105"
className="gpu-accelerated"
```

### Animation Delays

Use staggered delays for list items:

```tsx
style={{
  animationDelay: `${index * 75}ms`,
  animationFillMode: 'both'
}}
```

---

## Summary

This document provides a comprehensive reference for all UI styles in the Wheely Partner application. When creating new components or modifying existing ones, refer to this guide to maintain consistency with the design system.

For component-specific patterns, see the [Component-Specific Styles](#component-specific-styles) section. For responsive design patterns, see the [Responsive Breakpoints](#responsive-breakpoints) section.

---

**Last Updated**: January 2026
**Maintained By**: Development Team
