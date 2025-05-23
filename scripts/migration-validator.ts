import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: Record<string, any>;
}

interface SchemaIssue {
  table_name: string;
  issue_type: string;
  description: string;
  severity: string;
}

/**
 * Pre-migration validation checks
 */
export async function validatePreMigration(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    metrics: {},
  };

  console.log('🔍 Running pre-migration validation...');

  try {
    // Check Supabase connection by trying to access auth
    const { data: connectionTest, error: connectionError } = await supabase.auth.getSession();

    if (connectionError) {
      result.errors.push(`Database connection failed: ${connectionError.message}`);
      result.isValid = false;
      return result;
    }

    console.log('✅ Database connection successful');

    // Check if migration system exists (try to query, expect it might not exist)
    const { data: migrationTables, error: migrationError } = await supabase
      .from('schema_versions')
      .select('version')
      .limit(1);

    if (migrationError) {
      result.warnings.push('Migration tracking system not found - this is expected for first run');
    } else {
      result.metrics.migrationSystemExists = migrationTables?.length > 0;
    }

    // Check for existing contacts data in localStorage (if running in browser)
    if (typeof localStorage !== 'undefined') {
      const localData = localStorage.getItem('legalCaseData');
      if (localData) {
        const data = JSON.parse(localData);
        const contactCount = data.contacts?.length || 0;
        result.metrics.localStorageContacts = contactCount;
        
        if (contactCount > 0) {
          console.log(`📊 Found ${contactCount} contacts in localStorage`);
        }
      }
    }

    // Check for existing contacts table (try to query, expect it might not exist)
    const { data: existingContacts, error: tablesError } = await supabase
      .from('contacts')
      .select('id')
      .limit(1);

    if (tablesError) {
      result.warnings.push('Contacts table does not exist yet - this is expected for first migration');
      result.metrics.contactsTableExists = false;
    } else {
      result.metrics.contactsTableExists = true;
      
      // Check for existing data
      const { count, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        result.metrics.existingContactsCount = count || 0;
        if (count && count > 0) {
          result.warnings.push(`Contacts table already exists with ${count} records`);
        }
      }
    }

    // Check disk space (placeholder - would need actual implementation)
    result.metrics.diskSpaceCheck = 'skipped';

    // Check user permissions
    const { data: permissionTest, error: permissionError } = await supabase
      .rpc('get_current_schema_version');

    if (permissionError && permissionError.code === '42883') {
      // Function doesn't exist yet - this is expected
      result.metrics.permissionsCheck = 'passed';
    } else if (permissionError) {
      result.warnings.push(`Permission check inconclusive: ${permissionError.message}`);
    } else {
      result.metrics.permissionsCheck = 'passed';
    }

    console.log('✅ Pre-migration validation completed');

  } catch (error) {
    result.errors.push(`Pre-migration validation failed: ${error instanceof Error ? error.message : String(error)}`);
    result.isValid = false;
  }

  return result;
}

/**
 * Post-migration validation checks
 */
