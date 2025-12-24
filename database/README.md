# Database Scripts

This directory contains all database-related SQL scripts organized by purpose.

## Directory Structure

### `migrations/`
Database schema migrations and initial setup scripts.
- `migration-add-companies.sql` - Initial companies table setup
- `migration-enhance-companies-table.sql` - Companies table enhancements
- `migration-add-deposit-and-multiple-locations.sql` - Car deposits and locations
- `supabase-schema.sql` - Complete schema reference
- `supabase-storage.sql` - Storage bucket setup

### `rls-policies/`
Row Level Security (RLS) policies and security configurations.
- `fix-jwt-rls-defensive-complete.sql` - **CURRENT** - Main RLS setup with JWT-based ownership
- `standardize-jwt-rls-all-tables.sql` - Standardizes RLS across all tables
- `verify-rls-complete.sql` - RLS validation script
- Other fix scripts for specific table RLS issues

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

### `debug/`
Debugging and diagnostic scripts (not for production use).
- Various diagnostic queries for troubleshooting RLS, permissions, and data issues

## Usage

**For Production Setup:**
1. Run migrations in order
2. Apply RLS policies: `rls-policies/fix-jwt-rls-defensive-complete.sql`
3. Apply utilities: `utilities/enforce-one-user-one-company.sql`, `utilities/enforce-phone-write-once.sql`

**For Development:**
- Use sample data scripts to populate test data
- Debug scripts are for troubleshooting only

## Important Notes

- Always backup your database before running scripts
- RLS policies are production-ready and should remain enabled
- Debug scripts are for diagnostic purposes only


