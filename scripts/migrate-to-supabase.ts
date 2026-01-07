/**
 * Firebase to Supabase Migration Script
 * 
 * This script migrates data from Firebase Firestore to Supabase PostgreSQL.
 * 
 * IMPORTANT: Before running this script:
 * 1. Make sure Supabase tables are created (run supabase/schema.sql)
 * 2. Update .env.local with correct Supabase credentials
 * 3. Run: npx ts-node --project tsconfig.json scripts/migrate-to-supabase.ts
 */

// Import Firebase (old database)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query } from "firebase/firestore";

// Import Supabase (new database)
import { createClient } from '@supabase/supabase-js';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ============================================
// CONFIGURATION
// ============================================

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp);

// Initialize Supabase Admin Client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// MIGRATION FUNCTIONS
// ============================================

async function migrateUsers() {
    console.log('\n🔄 Migrating users...');

    try {
        const snapshot = await getDocs(collection(db, 'users'));

        if (snapshot.empty) {
            console.log('⚠️ No users found in Firebase');
            return 0;
        }

        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                username: data.username,
                password: data.password,
                full_name: data.full_name || data.username,
                role: data.role || 'user'
            };
        });

        console.log(`📊 Found ${users.length} users to migrate`);

        // Insert to Supabase (handle duplicates)
        const { data, error } = await supabase
            .from('users')
            .upsert(users, {
                onConflict: 'username',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Error migrating users:', error);
            throw error;
        }

        console.log(`✅ Successfully migrated ${users.length} users`);
        return users.length;
    } catch (error) {
        console.error('❌ Failed to migrate users:', error);
        throw error;
    }
}

async function migrateEmployees() {
    console.log('\n🔄 Migrating employees...');

    try {
        const snapshot = await getDocs(collection(db, 'employees'));

        if (snapshot.empty) {
            console.log('⚠️ No employees found in Firebase');
            return 0;
        }

        const employees = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                emp_id: data['Emp ID'] || `EMP-${doc.id}`,
                full_name: data['FullName '] || data['FullName'] || null,
                job_title: data['Job Title'] || null,
                dept: data['Dept'] || null,
                bu: data['BU'] || null,
                dl_idl_staff: data['DL/IDL/Staff'] || null,
                location: data['Location'] || null,
                employee_type: data['Employee Type'] || null,
                line_manager: data['Line Manager'] || null,
                joining_date: data['Joining\r\n Date'] || data['Joining Date'] || null,
                raw_data: data
            };
        });

        console.log(`📊 Found ${employees.length} employees to migrate`);

        // Insert in batches (Supabase handles large inserts well)
        const batchSize = 500;
        let totalInserted = 0;

        for (let i = 0; i < employees.length; i += batchSize) {
            const batch = employees.slice(i, i + batchSize);

            const { error } = await supabase
                .from('employees')
                .upsert(batch, {
                    onConflict: 'emp_id',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error);
                throw error;
            }

            totalInserted += batch.length;
            console.log(`  📝 Migrated batch ${Math.floor(i / batchSize) + 1}: ${batch.length} employees`);
        }

        console.log(`✅ Successfully migrated ${totalInserted} employees`);
        return totalInserted;
    } catch (error) {
        console.error('❌ Failed to migrate employees:', error);
        throw error;
    }
}

