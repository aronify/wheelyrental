# i18n Refactoring Guide - Step-by-Step Implementation

## Overview

This guide provides exact code changes needed to replace all hardcoded strings with internationalized translations. Follow this systematically, file by file.

## Step 1: Add Missing Keys to TypeScript Interface

**File**: `lib/i18n/translations.ts`

Add these new keys to the `LanguageDictionary` interface (around line 452, before the closing brace):

```typescript
  // Validation Messages
  validationPickupLocationRequired: string;
  validationDropoffLocationRequired: string;
  validationLocationNameRequired: string;
  validationCityRequired: string;
  validationExtraNameRequired: string;
  validationPriceGreaterThanZero: string;
  validationYearRequired: string;
  validationSeatsRange: string;
  validationDailyRateRequired: string;

  // Error Messages
  errorImageTooLarge: string;
  errorImageSaveFailed: string;
  errorImageCompressionFailed: string;
  errorImageLoadFailed: string;
  errorImageReadFailed: string;
  errorLocationCreateFailed: string;
  errorLocationSaveFailed: string;
  errorExtraSaveFailed: string;
  errorLocationsLoadFailed: string;
  errorPermissionDenied: string;

  // Placeholders
  placeholderMakeExample: string;
  placeholderModelExample: string;
  placeholderYear: string;
  placeholderLicensePlate: string;
  placeholderPrice: string;
  placeholderDeposit: string;
  placeholderFeaturesExample: string;
  placeholderSeats: string;
  placeholderLocationNameExample: string;
  placeholderStreetAddress: string;
  placeholderAgencyName: string;
  placeholderAgencyDescription: string;
  placeholderEmail: string;
  placeholderPhone: string;
  placeholderPostalCode: string;
  placeholderTaxId: string;
  placeholderExtraNameExample: string;
  placeholderExtraDescription: string;
  placeholderSearchCities: string;

  // Aria Labels
  ariaClose: string;
  ariaCloseModal: string;
  ariaRemoveItem: string;
  ariaSwitchLanguage: string;
  ariaSwitchToAlbanian: string;
  ariaSwitchToEnglish: string;
  ariaOpenMenu: string;
  ariaCloseMenu: string;
  ariaUserMenu: string;
  ariaMainNavigation: string;
  ariaBreadcrumb: string;

  // Success Messages
  successProfileUpdated: string;
  successLocationCreated: string;
  successExtraCreated: string;

  // Helper Text
  helperUploadMultiplePhotos: string;
  helperImageAutoCompressed: string;
  helperSelectColor: string;

  // Empty States
  emptyNoPickupLocations: string;
  emptyNoDropoffLocations: string;
  emptyNoLocationsAvailable: string;

  // Buttons
  buttonSaveLocation: string;
  buttonAddVehicle: string;
  buttonOptional: string;
```

## Step 2: Add English Translations

**File**: `lib/i18n/translations.ts`

Add these to the `en` object (around line 906, before the closing brace):

