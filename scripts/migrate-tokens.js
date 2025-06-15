const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !encryptionKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('TOKEN_ENCRYPTION_KEY:', encryptionKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Old decryption function (without IV)
function decryptOld(encryptedText) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// New encryption function (with IV)
function encryptNew(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

async function migrateTokens() {
  try {
    console.log('🔄 Starting token migration...');
    
    // Get all user integrations with encrypted tokens
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select('*')
      .not('access_token', 'is', null);
    
    if (error) {
      throw error;
    }
    
    console.log(`📋 Found ${integrations.length} integrations to migrate`);
    
    let migrated = 0;
    let failed = 0;
    
    for (const integration of integrations) {
      try {
        console.log(`🔄 Migrating ${integration.integration_type} for user ${integration.user_id}...`);
        
        const updates = {};
        
        // Migrate access_token
        if (integration.access_token) {
          try {
            // Try to decrypt with old method
            const decryptedAccessToken = decryptOld(integration.access_token);
            // Re-encrypt with new method
            updates.access_token = encryptNew(decryptedAccessToken);
            console.log(`  ✅ Migrated access_token`);
          } catch (error) {
            console.log(`  ⚠️ access_token might already be in new format or invalid`);
          }
        }
        
        // Migrate refresh_token (for Gmail)
        if (integration.refresh_token) {
          try {
            const decryptedRefreshToken = decryptOld(integration.refresh_token);
            updates.refresh_token = encryptNew(decryptedRefreshToken);
            console.log(`  ✅ Migrated refresh_token`);
          } catch (error) {
            console.log(`  ⚠️ refresh_token might already be in new format or invalid`);
          }
        }
        
        // Migrate access_token_secret (for Splitwise OAuth 1.0a)
        if (integration.access_token_secret) {
          try {
            const decryptedSecret = decryptOld(integration.access_token_secret);
            updates.access_token_secret = encryptNew(decryptedSecret);
            console.log(`  ✅ Migrated access_token_secret`);
          } catch (error) {
            console.log(`  ⚠️ access_token_secret might already be in new format or invalid`);
          }
        }
        
        // Update the database if we have any updates
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('user_integrations')
            .update(updates)
            .eq('id', integration.id);
          
          if (updateError) {
            throw updateError;
          }
          
          migrated++;
          console.log(`  ✅ Successfully migrated integration ${integration.id}`);
        } else {
          console.log(`  ℹ️ No tokens to migrate for integration ${integration.id}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Failed to migrate integration ${integration.id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total processed: ${integrations.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateTokens(); 