async function migrateOrgchartNodes() {
    console.log('\n🔄 Migrating orgchart nodes...');

    try {
        const snapshot = await getDocs(collection(db, 'Orgchart_data'));

        if (snapshot.empty) {
            console.log('⚠️ No orgchart nodes found in Firebase');
            return 0;
        }

        const nodes = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                pid: data.pid || null,
                stpid: data.stpid || null,
                name: data.name || null,
                title: data.title || null,
                image: data.image || null,
                tags: data.tags || null,
                orig_pid: data.orig_pid || null,
                dept: data.dept || null,
                bu: data.BU || null,
                type: data.type || null,
                location: data.location || null,
                description: data.description || null,
                joining_date: data.joiningDate || null
            };
        });

        console.log(`📊 Found ${nodes.length} orgchart nodes to migrate`);

        // Insert in batches
        const batchSize = 500;
        let totalInserted = 0;

        for (let i = 0; i < nodes.length; i += batchSize) {
            const batch = nodes.slice(i, i + batchSize);

            const { error } = await supabase
                .from('orgchart_nodes')
                .upsert(batch, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error);
                throw error;
            }

            totalInserted += batch.length;
            console.log(`  📝 Migrated batch ${Math.floor(i / batchSize) + 1}: ${batch.length} nodes`);
        }

        console.log(`✅ Successfully migrated ${totalInserted} orgchart nodes`);
        return totalInserted;
    } catch (error) {
        console.error('❌ Failed to migrate orgchart nodes:', error);
        throw error;
    }
}

async function migrateCustomOrgcharts() {
    console.log('\n🔄 Migrating custom orgcharts...');

    try {
        const snapshot = await getDocs(collection(db, 'orgcharts'));

        if (snapshot.empty) {
            console.log('⚠️ No custom orgcharts found in Firebase');
            return 0;
        }

        const orgcharts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                username: data.username,
                orgchart_name: data.orgchart_name,
                description: data.describe || '',
                org_data: data.org_data || { data: [] }
            };
        });

        console.log(`📊 Found ${orgcharts.length} custom orgcharts to migrate`);

        const { error } = await supabase
            .from('custom_orgcharts')
            .upsert(orgcharts, {
                onConflict: 'id',
                ignoreDuplicates: true
            });

        if (error) {
            console.error('❌ Error migrating custom orgcharts:', error);
            throw error;
        }

        console.log(`✅ Successfully migrated ${orgcharts.length} custom orgcharts`);
        return orgcharts.length;
    } catch (error) {
        console.error('❌ Failed to migrate custom orgcharts:', error);
        throw error;
    }
}

// ============================================
// MAIN MIGRATION
// ============================================

async function runMigration() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     FIREBASE → SUPABASE MIGRATION                          ║');
    console.log('║     OrgChart TTI SHTP Project                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log('\n📋 Configuration:');
    console.log(`  Firebase Project: ${firebaseConfig.projectId}`);
    console.log(`  Supabase URL: ${supabaseUrl}`);

    // Validate credentials
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('\n❌ Missing Supabase credentials in .env.local');
        console.error('   Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    if (supabaseServiceKey.startsWith('YOUR_')) {
        console.error('\n❌ Supabase credentials are placeholders');
        console.error('   Please update .env.local with actual Supabase API keys');
        process.exit(1);
    }

    const results = {
        users: 0,
        employees: 0,
        orgchartNodes: 0,
        customOrgcharts: 0
    };

    try {
        // Run migrations in order
        results.users = await migrateUsers();
        results.employees = await migrateEmployees();
        results.orgchartNodes = await migrateOrgchartNodes();
        results.customOrgcharts = await migrateCustomOrgcharts();

        // Print summary
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║     MIGRATION COMPLETE                                      ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('\n📊 Summary:');
        console.log(`  ✅ Users:            ${results.users}`);
        console.log(`  ✅ Employees:        ${results.employees}`);
        console.log(`  ✅ Orgchart Nodes:   ${results.orgchartNodes}`);
        console.log(`  ✅ Custom Orgcharts: ${results.customOrgcharts}`);
        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('  1. Verify data in Supabase Dashboard');
        console.log('  2. Test application with new database');
        console.log('  3. Remove Firebase dependencies when ready');

    } catch (error) {
        console.error('\n❌ Migration failed with error:', error);
        console.log('\n📝 You may need to:');
        console.log('  1. Check Supabase credentials');
        console.log('  2. Ensure tables are created (run schema.sql)');
        console.log('  3. Check Firebase credentials');
        process.exit(1);
    }
}

// Run the migration
runMigration();