```typescript
    // Validation Messages
    validationPickupLocationRequired: "At least one pickup location is required",
    validationDropoffLocationRequired: "At least one drop-off location is required",
    validationLocationNameRequired: "Location name is required",
    validationCityRequired: "City is required",
    validationExtraNameRequired: "Extra name is required",
    validationPriceGreaterThanZero: "Price must be greater than 0",
    validationYearRequired: "Valid year is required",
    validationSeatsRange: "Valid number of seats is required (1-20)",
    validationDailyRateRequired: "Daily rate must be greater than 0",

    // Error Messages
    errorImageTooLarge: "Image is too large. Please use an image smaller than 10MB.",
    errorImageSaveFailed: "Failed to save car. Try using a smaller image.",
    errorImageCompressionFailed: "Image is still too large after compression. Please use a smaller image.",
    errorImageLoadFailed: "Failed to load image. Please try another file.",
    errorImageReadFailed: "Failed to read image file. Please try again.",
    errorLocationCreateFailed: "Failed to create location",
    errorLocationSaveFailed: "Failed to save custom location",
    errorExtraSaveFailed: "Failed to save extra",
    errorLocationsLoadFailed: "Failed to load locations",
    errorPermissionDenied: "Permission error. Please run database/rls-policies/fix-jwt-rls-defensive-complete.sql",

    // Placeholders
    placeholderMakeExample: "e.g., Toyota, BMW, Mercedes",
    placeholderModelExample: "e.g., Corolla, X5, E-Class",
    placeholderYear: "2024",
    placeholderLicensePlate: "TR-1234-AB",
    placeholderPrice: "50.00",
    placeholderDeposit: "0.00",
    placeholderFeaturesExample: "e.g., Air Conditioning, GPS, Bluetooth",
    placeholderSeats: "5",
    placeholderLocationNameExample: "e.g., Airport Terminal, Downtown Office, Hotel Lobby",
    placeholderStreetAddress: "Street address",
    placeholderAgencyName: "Enter your agency name",
    placeholderAgencyDescription: "Describe your rental agency, services, and what makes you special...",
    placeholderEmail: "contact@agency.com",
    placeholderPhone: "+355 69 123 4567",
    placeholderPostalCode: "1001",
    placeholderTaxId: "Tax ID / Registration Number",
    placeholderExtraNameExample: "e.g., GPS Navigation, Child Seat, Full Insurance",
    placeholderExtraDescription: "Brief description of the extra",
    placeholderSearchCities: "Search cities...",

    // Aria Labels
    ariaClose: "Close",
    ariaCloseModal: "Close modal",
    ariaRemoveItem: "Remove {label}",
    ariaSwitchLanguage: "Switch to {language}",
    ariaSwitchToAlbanian: "Switch to Albanian",
    ariaSwitchToEnglish: "Switch to English",
    ariaOpenMenu: "Open menu",
    ariaCloseMenu: "Close menu",
    ariaUserMenu: "User menu",
    ariaMainNavigation: "Main navigation",
    ariaBreadcrumb: "Breadcrumb",

    // Success Messages
    successProfileUpdated: "Profile updated successfully!",
    successLocationCreated: "Location created successfully",
    successExtraCreated: "Extra created successfully",

    // Helper Text
    helperUploadMultiplePhotos: "Upload multiple photos - first will be primary",
    helperImageAutoCompressed: "Images are automatically compressed",
    helperSelectColor: "Select a color",

    // Empty States
    emptyNoPickupLocations: "No pickup locations",
    emptyNoDropoffLocations: "No dropoff locations",
    emptyNoLocationsAvailable: "No locations available. Add your first location to get started.",

    // Buttons
    buttonSaveLocation: "Save Location",
    buttonAddVehicle: "Add Vehicle",
    buttonOptional: "(Optional)",
```

## Step 3: Add Albanian Translations

**File**: `lib/i18n/translations.ts`

Add these to the `al` object (around line 1360, before the closing brace):

