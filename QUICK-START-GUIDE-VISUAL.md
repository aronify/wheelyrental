# Quick Start Guide - Visual Reference & User Guide

## 🎨 Visual Design

### Component Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  🚀 Quick Start Guide                    [33%] [X]          │ ← Header (Blue Gradient)
│  1 of 3 steps completed                                      │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │ ← Progress Bar (Mobile)
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅  Complete Your Profile                  [View →]        │ ← Completed Step (Green)
│      Add your company details to get started                 │
│                                                               │
│  ○   Add Pickup Locations                   [Add Locations]  │ ← Pending Step (Gray)
│      Set up where customers can get your cars                │
│                                                               │
│  ○   Add Your First Vehicle                 [Add Vehicle]    │ ← Pending Step (Gray)
│      List your cars to start receiving bookings              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Completion State

```
┌─────────────────────────────────────────────────────────────┐
│  🚀 Quick Start Guide                    [100%] [X]         │
│  3 of 3 steps completed                                      │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅  Complete Your Profile                  [View]          │
│  ✅  Add Pickup Locations                   [Manage]         │
│  ✅  Add Your First Vehicle                 [View Fleet]     │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ✅  🎉 All Set!                                       │  │ ← Success Banner
│  │                                                        │  │
│  │  Your profile is ready. You can now start             │  │
│  │  receiving bookings!                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Responsive Behavior

### Desktop (>= 1024px)

- **Header**: Full width with circular progress indicator
- **Steps**: Generous padding, larger icons
- **CTAs**: Inline buttons with icons
- **Layout**: Optimized for scanning

### Tablet (640px - 1024px)

- **Header**: Compact with simplified progress
- **Steps**: Medium padding, balanced sizing
- **CTAs**: Responsive button sizing
- **Layout**: Flexible adaptation

### Mobile (< 640px)

- **Header**: Horizontal progress bar, smaller text
- **Steps**: Compact cards, minimal padding
- **CTAs**: Full-width or stacked buttons
- **Layout**: Vertical flow, touch-optimized

## 🎯 User Interactions

### 1. Expand/Collapse

**Action**: Click anywhere on the blue header
**Result**: Content area slides up/down with smooth animation
**State**: Persists across interactions within session

### 2. Dismiss Guide

**Action**: Click [X] button in top-right corner
**Result**: Entire guide disappears with fade-out
**Persistence**: Dismissed state kept in component state (resets on page reload)
**Note**: Consider localStorage for cross-session persistence

### 3. Navigate to Steps

**Action**: Click any CTA button ("Complete Now", "Add Locations", "Add Vehicle")
**Result**: Direct navigation to relevant page
**Context**: User can complete steps out of order

### 4. Auto-Completion

**Action**: Complete final step (add first car)
**Result**: 
1. Progress updates to 100%
2. Success banner appears
3. Guide remains visible to show achievement
4. Can be manually dismissed or will auto-hide after a few seconds (future)

## 🌍 Language Examples

### English

```
Title: Quick Start Guide
Steps:
1. Complete Your Profile
2. Add Pickup Locations  
3. Add Your First Vehicle

Success: 🎉 All Set!
```

### Albanian

```
Title: Udhëzues i Shpejtë
Steps:
1. Plotëso Profilin
2. Shto Vendndodhje Marrjeje
3. Shto Mjetin e Parë

Success: 🎉 Gati!
```

## 🔄 State Transitions

### New User (0%)

```
Profile: ○ Pending
Locations: ○ Pending
Cars: ○ Pending
Progress: 0% (Red/Orange)
Message: None
```

### Profile Added (33%)

```
Profile: ✅ Complete (Green)
Locations: ○ Pending
Cars: ○ Pending
Progress: 33% (Blue)
Message: None
```

### Profile + Locations (67%)

```
Profile: ✅ Complete
Locations: ✅ Complete (Green)
Cars: ○ Pending
Progress: 67% (Blue)
Message: None
```

### All Complete (100%)

```
Profile: ✅ Complete
Locations: ✅ Complete
Cars: ✅ Complete (Green)
Progress: 100% (Blue → Green)
Message: 🎉 All Set! Your profile is ready...
Auto-hide: After 5 seconds (future enhancement)
```

## 🎨 Color Scheme

### Primary Colors

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Header Background | Blue Gradient | #1E3A8A → #1E40AF | Top bar |
| Progress Complete | Blue | #1E40AF | Progress indicator |
| Completed Step | Green | #16A34A | Check icon, background |
| Pending Step | Gray | #6B7280 | Circle icon, text |
| CTA Button | Blue | #1E40AF | Action buttons |
| Success Banner | Light Green | #DCFCE7 | Completion message |

### Hover States

| Element | Default | Hover | Active |
|---------|---------|-------|--------|
| Pending Step | Gray 50 | Blue 50 | Blue 100 |
| CTA Button | Blue 900 | Blue 800 | Blue 700 |
| Dismiss Button | White/80 | White/100 | White/100 + bg |

## 🧩 Integration Points

### Dashboard Page

**Location**: Below header, above main content
**Visibility**: Always shown if progress < 100%
**Priority**: High (appears first in content area)

```typescript
// app/dashboard/page.tsx
<main>
  <QuickStartGuide {...onboardingStatus} />
  <DashboardContent />
