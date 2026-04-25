// ─── PURE JS PURGE SCRIPT ─────────────────────────────────────────────────────
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, remove } = require('firebase/database');
const fs = require('fs');
const path = require('path');

// Read env from frontend/.env.local
const envFile = fs.readFileSync(path.join(__dirname, '../frontend/.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

console.log('⏳ PURGING ALL FIREBASE DATA AT:', firebaseConfig.databaseURL);

remove(ref(database, '/')).then(() => {
    console.log('✅ DATABASE FULLY PURGED. EVERYTHING IS GONE.');
    process.exit(0);
}).catch(err => {
    console.error('❌ PURGE FAILED:', err);
    process.exit(1);
});