```typescript
    // Validation Messages
    validationPickupLocationRequired: "Kërkohet të paktën një vendndodhje marrjeje",
    validationDropoffLocationRequired: "Kërkohet të paktën një vendndodhje dorëzimi",
    validationLocationNameRequired: "Emri i vendndodhjes është i detyrueshëm",
    validationCityRequired: "Qyteti është i detyrueshëm",
    validationExtraNameRequired: "Emri i shërbimit shtesë është i detyrueshëm",
    validationPriceGreaterThanZero: "Çmimi duhet të jetë më i madh se 0",
    validationYearRequired: "Kërkohet vit i vlefshëm",
    validationSeatsRange: "Kërkohet numër i vlefshëm ulësish (1-20)",
    validationDailyRateRequired: "Çmimi ditor duhet të jetë më i madh se 0",

    // Error Messages
    errorImageTooLarge: "Imazhi është shumë i madh. Ju lutemi përdorni një imazh më të vogël se 10MB.",
    errorImageSaveFailed: "Dështoi ruajtja e mjetit. Provo me një imazh më të vogël.",
    errorImageCompressionFailed: "Imazhi është ende shumë i madh pas kompresimit. Ju lutemi përdorni një imazh më të vogël.",
    errorImageLoadFailed: "Dështoi ngarkimi i imazhit. Ju lutemi provoni një skedar tjetër.",
    errorImageReadFailed: "Dështoi leximi i skedarit të imazhit. Ju lutemi provoni përsëri.",
    errorLocationCreateFailed: "Dështoi krijimi i vendndodhjes",
    errorLocationSaveFailed: "Dështoi ruajtja e vendndodhjes së personalizuar",
    errorExtraSaveFailed: "Dështoi ruajtja e shërbimit shtesë",
    errorLocationsLoadFailed: "Dështoi ngarkimi i vendndodhjeve",
    errorPermissionDenied: "Gabim leje. Ju lutemi ekzekutoni database/rls-policies/fix-jwt-rls-defensive-complete.sql",

    // Placeholders
    placeholderMakeExample: "p.sh., Toyota, BMW, Mercedes",
    placeholderModelExample: "p.sh., Corolla, X5, E-Class",
    placeholderYear: "2024",
    placeholderLicensePlate: "TR-1234-AB",
    placeholderPrice: "50.00",
    placeholderDeposit: "0.00",
    placeholderFeaturesExample: "p.sh., Ajër i Ftohtë, GPS, Bluetooth",
    placeholderSeats: "5",
    placeholderLocationNameExample: "p.sh., Terminali i Aeroportit, Zyra Qendrore, Hoxhalli i Hotelit",
    placeholderStreetAddress: "Adresa e rrugës",
    placeholderAgencyName: "Shkruani emrin e agjencisë",
    placeholderAgencyDescription: "Përshkruani agjencinë tuaj të qirasë, shërbimet dhe çfarë ju bën të veçantë...",
    placeholderEmail: "kontakt@agjencia.com",
    placeholderPhone: "+355 69 123 4567",
    placeholderPostalCode: "1001",
    placeholderTaxId: "Numri i Tatimit / Numri i Regjistrimit",
    placeholderExtraNameExample: "p.sh., GPS, Karrige për Fëmijë, Siguri me Mbulim të Plotë",
    placeholderExtraDescription: "Përshkrim i shkurtër i shërbimit shtesë",
    placeholderSearchCities: "Kërko qytete...",

    // Aria Labels
    ariaClose: "Mbyll",
    ariaCloseModal: "Mbyll modalin",
    ariaRemoveItem: "Hiq {label}",
    ariaSwitchLanguage: "Kalo në {language}",
    ariaSwitchToAlbanian: "Kalo në Shqip",
    ariaSwitchToEnglish: "Kalo në Anglisht",
    ariaOpenMenu: "Hap menunë",
    ariaCloseMenu: "Mbyll menunë",
    ariaUserMenu: "Menuja e përdoruesit",
    ariaMainNavigation: "Navigimi kryesor",
    ariaBreadcrumb: "Rruga e navigimit",

    // Success Messages
    successProfileUpdated: "Profili u përditësua me sukses!",
    successLocationCreated: "Vendndodhja u krijua me sukses",
    successExtraCreated: "Shërbimi shtesë u krijua me sukses",

    // Helper Text
    helperUploadMultiplePhotos: "Ngarko foto të shumta - e para do të jetë kryesore",
    helperImageAutoCompressed: "Imazhet kompresohen automatikisht",
    helperSelectColor: "Zgjidh një ngjyrë",

    // Empty States
    emptyNoPickupLocations: "Nuk ka vendndodhje marrjeje",
    emptyNoDropoffLocations: "Nuk ka vendndodhje dorëzimi",
    emptyNoLocationsAvailable: "Nuk ka vendndodhje të disponueshme. Shtoni vendndodhjen tuaj të parë për të filluar.",

    // Buttons
    buttonSaveLocation: "Ruaj Vendndodhjen",
    buttonAddVehicle: "Shto Mjet",
    buttonOptional: "(Opsionale)",
```

## Step 4: Refactor Components

### File 1: `app/components/domain/cars/car-form-modal.tsx`

#### BEFORE (Line ~502-506):
```typescript
if (!formData.pickupLocations || formData.pickupLocations.length === 0) {
  errors.pickupLocations = 'At least one pickup location is required'
}
if (!formData.dropoffLocations || formData.dropoffLocations.length === 0) {
  errors.dropoffLocations = 'At least one drop-off location is required'
}
```

