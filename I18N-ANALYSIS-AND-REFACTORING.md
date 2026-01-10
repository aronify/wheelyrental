# Internationalization (i18n) Analysis & Refactoring Guide

## Executive Summary

This document provides a complete analysis of user-facing text in the WheelyPartner codebase and a comprehensive refactoring plan to achieve full English ↔ Albanian internationalization.

**Current State:**
- ✅ Existing i18n system using TypeScript interfaces (`LanguageDictionary`)
- ✅ ~450 translation keys already defined
- ❌ ~200+ hardcoded strings found in components
- ❌ Missing validation error messages
- ❌ Missing placeholder text translations
- ❌ Missing aria-label translations

**Target State:**
- ✅ 100% of user-facing text internationalized
- ✅ All validation messages translated
- ✅ All placeholders translated
- ✅ All accessibility labels translated
- ✅ Zero hardcoded strings in UI components

## Analysis Results

### Files Scanned
- `app/components/domain/**/*.tsx` (all domain components)
- `app/components/ui/**/*.tsx` (all UI components)
- `lib/server/data/**/*.ts` (server actions with user-facing errors)

### Hardcoded Strings Found

#### 1. Validation Error Messages
**Location**: `car-form-modal.tsx`, `car-edit-form.tsx`, `profile-form.tsx`

```typescript
// ❌ BEFORE (Hardcoded)
errors.pickupLocations = 'At least one pickup location is required'
errors.dropoffLocations = 'At least one drop-off location is required'
setImageError('Image is too large. Please use an image smaller than 10MB.')
setImageError('Failed to save car. Try using a smaller image.')

// ✅ AFTER (Internationalized)
errors.pickupLocations = t.validationPickupLocationRequired
errors.dropoffLocations = t.validationDropoffLocationRequired
setImageError(t.validationImageTooLarge)
setImageError(t.validationImageSaveFailed)
```

#### 2. Placeholder Text
**Location**: Multiple form components

```typescript
// ❌ BEFORE (Hardcoded)
placeholder="e.g., Toyota, BMW, Mercedes"
placeholder="e.g., Corolla, X5, E-Class"
placeholder="2024"
placeholder="TR-1234-AB"
placeholder="50.00"
placeholder="0.00"
placeholder="e.g., Air Conditioning, GPS, Bluetooth"

// ✅ AFTER (Internationalized)
placeholder={t.placeholderMakeExample}
placeholder={t.placeholderModelExample}
placeholder={t.placeholderYear}
placeholder={t.placeholderLicensePlate}
placeholder={t.placeholderPrice}
placeholder={t.placeholderDeposit}
placeholder={t.placeholderFeaturesExample}
```

#### 3. Aria Labels
**Location**: All interactive components

```typescript
// ❌ BEFORE (Hardcoded)
aria-label="Close"
aria-label={`Remove ${opt.label}`}
aria-label={language === 'en' ? 'Switch to Albanian' : 'Switch to English'}

// ✅ AFTER (Internationalized)
aria-label={t.ariaClose}
aria-label={t.ariaRemoveItem.replace('{label}', opt.label)}
aria-label={t.ariaSwitchLanguage}
```

#### 4. Status Messages
**Location**: Success/error toasts, notifications

```typescript
// ❌ BEFORE (Hardcoded)
'Profile updated successfully!'
'Failed to update profile'
'Location name is required'
'City is required'

// ✅ AFTER (Internationalized)
t.profileUpdateSuccess
t.profileUpdateFailed
t.validationLocationNameRequired
t.validationCityRequired
```

## Translation Key Naming Convention

### Pattern: `{category}{Context}{Action}`

**Categories:**
- `common_` - Shared across multiple pages
- `validation_` - Form validation errors
- `placeholder_` - Input placeholders
- `aria_` - Accessibility labels
- `error_` - Error messages
- `success_` - Success messages
- `button_` - Button labels
- `label_` - Form labels
- `message_` - Informational messages
- `empty_` - Empty state messages

**Examples:**
- `validation_make_required` - "Make is required"
- `placeholder_make_example` - "e.g., Toyota, BMW, Mercedes"
- `aria_close_modal` - "Close modal"
- `error_image_too_large` - "Image is too large"
- `success_profile_updated` - "Profile updated successfully"

## Refactoring Strategy

### Phase 1: Add Missing Keys (This Document)
1. ✅ Identify all hardcoded strings
2. ✅ Generate semantic translation keys
3. ✅ Create JSON translation files
4. ✅ Provide Albanian translations

### Phase 2: Update TypeScript Interface
1. Add new keys to `LanguageDictionary` interface
2. Add English translations to `translations.en`
3. Add Albanian translations to `translations.al`

### Phase 3: Refactor Components
1. Replace hardcoded strings with `t.keyName`
2. Test each component after refactoring
3. Verify translations work correctly

### Phase 4: Testing
1. Test all forms with validation
2. Test language switching
3. Test accessibility (screen readers)
4. Test on mobile devices

## Implementation Priority

### High Priority (User-Facing)
1. ✅ Validation error messages
2. ✅ Button labels
3. ✅ Form placeholders
4. ✅ Success/error toasts

### Medium Priority (UX)
1. ✅ Aria labels
2. ✅ Empty states
3. ✅ Helper text
4. ✅ Tooltips

### Low Priority (Edge Cases)
1. Console error messages (keep in English for debugging)
2. Developer comments
3. Test strings

## Files to Refactor

### Critical Files (Most Hardcoded Strings)
1. `app/components/domain/cars/car-form-modal.tsx` - ~50 hardcoded strings
2. `app/components/domain/cars/car-edit-form.tsx` - ~40 hardcoded strings
3. `app/components/domain/bookings/bookings-list.tsx` - ~30 hardcoded strings
4. `app/components/domain/profile/profile-form.tsx` - ~20 hardcoded strings
5. `app/components/domain/locations/locations-list.tsx` - ~15 hardcoded strings

### Secondary Files
1. `app/components/ui/dropdowns/city-dropdown.tsx`
2. `app/components/ui/onboarding/quick-start-guide.tsx`
3. `app/components/domain/payouts/payout-request-form.tsx`
4. `app/components/domain/reviews/reviews-list.tsx`

## Next Steps

1. **Review** the generated JSON files (`translations-en.json`, `translations-al.json`)
2. **Add** new keys to `lib/i18n/translations.ts` TypeScript interface
3. **Refactor** components one file at a time
4. **Test** after each refactoring
5. **Deploy** incrementally

---

**Generated**: January 10, 2026
**Status**: Ready for Implementation ✅
