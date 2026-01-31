# Wheely Admin DB - Design System Tokens

## Color Palette

### Primary Colors (Blue Gradient)
- **blue-600**: `#2563EB` - Used in gradients, icons
- **blue-700**: `#1D4ED8` - Primary gradient start
- **blue-800**: `#1E40AF` - Primary gradient middle
- **blue-900**: `#1E3A8A` - Primary gradient end, text gradients
- **indigo-800**: `#4F46E5` - Gradient accent

### Status Colors
- **green-500**: `#10B981` - Success, available status, status dots
- **green-600**: `#059669` - Darker green accents
- **green-100**: `#D1FAE5` - Light green backgrounds
- **green-700**: `#047857` - Green text on light backgrounds
- **green-200**: `#A7F3D0` - Green borders

- **yellow-500**: `#EAB308` - Pending status
- **yellow-100**: `#FEF3C7` - Light yellow backgrounds
- **yellow-700**: `#A16207` - Yellow text
- **yellow-200**: `#FDE68A` - Yellow borders

- **orange-500**: `#F97316` - Warnings, stats
- **orange-100**: `#FFEDD5` - Light orange backgrounds
- **orange-700**: `#C2410C` - Orange text
- **orange-200**: `#FED7AA` - Orange borders

- **red-500**: `#EF4444` - Errors, cancelled status
- **red-600**: `#DC2626` - Darker red
- **red-100**: `#FEE2E2` - Light red backgrounds
- **red-700**: `#B91C1C` - Red text
- **red-200**: `#FECACA` - Red borders

- **purple-500**: `#A855F7` - Calendar, analytics
- **purple-100**: `#F3E8FF` - Light purple backgrounds
- **purple-700**: `#7E22CE` - Purple text
- **purple-200**: `#E9D5FF` - Purple borders

### Neutral Colors
- **white**: `#FFFFFF` - Primary backgrounds, cards
- **gray-50**: `#F9FAFB` - Section backgrounds, disabled states
- **gray-100**: `#F3F4F6` - Light backgrounds, borders
- **gray-200**: `#E5E7EB` - Borders, dividers
- **gray-300**: `#D1D5DB` - Lighter borders
- **gray-400**: `#9CA3AF` - Icons, secondary text
- **gray-500**: `#6B7280` - Muted text
- **gray-600**: `#4B5563` - Secondary text
- **gray-700**: `#374151` - Body text, labels
- **gray-900**: `#111827` - Primary text, headings

### Background Blobs (Login Page)
- **blue-700**: `#1D4ED8` with `opacity: 20%` and `blur-xl`
- **blue-800**: `#1E40AF` with `opacity: 20%` and `blur-xl`
- **indigo-800**: `#4F46E5` with `opacity: 20%` and `blur-xl`

### Gradient Combinations
- **Primary Button**: `from-blue-700 via-blue-800 to-blue-900`
- **Logo**: `from-blue-600 via-blue-700 to-indigo-800`
- **Header Backgrounds**: `from-blue-900 via-blue-800 to-indigo-900`
- **Text Gradient**: `from-blue-900 via-blue-800 to-indigo-900` with `bg-clip-text`

---

## Typography

### Font Families
- **Primary Font**: `Figtree` (Google Fonts) - Applied to:
  - Body text
  - Headings (h1-h6)
  - Buttons
  - Labels
  - Fallback: Apple/system UI font stack

- **System Fonts** (fallback and for inputs): 
  ```
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
  'Helvetica Neue', Arial, sans-serif
  ```
  
- **Monospace Fonts** (for code):
  ```
  'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 
  Consolas, 'Courier New', monospace
  ```

### Font Sizes
- **text-xs**: `0.75rem` (12px) - Labels, badges, small text
- **text-sm**: `0.875rem` (14px) - Secondary text, descriptions
- **text-base**: `1rem` (16px) - Body text, button text
- **text-lg**: `1.125rem` (18px) - Subheadings
- **text-xl**: `1.25rem` (20px) - Section headings
- **text-2xl**: `1.5rem` (24px) - Page titles (mobile)
- **text-3xl**: `1.875rem` (30px) - Page titles (tablet)
- **text-4xl**: `2.25rem` (36px) - Large headings
- **text-5xl**: `3rem` (48px) - Hero text (mobile)
- **text-6xl**: `3.75rem` (60px) - Hero text (desktop)

### Font Weights
- **font-medium**: `500` - Buttons, labels
- **font-semibold**: `600` - Badges, stats
- **font-bold**: `700` - Headings, important text