#### AFTER:
```typescript
if (!formData.pickupLocations || formData.pickupLocations.length === 0) {
  errors.pickupLocations = t.validationPickupLocationRequired
}
if (!formData.dropoffLocations || formData.dropoffLocations.length === 0) {
  errors.dropoffLocations = t.validationDropoffLocationRequired
}
```

#### BEFORE (Line ~567-572):
```typescript
if (!formData.pickupLocations || formData.pickupLocations.length === 0) {
  errors.pickupLocations = 'At least one pickup location is required'
}
if (!formData.dropoffLocations || formData.dropoffLocations.length === 0) {
  errors.dropoffLocations = 'At least one drop-off location is required'
}
```

#### AFTER:
```typescript
if (!formData.pickupLocations || formData.pickupLocations.length === 0) {
  errors.pickupLocations = t.validationPickupLocationRequired
}
if (!formData.dropoffLocations || formData.dropoffLocations.length === 0) {
  errors.dropoffLocations = t.validationDropoffLocationRequired
}
```

#### BEFORE (Line ~219, ~223):
```typescript
setValidationErrors({ ...validationErrors, customLocation: 'Location name is required' })
// ...
setValidationErrors({ ...validationErrors, customLocation: 'City is required' })
```

#### AFTER:
```typescript
setValidationErrors({ ...validationErrors, customLocation: t.validationLocationNameRequired })
// ...
setValidationErrors({ ...validationErrors, customLocation: t.validationCityRequired })
```

#### BEFORE (Line ~666):
```typescript
setImageError('Image is too large. Please use an image smaller than 10MB.')
```

#### AFTER:
```typescript
setImageError(t.errorImageTooLarge)
```

#### BEFORE (Line ~651):
```typescript
setImageError(error instanceof Error ? error.message : 'Failed to save car. Try using a smaller image.')
```

#### AFTER:
```typescript
setImageError(error instanceof Error ? error.message : t.errorImageSaveFailed)
```

#### BEFORE (Line ~830):
```typescript
aria-label="Close"
```

#### AFTER:
```typescript
aria-label={t.ariaClose}
```

#### BEFORE (Line ~991, ~1014, ~1041, ~1066, ~1146, ~1168, ~1256, ~1276):
```typescript
placeholder="e.g., Toyota, BMW, Mercedes"
placeholder="e.g., Corolla, X5, E-Class"
placeholder="2024"
placeholder="TR-1234-AB"
placeholder="50.00"
placeholder="0.00"
placeholder="5"
placeholder="e.g., Air Conditioning, GPS, Bluetooth"
```

#### AFTER:
```typescript
placeholder={t.placeholderMakeExample}
placeholder={t.placeholderModelExample}
placeholder={t.placeholderYear}
placeholder={t.placeholderLicensePlate}
placeholder={t.placeholderPrice}
placeholder={t.placeholderDeposit}
placeholder={t.placeholderSeats}
placeholder={t.placeholderFeaturesExample}
```

#### BEFORE (Line ~1417, ~1428, ~1443):
```typescript
placeholder={t.enterLocationName || 'e.g., Airport Terminal, Downtown Office, Hotel Lobby'}
placeholder={t.enterCity || 'Select a city'}
placeholder={t.enterAddress || 'e.g., Rruga Durresit 123'}
```

#### AFTER:
```typescript
placeholder={t.placeholderLocationNameExample}
placeholder={t.enterCity}
placeholder={t.enterAddress}
```

### File 2: `app/components/domain/profile/profile-form.tsx`

#### BEFORE (Line ~285, ~302):
```typescript
placeholder="Enter your agency name"
placeholder="Describe your rental agency, services, and what makes you special..."
```

#### AFTER:
```typescript
placeholder={t.placeholderAgencyName}
placeholder={t.placeholderAgencyDescription}
```

#### BEFORE (Line ~343, ~381, ~409, ~431, ~448, ~494):
```typescript
placeholder="contact@agency.com"
placeholder="+355 69 123 4567"
placeholder="Street address"
placeholder="City"
placeholder="1001"
placeholder="Tax ID / Registration Number"
```

#### AFTER:
```typescript
placeholder={t.placeholderEmail}
placeholder={t.placeholderPhone}
placeholder={t.placeholderStreetAddress}
placeholder={t.city}
placeholder={t.placeholderPostalCode}
placeholder={t.placeholderTaxId}
```

