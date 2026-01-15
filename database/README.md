# Database Scripts

This directory contains all database-related SQL scripts organized by purpose.

## Directory Structure

### `migrations/`
Core database schema migrations and setup scripts.

**Schema Migrations:**
- `migration-add-companies.sql` - Initial companies table setup
- `migration-enhance-companies-table.sql` - Companies table enhancements
- `migration-add-deposit-and-multiple-locations.sql` - Car deposits and locations
- `migration-create-car-locations-junction.sql` - Car-locations junction table
- `migration-create-car-extras.sql` - Car extras and extras tables

**Schema References:**
- `supabase-schema.sql` - Complete schema reference
- `supabase-storage.sql` - Storage bucket setup

**RLS Policy Fixes:**
- `fix-car-locations-rls-policies.sql` - RLS policies for car_locations table
- `fix-car-extras-rls-policies.sql` - RLS policies for car_extras table

### `rls-policies/`
Row Level Security (RLS) policies and security configurations.
- `fix-jwt-rls-defensive-complete.sql` - **CURRENT PRODUCTION** - Main RLS setup with JWT-based ownership
- `fix-locations-rls-final-working.sql` - Locations table RLS policies
- `standardize-jwt-rls-all-tables.sql` - Standardizes RLS across all tables
- `rls-security-policies.sql` - Comprehensive RLS security policies
- `rls-car-locations-policies.sql` - Car locations RLS policies
- `verify-rls-complete.sql` - RLS validation script
- `fix-company-update-owner-id.sql` - Company owner ID update utility
- `fix-hq-location-name-format.sql` - HQ location name formatting

### `utilities/`
Business logic utilities and constraints.
- `enforce-one-user-one-company.sql` - Ensures one user = one company
- `enforce-phone-write-once.sql` - Phone number write-once constraint
- `admin-update-phone.sql` - Admin function to update phone numbers
- `add-owner-id-to-companies.sql` - Adds owner_id column to companies

### `samples/`
Sample/dummy data for testing and development.
- `sample-bookings-data.sql` - Sample booking records
- `add-payout-requests.sql` - Sample payout requests

## Usage

**For Production Setup:**
1. Run migrations in order (migration-*.sql files)
2. Apply RLS policies: `rls-policies/fix-jwt-rls-defensive-complete.sql`
3. Apply RLS fixes if needed: `migrations/fix-car-locations-rls-policies.sql`, `migrations/fix-car-extras-rls-policies.sql`
4. Apply utilities: `utilities/enforce-one-user-one-company.sql`, `utilities/enforce-phone-write-once.sql`

**For Development:**
- Use sample data scripts to populate test data

## Important Notes

- Always backup your database before running scripts
- RLS policies are production-ready and should remain enabled
- Run migrations in the order they are listed above
