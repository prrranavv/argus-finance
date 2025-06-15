# 🔐 Supabase Vault Migration Guide

This guide walks you through migrating from custom token encryption to Supabase Vault for secure token storage.

## Overview

**Current System**: Custom AES-256-CBC encryption with `TOKEN_ENCRYPTION_KEY`
**New System**: Supabase Vault with managed encryption and secure key storage

## Benefits of Supabase Vault

✅ **Managed Encryption**: No need to manage encryption keys manually  
✅ **Secure Key Storage**: Keys stored outside the database  
✅ **Authenticated Encryption**: Built-in integrity protection  
✅ **Audit Trail**: Track access to secrets  
✅ **No Custom Crypto**: Eliminates custom encryption code  
✅ **Better Security**: Industry-standard encryption practices  

## Migration Steps

### Step 1: Run SQL Migration on Supabase

**What to run**: Execute the SQL script in your Supabase SQL Editor

```sql
-- Copy and paste the contents of scripts/migrate-to-supabase-vault.sql
```

**What this does**:
- Enables the `supabase_vault` extension
- Adds new vault reference columns to `user_integrations` table
- Creates migration helper functions
- Sets up indexes for performance

**Expected output**:
```
✅ Supabase Vault extension enabled
📋 Migration status and integration counts
```

### Step 2: Run Node.js Token Migration

**What to run**: Execute the migration script locally

```bash
# Set environment variables (same as your current .env.local)
export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export TOKEN_ENCRYPTION_KEY="your_current_encryption_key"

# Run the migration
node scripts/migrate-tokens-to-vault.js
```

**What this does**:
- Decrypts existing tokens using your current `TOKEN_ENCRYPTION_KEY`
- Stores decrypted tokens in Supabase Vault
- Updates `user_integrations` records with vault references
- Provides detailed migration progress and summary

**Expected output**:
```
🔐 Starting migration to Supabase Vault...
📋 Found X integrations to process

🔄 Migrating gmail integration for user abc123...
  ✅ Migrated access_token to vault (ID: vault-id-1)
  ✅ Migrated refresh_token to vault (ID: vault-id-2)
  ✅ Updated integration record with 2 vault references

🔄 Migrating splitwise integration for user def456...
  ✅ Migrated access_token to vault (ID: vault-id-3)
  ✅ Migrated access_token_secret to vault (ID: vault-id-4)
  ✅ Updated integration record with 2 vault references

🎉 Migration Summary:
✅ Integrations successfully migrated: 2
❌ Integrations failed: 0
🔑 Total tokens migrated to vault: 4
📊 Total integrations processed: 2

📊 Checking migration status...
Total integrations: 2
Migrated to vault: 2
Pending migration: 0
Migration complete: ✅

🎯 Next steps:
1. Update your application code to use Supabase Vault
2. Test all integrations thoroughly
3. Once confirmed working, run cleanup_encrypted_columns() in SQL
4. Remove TOKEN_ENCRYPTION_KEY from environment variables
```

### Step 3: Deploy Updated Application Code

**What's changed**: All API routes now use the new `vault-tokens.ts` library instead of `user-tokens.ts`

**Files updated**:
- `src/lib/vault-tokens.ts` - New vault-based token management
- `src/app/api/onboarding/integrations/route.ts` - Uses vault for new integrations
- `src/app/api/gmail/fetch-emails/route.ts` - Uses vault for Gmail tokens
- `src/app/api/gmail/download-attachment/route.ts` - Uses vault for Gmail tokens
- `src/app/api/splitwise/expenses/route.ts` - Uses vault for Splitwise tokens
- `src/app/api/splitwise/friends/route.ts` - Uses vault for Splitwise tokens
- `src/app/api/splitwise/groups/route.ts` - Uses vault for Splitwise tokens
- `src/app/api/splitwise/current-user/route.ts` - Uses vault for Splitwise tokens

**No environment changes needed**: The same OAuth credentials are still required

### Step 4: Test All Integrations

**Gmail Testing**:
```bash
# Test Gmail email fetching
curl -H "Authorization: Bearer <user_jwt>" \
     -X POST http://localhost:3000/api/gmail/fetch-emails \
     -d '{"maxMessages": 5}'
```

**Splitwise Testing**:
```bash
# Test Splitwise expenses
curl -H "Authorization: Bearer <user_jwt>" \
     http://localhost:3000/api/splitwise/expenses

# Test Splitwise friends
curl -H "Authorization: Bearer <user_jwt>" \
     http://localhost:3000/api/splitwise/friends
```

**Expected Results**:
- All API calls should work exactly as before
- No 401 "Unauthorized" errors
- Tokens should be automatically refreshed when needed
- New user onboarding should store tokens in vault

