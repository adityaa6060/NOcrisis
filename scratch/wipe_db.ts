import { resetSystemState } from '../frontend/backend/lib/db';

async function run() {
    console.log('⏳ Starting database wipe...');
    try {
        await resetSystemState();
        console.log('✅ DATABASE WIPED SUCCESSFULLY');
    } catch (err) {
        console.error('❌ WIPE FAILED:', err);
        process.exit(1);
    }
}

run();
