const { resetSystemState } = require('../backend/lib/db');
resetSystemState().then(() => {
    console.log('✅ DATABASE WIPED SUCCESSFULLY');
    process.exit(0);
}).catch(err => {
    console.error('❌ FAILED TO WIPE:', err);
    process.exit(1);
});
