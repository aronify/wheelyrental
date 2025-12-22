# Company-Based Car Ownership Refactoring

## Overview
This refactoring introduces company-based ownership for cars, separating business ownership (`company_id`) from technical/administrative ownership (`owner_id`). This enables clear identification of verified partners and supports multiple staff users per company.

## Database Changes

### New Tables

1. **`companies` table**
   - Stores company/partner information
   - Includes `verification_status` field: `'pending' | 'verified' | 'rejected' | 'suspended'`
   - All companies start as `'pending'` and can be verified by admins

2. **`company_members` table**
   - Many-to-many relationship between users and companies
   - Roles: `'owner' | 'admin' | 'member'`
   - Supports multiple users per company

### Schema Updates

- **`cars` table**: Added `company_id` column (nullable, references `companies.id`)
  - `owner_id`: Technical field - user who created/manages the record
  - `company_id`: Business ownership - the company that owns the car

### Migration Script

Run `database/migration-add-companies.sql` to:
1. Create `companies` and `company_members` tables
2. Add `company_id` to `cars` table
3. Migrate existing profiles to companies
4. Update RLS policies for company-based access

## Access Control Changes

### Row Level Security (RLS) Policies

**Cars:**
- Users can view cars where they are `owner_id` OR where they belong to the car's `company_id`
- Users can insert cars for their company or as owner
- Users can update cars from their company OR cars they own
- Only company owners/admins can delete company cars

**Companies:**
- Anyone can view companies (for public listings)
- Only company members with `owner` or `admin` role can update
- Authenticated users can create companies

**Company Members:**
- Users can view members of companies they belong to
- Users can add themselves to companies
- Company owners/admins can manage members

## Code Changes

### TypeScript Types

**New:** `types/company.ts`
- `Company` interface with verification status
- `CompanyMember` interface with roles

**Updated:** `types/car.ts`
- Added `companyId?: string`
- Added `company?: Company` (joined data)
- Added computed fields: `isVerified?: boolean`, `companyName?: string`

### Server Actions

**Updated:** `lib/server/data/cars-data-actions.ts`
- `addCarAction`: Automatically links car to user's company
- `updateCarAction`: Checks company membership for access
- `deleteCarAction`: Verifies user is owner OR company admin

### Frontend Queries

**Updated:** `app/cars/page.tsx`
- Queries cars with company join
- Filters by user's company membership OR owner_id
- Includes company verification status

**Updated:** `app/dashboard/page.tsx`
- Car queries now include company information

## Key Semantics

### `owner_id` vs `company_id`

- **`owner_id`**: Technical/administrative field
  - Represents the user who created or manages the car record
  - Used for access control when no company is assigned
  - Does NOT represent business ownership

- **`company_id`**: Business ownership field
  - Represents the company/partner that owns the car
  - Used for client-facing trust signals
  - Only cars with `company.verification_status = 'verified'` are shown as verified

### Verification Status

- **`pending`**: Company created but not yet verified (default)
- **`verified`**: Company verified by admin - cars show as "verified partner"
- **`rejected`**: Company verification rejected
- **`suspended`**: Company temporarily suspended

## Client-Facing Logic

### Trust Signals

- Cars are only labeled as "verified" if:
  - `company_id` is set
  - `company.verification_status === 'verified'`

- Never rely on `owner_id` for trust or verification
- Always check `company.verification_status` for client-facing displays

### Display Logic

- Company name: `car.company?.name` or `car.companyName`
- Verification badge: Show only when `car.isVerified === true`
- Partner information: Always from `companies` table, never from user account

## Migration Notes

The migration script automatically:
1. Creates a company for each existing profile
2. Links the profile's user as company owner
3. Updates existing cars to link to the new company

After migration:
- All existing cars will have a `company_id`
- All existing users will be company owners
- Companies start with `verification_status = 'pending'`
- Admins can verify companies manually

## Future Scalability

This structure supports:
- Multiple staff users per company (via `company_members`)
- Role-based permissions (owner, admin, member)
- Company-level verification independent of individual users
- Clear separation between technical and business ownership

## Testing Checklist

- [ ] Run migration script on development database
- [ ] Verify existing cars are linked to companies
- [ ] Test car creation links to user's company
- [ ] Test company member access to company cars
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test verification status display in UI
- [ ] Verify client-facing queries use company data, not owner_id