### Line Heights
- **leading-tight**: `1.25` - Headings
- **leading-normal**: `1.5` - Body text (default)
- **leading-relaxed**: `1.625` - Long-form text

### Letter Spacing
- **tracking-wide**: `0.025em` - Uppercase labels

---

## Spacing System

### Padding
- **p-2**: `0.5rem` (8px)
- **p-3**: `0.75rem` (12px)
- **p-4**: `1rem` (16px) - Standard card padding (mobile)
- **p-5**: `1.25rem` (20px)
- **p-6**: `1.5rem` (24px) - Standard card padding (desktop)
- **p-8**: `2rem` (32px) - Large containers
- **p-10**: `2.5rem` (40px) - Extra large containers
- **p-12**: `3rem` (48px) - Empty states

### Padding (Responsive)
- **px-4 sm:px-6 lg:px-8**: `1rem / 1.5rem / 2rem` - Horizontal padding
- **py-3 sm:py-4**: `0.75rem / 1rem` - Vertical padding
- **py-4 sm:py-6 lg:py-8**: `1rem / 1.5rem / 2rem` - Vertical padding

### Margin
- **mb-1**: `0.25rem` (4px)
- **mb-2**: `0.5rem` (8px)
- **mb-3**: `0.75rem` (12px)
- **mb-4**: `1rem` (16px)
- **mb-6**: `1.5rem` (24px)
- **gap-2**: `0.5rem` (8px) - Small gaps
- **gap-3**: `0.75rem` (12px) - Standard gaps
- **gap-4**: `1rem` (16px) - Medium gaps
- **gap-6**: `1.5rem` (24px) - Large gaps

### Gap (Responsive)
- **gap-3 sm:gap-4 lg:gap-6**: `0.75rem / 1rem / 1.5rem`
- **gap-2 sm:gap-3**: `0.5rem / 0.75rem`

---

## Border Radius

- **rounded-lg**: `0.5rem` (8px) - Standard buttons, inputs
- **rounded-xl**: `0.75rem` (12px) - Cards, larger buttons
- **rounded-2xl**: `1rem` (16px) - Large cards, modals
- **rounded-3xl**: `1.5rem` (24px) - Extra large cards, login form
- **rounded-full**: `9999px` - Pills, badges, status dots
- **rounded-t-full**: Top corners only (for active nav indicators)
- **rounded-t-3xl**: Top corners `1.5rem` (mobile modals)

---

## Borders

### Border Width
- **border**: `1px` - Standard borders
- **border-2**: `2px` - Thicker borders (inputs, cards)
- **border-t-2**: `2px` top border only

### Border Colors
- **border-gray-100**: `#F3F4F6` - Light borders
- **border-gray-200**: `#E5E7EB` - Standard borders
- **border-gray-300**: `#D1D5DB` - Hover borders
- **border-white**: `#FFFFFF` - White borders (status dots)
- **border-blue-600**: `#2563EB` - Focus borders
- **border-red-200**: `#FECACA` - Error borders
- **border-green-200**: `#A7F3D0` - Success borders
- **border-yellow-200**: `#FDE68A` - Warning borders

---

## Shadows