### File 3: `app/components/domain/locations/locations-list.tsx`

#### BEFORE (Line ~206, ~221, ~232):
```typescript
placeholder="e.g., Downtown Office, Airport Terminal"
placeholder="Street address"
placeholder="Select a city"
```

#### AFTER:
```typescript
placeholder={t.placeholderLocationNameExample}
placeholder={t.placeholderStreetAddress}
placeholder={t.enterCity}
```

### File 4: `app/components/ui/dropdowns/city-dropdown.tsx`

#### BEFORE (Line ~217):
```typescript
placeholder="Search cities..."
```

#### AFTER:
```typescript
placeholder={t.placeholderSearchCities}
```

### File 5: `app/components/ui/dropdowns/multi-select-dropdown.tsx`

#### BEFORE (Line ~267):
```typescript
aria-label={`Remove ${opt.label}`}
```

#### AFTER:
```typescript
aria-label={t.ariaRemoveItem.replace('{label}', opt.label)}
```

### File 6: `app/components/domain/dashboard/dashboard-header.tsx`

#### BEFORE (Line ~162, ~174, ~192):
```typescript
aria-label={language === 'en' ? 'Switch to Albanian' : 'Switch to English'}
aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
aria-label="User menu"
```

#### AFTER:
```typescript
aria-label={language === 'en' ? t.ariaSwitchToAlbanian : t.ariaSwitchToEnglish}
aria-label={isMobileMenuOpen ? t.ariaCloseMenu : t.ariaOpenMenu}
aria-label={t.ariaUserMenu}
```

## Step 5: Testing Checklist

After refactoring each file:

- [ ] **Build Test**: Run `npm run build` - should compile without errors
- [ ] **Type Check**: Run `npm run type-check` (if available) - no TypeScript errors
- [ ] **Visual Test**: Open the page in browser, verify text appears correctly
- [ ] **Language Switch**: Toggle EN ↔ AL, verify all text changes
- [ ] **Form Validation**: Submit invalid forms, verify error messages appear
- [ ] **Accessibility**: Test with screen reader, verify aria-labels work
- [ ] **Mobile**: Test on mobile device, verify responsive behavior

## Step 6: Verification

Run this command to find any remaining hardcoded strings:

```bash
grep -r "placeholder=\"" app/components/ | grep -v "t\." | grep -v "//"
grep -r "aria-label=\"" app/components/ | grep -v "t\." | grep -v "//"
grep -r "errors\." app/components/ | grep -v "t\." | grep -v "//"
```

## Common Patterns

### Pattern 1: Fallback Strings
**BEFORE:**
```typescript
{t.someKey || 'Fallback text'}
```

**AFTER:**
```typescript
{t.someKey}
```
*(Remove fallbacks once all keys are added)*

### Pattern 2: Template Strings
**BEFORE:**
```typescript
`Remove ${opt.label}`
```

**AFTER:**
```typescript
t.ariaRemoveItem.replace('{label}', opt.label)
```

### Pattern 3: Conditional Strings
**BEFORE:**
```typescript
language === 'en' ? 'Switch to Albanian' : 'Switch to English'
```

**AFTER:**
```typescript
language === 'en' ? t.ariaSwitchToAlbanian : t.ariaSwitchToEnglish
```

## Priority Order

Refactor in this order (most user-facing first):

1. ✅ Validation error messages (users see these immediately)
2. ✅ Button labels (primary actions)
3. ✅ Form placeholders (user guidance)
4. ✅ Success/error toasts (feedback)
5. ✅ Aria labels (accessibility)
6. ✅ Helper text (secondary guidance)
7. ✅ Empty states (edge cases)

## Notes

- **Don't break existing functionality**: Test after each file
- **Keep console.logs in English**: These are for developers
- **Preserve formatting**: Keep line breaks, spacing consistent
- **Use semantic keys**: `validationPickupLocationRequired` not `error1`
- **Test both languages**: Verify Albanian translations are correct

---

**Status**: Ready for Implementation ✅
**Estimated Time**: 2-3 hours for complete refactoring
**Risk Level**: Low (incremental changes, easy to test)
