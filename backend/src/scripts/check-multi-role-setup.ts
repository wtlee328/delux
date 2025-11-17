/**
 * Script to check if multi-role setup is correctly configured
 * Run with: npx ts-node src/scripts/check-multi-role-setup.ts
 */

import pool from '../config/database';

async function checkSetup() {
  console.log('🔍 Checking multi-role setup...\n');

  try {
    // Check if user_roles table exists
    console.log('1. Checking if user_roles table exists...');
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_roles'
        );
      `);
      
      if (tableCheck.rows[0].exists) {
        console.log('   ✅ user_roles table exists\n');
        
        // Check table structure
        console.log('2. Checking user_roles table structure...');
        const structure = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'user_roles'
          ORDER BY ordinal_position;
        `);
        
        structure.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
        console.log('');
        
        // Check if active_role column exists in users table
        console.log('3. Checking if active_role column exists in users table...');
        const activeRoleCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'active_role'
          );
        `);
        
        if (activeRoleCheck.rows[0].exists) {
          console.log('   ✅ active_role column exists\n');
        } else {
          console.log('   ⚠️  active_role column does NOT exist\n');
        }
        
        // Check sample data
        console.log('4. Checking sample user roles data...');
        const sampleData = await pool.query(`
          SELECT u.email, u.name, u.role as primary_role, array_agg(ur.role) as all_roles
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          GROUP BY u.id, u.email, u.name, u.role
          LIMIT 5;
        `);
        
        if (sampleData.rows.length > 0) {
          console.log('   Sample users:');
          sampleData.rows.forEach(user => {
            console.log(`   - ${user.email}: primary=${user.primary_role}, all=${user.all_roles}`);
          });
        } else {
          console.log('   No users found');
        }
        console.log('');
        
      } else {
        console.log('   ❌ user_roles table does NOT exist');
        console.log('   ⚠️  You need to run the migration: npm run migrate\n');
      }
    } catch (error) {
      console.log('   ❌ Error checking user_roles table:', error);
      console.log('   ⚠️  You need to run the migration: npm run migrate\n');
    }
    
    // Check migrations table
    console.log('5. Checking migrations status...');
    try {
      const migrations = await pool.query(`
        SELECT name, executed_at 
        FROM migrations 
        ORDER BY executed_at DESC;
      `);
      
      console.log('   Executed migrations:');
      migrations.rows.forEach(mig => {
        console.log(`   - ${mig.name} (${new Date(mig.executed_at).toLocaleString()})`);
      });
      
      const hasMigration004 = migrations.rows.some(m => m.name.includes('004'));
      if (hasMigration004) {
        console.log('\n   ✅ Migration 004 (multi-role support) has been executed');
      } else {
        console.log('\n   ❌ Migration 004 (multi-role support) has NOT been executed');
        console.log('   ⚠️  Run: npm run migrate');
      }
    } catch (error) {
      console.log('   ⚠️  Could not check migrations table');
    }
    
    console.log('\n✅ Setup check complete!');
    
  } catch (error) {
    console.error('❌ Error during setup check:', error);
  } finally {
    await pool.end();
  }
}

checkSetup();