### Step 5: Clean Up Old System (Optional)

**⚠️ DESTRUCTIVE OPERATION - Only run after confirming everything works**

```sql
-- Run this in Supabase SQL Editor to remove old encrypted columns
SELECT cleanup_encrypted_columns();
```

**What this does**:
- Removes `access_token_encrypted` column
- Removes `refresh_token_encrypted` column  
- Removes `access_token_secret_encrypted` column
- Drops old encryption functions
- Frees up database storage

**After cleanup, you can**:
- Remove `TOKEN_ENCRYPTION_KEY` from environment variables
- Delete the old `src/lib/user-tokens.ts` file
- Remove the `scripts/migrate-tokens.js` file

## Troubleshooting

### Migration Script Fails

**Error**: `TOKEN_ENCRYPTION_KEY is required for legacy token decryption`
**Solution**: Ensure your current `TOKEN_ENCRYPTION_KEY` is set in environment

**Error**: `Supabase Vault extension not found`
**Solution**: Contact Supabase support to enable the vault extension for your project

**Error**: `Failed to decrypt token - invalid format`
**Solution**: Some tokens may be corrupted. Check the specific integration and re-authenticate the user

### API Routes Return 401 After Migration

**Possible causes**:
1. Vault extension not enabled
2. Migration script didn't complete successfully
3. Vault references not properly stored

**Debug steps**:
```sql
-- Check migration status
SELECT * FROM check_vault_migration_status();

-- Check specific integration
SELECT * FROM user_integrations WHERE user_id = 'user-id-here';

-- Check vault secrets
SELECT id, name, description FROM vault.secrets WHERE name LIKE '%user-id-here%';
```

### New User Onboarding Fails

**Error**: `Failed to store integration tokens`
**Solution**: Ensure vault extension is enabled and your service role key has vault permissions

## Database Schema Changes

### Before Migration
```sql
user_integrations:
- access_token_encrypted (TEXT) - AES-256-CBC encrypted
- refresh_token_encrypted (TEXT) - AES-256-CBC encrypted  
- access_token_secret_encrypted (TEXT) - AES-256-CBC encrypted
```

### After Migration
```sql
user_integrations:
- access_token_vault_id (UUID) - Reference to vault.secrets
- refresh_token_vault_id (UUID) - Reference to vault.secrets
- access_token_secret_vault_id (UUID) - Reference to vault.secrets
- access_token_encrypted (TEXT) - Legacy column (removed after cleanup)
- refresh_token_encrypted (TEXT) - Legacy column (removed after cleanup)
- access_token_secret_encrypted (TEXT) - Legacy column (removed after cleanup)
```

### Vault Tables (Managed by Supabase)
```sql
vault.secrets:
- id (UUID) - Primary key
- name (TEXT) - Human-readable name
- description (TEXT) - Description
- secret (TEXT) - Encrypted secret value
- key_id (UUID) - Encryption key reference
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

vault.decrypted_secrets:
- id (UUID) - Same as vault.secrets.id
- name (TEXT) - Same as vault.secrets.name
- decrypted_secret (TEXT) - Decrypted secret value (only accessible with proper permissions)
```

## Security Improvements

### Before (Custom Encryption)
- ❌ Manual key management
- ❌ Single encryption key for all users
- ❌ Key stored in environment variables
- ❌ No key rotation
- ❌ Custom crypto implementation
- ❌ No audit trail

### After (Supabase Vault)
- ✅ Managed key storage
- ✅ Per-secret encryption keys
- ✅ Keys stored outside database
- ✅ Automatic key rotation
- ✅ Industry-standard encryption
- ✅ Built-in audit capabilities

## Performance Impact

**Minimal performance impact**:
- Vault access is optimized by Supabase
- Tokens are cached in memory during request processing
- Database queries remain the same (just different columns)
- No additional network calls for token decryption

## Rollback Plan

If you need to rollback to the old system:

1. **Keep the old columns**: Don't run `cleanup_encrypted_columns()`
2. **Revert code changes**: Switch imports back to `user-tokens.ts`
3. **Keep `TOKEN_ENCRYPTION_KEY`**: Don't remove from environment
4. **Disable new integrations**: Temporarily disable onboarding to prevent vault-only tokens

The migration is designed to be non-destructive until you explicitly run the cleanup function.

---

## Summary

This migration provides significant security improvements while maintaining full backward compatibility. The process is designed to be safe and reversible, with comprehensive testing at each step.

**Total time estimate**: 30-60 minutes depending on the number of existing integrations

**Risk level**: Low (non-destructive until cleanup step)

**Benefits**: Enhanced security, simplified code, managed encryption, better audit capabilities 