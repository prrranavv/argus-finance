const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Legacy decryption function (for migrating existing tokens)
function decryptLegacyToken(encryptedText) {
  if (!encryptionKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY is required for legacy token decryption');
  }

  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  
  // Check if this is a new format (with IV) or old format (without IV)
  const textParts = encryptedText.split(':');
  
  if (textParts.length === 2) {
    // New format: IV:encryptedData
    try {
      const iv = Buffer.from(textParts[0], 'hex');
      const encryptedData = textParts[1];
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.log('Failed to decrypt with new format, trying old format...');
      // Fall through to old format
    }
  }
  
  // Old format: encrypted data without IV (legacy encryption used a default IV of zeros)
  try {
    const iv = Buffer.alloc(16, 0); // 16-byte zero IV matches legacy createCipher behaviour
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt with both old and new formats:', error);
    throw new Error('Failed to decrypt token - invalid format');
  }
}

// Store token in Supabase Vault
async function storeTokenInVault(tokenValue, tokenName, userId, integrationType) {
  try {
    const { data, error } = await supabase
      .from('vault.secrets')
      .insert({
        name: `${integrationType}_${tokenName}_${userId}`,
        description: `${integrationType} ${tokenName} for user ${userId}`,
        secret: tokenValue,
        key_id: null // Use default encryption key
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error(`Error storing ${tokenName} in vault:`, error);
    throw error;
  }
}

// Migrate a single integration
async function migrateIntegration(integration) {
  console.log(`🔄 Migrating ${integration.integration_type} integration for user ${integration.user_id}...`);
  
  const updates = {};
  let migratedTokens = 0;

  try {
    // Migrate access_token
    if (integration.access_token_encrypted && !integration.access_token_vault_id) {
      try {
        const decryptedToken = decryptLegacyToken(integration.access_token_encrypted);
        const vaultId = await storeTokenInVault(
          decryptedToken, 
          'access_token', 
          integration.user_id, 
          integration.integration_type
        );
        updates.access_token_vault_id = vaultId;
        migratedTokens++;
        console.log(`  ✅ Migrated access_token to vault (ID: ${vaultId})`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate access_token:`, error.message);
      }
    }

    // Migrate refresh_token (Gmail)
    if (integration.refresh_token_encrypted && !integration.refresh_token_vault_id) {
      try {
        const decryptedToken = decryptLegacyToken(integration.refresh_token_encrypted);
        const vaultId = await storeTokenInVault(
          decryptedToken, 
          'refresh_token', 
          integration.user_id, 
          integration.integration_type
        );
        updates.refresh_token_vault_id = vaultId;
        migratedTokens++;
        console.log(`  ✅ Migrated refresh_token to vault (ID: ${vaultId})`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate refresh_token:`, error.message);
      }
    }

    // Migrate access_token_secret (Splitwise OAuth 1.0a)
    if (integration.access_token_secret_encrypted && !integration.access_token_secret_vault_id) {
      try {
        const decryptedToken = decryptLegacyToken(integration.access_token_secret_encrypted);
        const vaultId = await storeTokenInVault(
          decryptedToken, 
          'access_token_secret', 
          integration.user_id, 
          integration.integration_type
        );
        updates.access_token_secret_vault_id = vaultId;
        migratedTokens++;
        console.log(`  ✅ Migrated access_token_secret to vault (ID: ${vaultId})`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate access_token_secret:`, error.message);
      }
    }

    // Update the integration record with vault IDs
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('user_integrations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`  ✅ Updated integration record with ${migratedTokens} vault references`);
      return { success: true, migratedTokens };
    } else {
      console.log(`  ℹ️ No tokens to migrate for this integration`);
      return { success: true, migratedTokens: 0 };
    }

  } catch (error) {
    console.error(`  ❌ Failed to migrate integration:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main migration function
async function migrateAllTokensToVault() {
  try {
    console.log('🔐 Starting migration to Supabase Vault...\n');

    // Get all integrations that need migration
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select('*')
      .or('access_token_encrypted.not.is.null,refresh_token_encrypted.not.is.null,access_token_secret_encrypted.not.is.null');

    if (error) {
      throw error;
    }

    if (!integrations || integrations.length === 0) {
      console.log('ℹ️ No integrations found that need migration');
      return;
    }

    console.log(`📋 Found ${integrations.length} integrations to process\n`);

    let totalMigrated = 0;
    let totalFailed = 0;
    let totalTokensMigrated = 0;

    // Process each integration
    for (const integration of integrations) {
      const result = await migrateIntegration(integration);
      
      if (result.success) {
        totalMigrated++;
        totalTokensMigrated += result.migratedTokens;
      } else {
        totalFailed++;
      }
      
      console.log(''); // Add spacing between integrations
    }

    // Show final summary
    console.log('🎉 Migration Summary:');
    console.log(`✅ Integrations successfully migrated: ${totalMigrated}`);
    console.log(`❌ Integrations failed: ${totalFailed}`);
    console.log(`🔑 Total tokens migrated to vault: ${totalTokensMigrated}`);
    console.log(`📊 Total integrations processed: ${integrations.length}\n`);

    // Check migration status
    console.log('📊 Checking migration status...');
    const { data: statusData, error: statusError } = await supabase
      .rpc('check_vault_migration_status');

    if (statusError) {
      console.error('Error checking migration status:', statusError);
    } else if (statusData && statusData.length > 0) {
      const status = statusData[0];
      console.log(`Total integrations: ${status.total_integrations}`);
      console.log(`Migrated to vault: ${status.migrated_to_vault}`);
      console.log(`Pending migration: ${status.pending_migration}`);
      console.log(`Migration complete: ${status.migration_complete ? '✅' : '❌'}\n`);
      
      if (status.migration_complete) {
        console.log('🎯 Next steps:');
        console.log('1. Update your application code to use Supabase Vault');
        console.log('2. Test all integrations thoroughly');
        console.log('3. Once confirmed working, run cleanup_encrypted_columns() in SQL');
        console.log('4. Remove TOKEN_ENCRYPTION_KEY from environment variables');
      } else {
        console.log('⚠️ Migration not complete. Some integrations may need manual attention.');
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateAllTokensToVault()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  migrateAllTokensToVault,
  migrateIntegration,
  storeTokenInVault,
  decryptLegacyToken
}; 