</main>
```

### Cars Page

**Location**: Same as dashboard
**Context**: Emphasizes "Add Your First Vehicle" step
**Behavior**: Identical to dashboard integration

```typescript
// app/cars/page.tsx
<main>
  <QuickStartGuide {...onboardingStatus} />
  <CarsPageRedesigned />
</main>
```

### Profile Page

**Consideration**: Could add here but might be redundant
**Recommendation**: Skip to avoid over-prompting
**Alternative**: Add success toast after saving profile

### Locations Page

**Consideration**: Similar to profile page
**Recommendation**: Skip to keep user focused on form
**Alternative**: Update guide dynamically after adding location

## 📊 Success Metrics (Suggested)

### Completion Rate

```
Target: 80% of new users complete within 7 days
Current: TBD (needs analytics implementation)
```

### Time to Complete

```
Target: < 24 hours from signup to 100%
Current: TBD (needs analytics implementation)
```

### Step Drop-off

```
Profile → Locations: Should be > 90%
Locations → Cars: Should be > 85%
```

### Dismissal Rate

```
Target: < 20% dismiss before completing
Current: TBD (needs analytics implementation)
```

## 🔧 Troubleshooting

### Guide Not Appearing

**Check**:
1. Is `companyId` valid?
2. Is progress already 100%?
3. Was guide dismissed in this session?
4. Are props passed correctly from page?

**Debug**:
```typescript
console.log('Onboarding Status:', {
  companyId,
  onboardingStatus,
  progress: onboardingStatus.progress
})
```

### Step Not Completing

**Profile**:
- Verify all fields filled: name, email, phone, address, city
- Check `companies` table in Supabase

**Locations**:
- Check `locations` table for company_id match
- Verify `is_active = true`

**Cars**:
- Check `cars` table for company_id match
- Verify `status = 'active'` (not 'maintenance' or 'retired')

### Progress Stuck

**Server-side**:
- Check `getOnboardingStatus()` in quick-start-helpers.ts
- Verify SQL queries returning correct data
- Test with: `SELECT * FROM locations WHERE company_id = 'XXX' AND is_active = true`

**Client-side**:
- Refresh page (progress calculated on load)
- Clear cache if needed
- Check browser console for errors

### Styling Issues

**Mobile**:
- Test on actual device, not just Chrome DevTools
- Check safe area insets (iPhone notch)
- Verify touch target sizes (min 44px)

**Desktop**:
- Test on different screen widths (1280px, 1440px, 1920px)
- Check circular progress SVG rendering
- Verify no horizontal scroll

## 📱 Testing Scenarios

### Happy Path

1. Sign up → See guide at 0%
2. Go to Profile → Fill all fields → Save
3. Return to Dashboard → See 33% progress
4. Go to Locations → Add location → Save
5. Return to Dashboard → See 67% progress
6. Go to Cars → Add car → Save
7. Return to Dashboard → See 100% + success message

### Edge Cases

1. **Skip Steps**: Go directly to Cars without Profile → Should work, progress stays 0%
2. **Multi-tab**: Open Dashboard in 2 tabs → Both show same progress (server-side)
3. **Rapid Changes**: Add car → Delete car → Guide shows pending again
4. **Partial Profile**: Fill name, email, phone but not address → Still pending
5. **Inactive Data**: Add location with `is_active = false` → Doesn't count

### Accessibility

1. **Keyboard Navigation**: Tab through all buttons, Enter to activate
2. **Screen Reader**: Reads "Quick Start Guide, 33% complete, 1 of 3 steps completed"
3. **High Contrast**: Text remains readable in high contrast mode
4. **Zoom**: Interface remains usable at 200% zoom

## 🎓 Best Practices for Partners

### Recommended Order

1. **Profile First**: Establishes company identity
2. **Locations Second**: Needed for car assignment
3. **Cars Last**: Requires locations to be useful

### Time Estimates

- **Profile**: 2-3 minutes (if info ready)
- **Locations**: 5-10 minutes (research addresses, add multiple)
- **Cars**: 5-10 minutes per car (upload photos, enter details)

### Tips for Success

✅ Have company registration docs ready
✅ Know your pickup/dropoff addresses
✅ Prepare car photos (high quality, multiple angles)
✅ Complete all steps in one session if possible
✅ Use desktop for initial setup (easier than mobile)

---

**Need Help?**
- See technical docs: `QUICK-START-GUIDE-DOCUMENTATION.md`
- Check implementation: `app/components/ui/onboarding/quick-start-guide.tsx`
- Review backend logic: `lib/server/data/quick-start-helpers.ts`