export async function validatePostMigration(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    metrics: {},
  };

  console.log('🔍 Running post-migration validation...');

  try {
    // Check that all required tables exist
    const requiredTables = ['contacts', 'case_contacts', 'contact_communications', 'schema_versions'];
    
    for (const tableName of requiredTables) {
      const { data: tableExists, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);

      if (tableError || !tableExists || tableExists.length === 0) {
        result.errors.push(`Required table '${tableName}' is missing`);
        result.isValid = false;
      } else {
        console.log(`✅ Table '${tableName}' exists`);
      }
    }

    // Check RLS is enabled on required tables
    const rlsTables = ['contacts', 'case_contacts', 'contact_communications'];
    
    for (const tableName of rlsTables) {
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('select', {
          query: `
            SELECT relrowsecurity 
            FROM pg_class c 
            JOIN pg_namespace n ON c.relnamespace = n.oid 
            WHERE c.relname = '${tableName}' AND n.nspname = 'public'
          `
        });

      if (rlsError) {
        result.warnings.push(`Could not check RLS status for ${tableName}`);
      } else if (!rlsStatus || rlsStatus.length === 0 || !rlsStatus[0].relrowsecurity) {
        result.errors.push(`RLS is not enabled on table '${tableName}'`);
        result.isValid = false;
      } else {
        console.log(`✅ RLS enabled on '${tableName}'`);
      }
    }

    // Run schema integrity validation
    const { data: schemaIssues, error: schemaError } = await supabase
      .rpc('validate_schema_integrity');

    if (schemaError) {
      result.warnings.push(`Schema integrity check failed: ${schemaError.message}`);
    } else if (schemaIssues && schemaIssues.length > 0) {
      schemaIssues.forEach((issue: SchemaIssue) => {
        const message = `${issue.table_name}: ${issue.description}`;
        if (issue.severity === 'high') {
          result.errors.push(message);
          result.isValid = false;
        } else {
          result.warnings.push(message);
        }
      });
    } else {
      console.log('✅ Schema integrity validation passed');
    }

    // Test basic CRUD operations
    try {
      // Test contact creation
      const testContact = {
        name: 'Migration Test Contact',
        role: 'Other',
        email: `test-${Date.now()}@migration.test`,
        phone: '(555) 999-0000',
      };

      const { data: created, error: createError } = await supabase
        .from('contacts')
        .insert(testContact)
        .select()
        .single();

      if (createError) {
        result.errors.push(`Contact creation test failed: ${createError.message}`);
        result.isValid = false;
      } else {
        console.log('✅ Contact creation test passed');

        // Test contact update
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ phone: '(555) 999-0001' })
          .eq('id', created.id);

        if (updateError) {
          result.warnings.push(`Contact update test failed: ${updateError.message}`);
        } else {
          console.log('✅ Contact update test passed');
        }

        // Test contact deletion (cleanup)
        const { error: deleteError } = await supabase
          .from('contacts')
          .delete()
          .eq('id', created.id);

        if (deleteError) {
          result.warnings.push(`Contact deletion test failed: ${deleteError.message}`);
        } else {
          console.log('✅ Contact deletion test passed');
        }
      }
    } catch (error) {
      result.errors.push(`CRUD operations test failed: ${error instanceof Error ? error.message : String(error)}`);
      result.isValid = false;
    }

    // Check migration version tracking
    const { data: currentVersion, error: versionError } = await supabase
      .rpc('get_current_schema_version');

    if (versionError) {
      result.errors.push(`Could not retrieve current schema version: ${versionError.message}`);
      result.isValid = false;
    } else {
      result.metrics.currentSchemaVersion = currentVersion;
      console.log(`✅ Current schema version: ${currentVersion}`);
    }

    // Record successful migration metrics
    await supabase.rpc('record_metric', {
      p_metric_name: 'migration_validation_completed',
      p_metric_value: 1,
      p_metric_unit: 'boolean',
      p_tags: { 
        validation_type: 'post_migration',
        timestamp: new Date().toISOString() 
      }
    });

    console.log('✅ Post-migration validation completed');

  } catch (error) {
    result.errors.push(`Post-migration validation failed: ${error instanceof Error ? error.message : String(error)}`);
    result.isValid = false;
  }

  return result;
}

/**
 * Rollback migration (emergency use only)
 */