- **shadow-sm**: `0 1px 2px 0 rgb(0 0 0 / 0.05)` - Subtle shadows
- **shadow-md**: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` - Medium shadows
- **shadow-lg**: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` - Large shadows
- **shadow-xl**: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` - Extra large shadows
- **shadow-2xl**: `0 25px 50px -12px rgb(0 0 0 / 0.25)` - Maximum shadows (modals, login card)

### Shadow on Hover
- **hover:shadow-xl**: Elevates on hover
- **hover:shadow-lg**: Moderate elevation

---

## Sizing

### Width
- **w-3**: `0.75rem` (12px) - Small icons, status dots
- **w-4**: `1rem` (16px) - Standard icons
- **w-5**: `1.25rem` (20px) - Medium icons
- **w-6**: `1.5rem` (24px) - Large icons
- **w-8**: `2rem` (32px) - Extra large icons
- **w-10**: `2.5rem` (40px) - Container icons
- **w-11**: `2.75rem` (44px) - Logo size
- **w-12**: `3rem` (48px) - Large containers
- **w-16**: `4rem` (64px) - Avatar sizes
- **w-20**: `5rem` (80px) - Large avatars
- **w-24**: `6rem` (96px) - Extra large elements
- **w-full**: `100%` - Full width
- **w-80**: `20rem` (320px) - Blob sizes

### Height
- **h-1**: `0.25rem` (4px) - Thin indicators
- **h-3**: `0.75rem` (12px) - Status dots
- **h-4**: `1rem` (16px) - Small icons
- **h-5**: `1.25rem` (20px) - Standard icons
- **h-6**: `1.5rem` (24px) - Large icons
- **h-8**: `2rem` (32px) - Extra large icons
- **h-9**: `2.25rem` (36px) - Avatar sizes
- **h-10**: `2.5rem` (40px) - Container icons
- **h-11**: `2.75rem` (44px) - Logo size
- **h-12**: `3rem` (48px) - Large containers
- **h-14**: `3.5rem` (56px) - Extra large containers
- **h-16**: `4rem` (64px) - Avatar sizes, mobile nav
- **h-20**: `5rem` (80px) - Large avatars
- **h-24**: `6rem` (96px) - Extra large elements
- **h-40**: `10rem` (160px) - Card images
- **h-48**: `12rem` (192px) - Large card images
- **h-full**: `100%` - Full height
- **h-screen**: `100vh` - Full viewport height
- **min-h-screen**: `100vh` - Minimum full height
- **min-h-[44px]**: `44px` - Touch target minimum

### Square Sizes
- **w-3 h-3**: `12px × 12px` - Status dots
- **w-5 h-5**: `20px × 20px` - Standard icons
- **w-8 h-8**: `32px × 32px` - Medium icons
- **w-9 h-9**: `36px × 36px` - Avatar sizes
- **w-10 h-10**: `40px × 40px` - Container icons
- **w-11 h-11**: `44px × 44px` - Logo
- **w-12 h-12**: `48px × 48px` - Large icons
- **w-16 h-16**: `64px × 64px` - Avatars
- **w-20 h-20**: `80px × 80px` - Large avatars
- **w-24 h-24**: `96px × 96px` - Extra large elements

---

## Z-Index Layers

- **z-10**: `10` - Dropdowns, tooltips
- **z-20**: `20` - Overlays
- **z-40**: `40` - Backdrops
- **z-50**: `50` - Modals, mobile nav, toasts

---

## Opacity

- **opacity-10**: `0.1` - Very subtle overlays
- **opacity-20**: `0.2` - Background patterns
- **opacity-50**: `0.5` - Disabled states, overlays
- **opacity-80**: `0.8` - Semi-transparent backgrounds
- **/80**: `80%` opacity (e.g., `bg-red-50/80`)

---

## Backdrop Effects

- **backdrop-blur-sm**: `blur(4px)` - Subtle blur
- **mix-blend-multiply**: Multiply blend mode (for blobs)

---

## Transitions & Animations

### Transition Duration
- **duration-150**: `150ms` - Global default
- **duration-200**: `200ms` - Button interactions
- **duration-300**: `300ms` - Card hovers, page transitions
- **duration-500**: `500ms` - Background animations

### Transition Timing
- **ease-out**: `cubic-bezier(0, 0, 0.2, 1)` - Standard easing
- **cubic-bezier(0.4, 0, 0.2, 1)**: Custom easing

### Transform Values
- **translate-y-0**: `translateY(0)`
- **-translate-y-1**: `translateY(-0.25rem)` - Hover lift
- **-translate-y-0.5**: `translateY(-0.125rem)` - Subtle lift
- **translate-x-1**: `translateX(0.25rem)` - Icon slide
- **scale-95**: `scale(0.95)` - Active press
- **scale-105**: `scale(1.05)` - Hover scale
- **scale-110**: `scale(1.1)` - Icon hover
- **scale-150**: `scale(1.5)` - Background effects

### Animation Durations
- **0.2s**: Scale fade (modals)
- **0.3s**: Fade in, slide in
- **2s**: Pulse animation
- **7s**: Blob animation (infinite)

### Animation Delays
- **animation-delay-2000**: `2s`
- **animation-delay-4000**: `4s`
- **animate-delay-100**: `0.1s`
- **animate-delay-200**: `0.2s`
- **animate-delay-300**: `0.3s`

---

## Grid System

### Grid Columns
- **grid-cols-1**: Single column (mobile)
- **sm:grid-cols-2**: 2 columns (tablet)
- **lg:grid-cols-3**: 3 columns (desktop)
- **lg:grid-cols-4**: 4 columns (large desktop)

### Max Widths
- **max-w-md**: `28rem` (448px) - Forms, modals
- **max-w-3xl**: `48rem` (768px) - Large modals
- **max-w-5xl**: `64rem` (1024px) - Extra large modals
- **max-w-7xl**: `80rem` (1280px) - Page containers

---

## Icon Specifications

### Icon Sizes
- **w-3 h-3**: `12px` - Small inline icons
- **w-4 h-4**: `16px` - Standard inline icons
- **w-5 h-5**: `20px` - Medium icons (most common)
- **w-6 h-6**: `24px` - Large icons
- **w-8 h-8**: `32px` - Extra large icons
- **w-10 h-10**: `40px` - Hero icons

### Icon Stroke Width
- **strokeWidth={2}**: Standard stroke
- **strokeWidth={2.5}**: Thicker stroke (logo)

### Icon Library
- **Lucide React** - Primary icon library
- **Heroicons** - Secondary (SVG paths)
- **ViewBox**: `0 0 24 24` - Standard viewbox

---

## Component-Specific Tokens

### Buttons
- **Padding**: `px-4 py-2.5` (mobile) / `px-6 py-3` (desktop)
- **Border Radius**: `rounded-xl` (12px)
- **Font Size**: `text-sm` (14px) / `text-base` (16px)
- **Font Weight**: `font-semibold` (600) / `font-bold` (700)
- **Min Height**: `min-h-[44px]` (touch target)

### Inputs
- **Padding**: `pl-12 pr-4 py-3.5` (with icon)
- **Border**: `border-2 border-gray-200`
- **Border Radius**: `rounded-xl` (12px)
- **Focus Ring**: `focus:ring-2 focus:ring-blue-600`
- **Font Size**: `text-base` (16px) - Prevents iOS zoom
- **Min Height**: `min-h-[44px]`

### Cards
- **Padding**: `p-4` (mobile) / `p-6` (desktop)
- **Border Radius**: `rounded-xl` (mobile) / `rounded-2xl` (desktop)
- **Border**: `border border-gray-200`
- **Shadow**: `shadow-sm` / `hover:shadow-xl`
- **Background**: `bg-white`

### Modals
- **Border Radius**: `rounded-none` (mobile) / `rounded-2xl` or `rounded-3xl` (desktop)
- **Shadow**: `shadow-2xl`
- **Backdrop**: `bg-black/50` or `bg-black/60` with `backdrop-blur-sm`
- **Max Height**: `max-h-screen` (mobile) / `max-h-[90vh]` or `max-h-[95vh]` (desktop)

### Status Badges
- **Padding**: `px-3 py-1.5` / `px-4 py-2`
- **Border Radius**: `rounded-full`
- **Font Size**: `text-xs` (12px) / `text-sm` (14px)
- **Font Weight**: `font-semibold` (600)

### Navigation
- **Header Height**: `h-16` (64px)
- **Mobile Nav Height**: `h-16` (64px)
- **Sticky Position**: `sticky top-0 z-50`

---

## Responsive Breakpoints

- **xs**: `375px` - Extra small phones
- **sm**: `640px` - Small tablets, large phones
- **md**: `768px` - Tablets
- **lg**: `1024px` - Desktops
- **xl**: `1280px` - Large desktops
- **2xl**: `1536px` - Extra large desktops

---

## Touch Targets

- **Minimum Size**: `44px × 44px` (iOS/Android standard)
- **Applied to**: All buttons, links, interactive elements
- **Class**: `min-h-[44px] min-w-[44px]`
- **Touch Action**: `touch-manipulation` (prevents double-tap zoom)

---

## Safe Areas (Notched Devices)

- **safe-area-inset-top**: `env(safe-area-inset-top)`
- **safe-area-inset-bottom**: `env(safe-area-inset-bottom)`
- Applied to mobile bottom navigation

---

## Performance Optimizations

- **GPU Acceleration**: `transform: translateZ(0)`
- **Will Change**: `will-change: transform, opacity`
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Animation Duration**: `0.01ms` when reduced motion preferred

---

## Layout Patterns

### Container Padding
- **Mobile**: `px-4` (16px)
- **Tablet**: `px-5` (20px) or `px-6` (24px)
- **Desktop**: `px-6` (24px) or `px-8` (32px)

### Section Spacing
- **Mobile**: `space-y-4` (16px)
- **Tablet**: `space-y-6` (24px)
- **Desktop**: `space-y-8` (32px)

### Card Grid Gaps
- **Mobile**: `gap-3` (12px)
- **Tablet**: `gap-4` (16px)
- **Desktop**: `gap-6` (24px)