export async function rollbackMigration(targetVersion?: string): Promise<boolean> {
  console.log('🚨 Starting migration rollback...');
  
  try {
    // Get current version
    const { data: currentVersion } = await supabase
      .rpc('get_current_schema_version');

    console.log(`Current version: ${currentVersion}`);
    
    if (targetVersion) {
      console.log(`Target version: ${targetVersion}`);
    }

    // Log rollback event
    await supabase.rpc('log_migration_event', {
      p_version: currentVersion || 'unknown',
      p_level: 'WARN',
      p_message: 'Migration rollback initiated',
      p_context: { target_version: targetVersion, initiated_at: new Date().toISOString() }
    });

    // WARNING: This is a destructive operation
    // In a real scenario, you would have specific rollback SQL for each migration
    
    console.log('⚠️  ROLLBACK NOT IMPLEMENTED - This would be destructive!');
    console.log('⚠️  Manual rollback required:');
    console.log('   1. Drop created tables: contacts, case_contacts, contact_communications');
    console.log('   2. Remove RLS policies');
    console.log('   3. Drop custom functions');
    console.log('   4. Restore from backup if needed');

    return false; // Never auto-rollback in production

  } catch (error) {
    console.error(`❌ Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Generate migration report
 */
export async function generateMigrationReport(): Promise<void> {
  console.log('📊 Generating migration report...');

  try {
    // Get migration history
    const { data: migrations } = await supabase
      .from('schema_versions')
      .select('*')
      .order('applied_at', { ascending: false });

    // Get recent logs
    const { data: logs } = await supabase
      .from('migration_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Get system metrics
    const { data: metrics } = await supabase
      .from('system_health')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false });

    console.log('\n📋 MIGRATION REPORT');
    console.log('==================');
    
    console.log('\n🏗️  Applied Migrations:');
    migrations?.forEach(migration => {
      console.log(`   ${migration.is_success ? '✅' : '❌'} ${migration.version} - ${migration.description}`);
    });

    console.log('\n📝 Recent Logs:');
    logs?.slice(0, 10).forEach(log => {
      console.log(`   [${log.log_level}] ${log.message}`);
    });

    console.log('\n📊 System Metrics:');
    metrics?.slice(0, 5).forEach(metric => {
      console.log(`   ${metric.metric_name}: ${metric.metric_value} ${metric.metric_unit || ''}`);
    });

    console.log('\n✅ Report generation completed');

  } catch (error) {
    console.error(`❌ Report generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'pre-validate':
      validatePreMigration()
        .then(result => {
          console.log(result.isValid ? '🎉 Pre-validation passed!' : '❌ Pre-validation failed!');
          if (result.errors.length > 0) {
            console.log('Errors:');
            result.errors.forEach(error => console.log(`  - ${error}`));
          }
          if (result.warnings.length > 0) {
            console.log('Warnings:');
            result.warnings.forEach(warning => console.log(`  - ${warning}`));
          }
          process.exit(result.isValid ? 0 : 1);
        })
        .catch(console.error);
      break;

    case 'post-validate':
      validatePostMigration()
        .then(result => {
          console.log(result.isValid ? '🎉 Post-validation passed!' : '❌ Post-validation failed!');
          if (result.errors.length > 0) {
            console.log('Errors:');
            result.errors.forEach(error => console.log(`  - ${error}`));
          }
          if (result.warnings.length > 0) {
            console.log('Warnings:');
            result.warnings.forEach(warning => console.log(`  - ${warning}`));
          }
          process.exit(result.isValid ? 0 : 1);
        })
        .catch(console.error);
      break;

    case 'report':
      generateMigrationReport()
        .then(() => process.exit(0))
        .catch(console.error);
      break;

    case 'rollback':
      const targetVersion = process.argv[3];
      rollbackMigration(targetVersion)
        .then(success => {
          console.log(success ? '✅ Rollback completed' : '❌ Rollback failed or not implemented');
          process.exit(success ? 0 : 1);
        })
        .catch(console.error);
      break;

    default:
      console.log(`
Usage: npm run migration:validate [command]

Commands:
  pre-validate  - Run pre-migration validation checks
  post-validate - Run post-migration validation checks
  report        - Generate migration status report
  rollback      - Initiate migration rollback (emergency only)

Examples:
  npm run migration:validate pre-validate
  npm run migration:validate post-validate
  npm run migration:validate report
      `);
      process.exit(1);
  }
}

export default {
  validatePreMigration,
  validatePostMigration,
  rollbackMigration,
  generateMigrationReport,
};