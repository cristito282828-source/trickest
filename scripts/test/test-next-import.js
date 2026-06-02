// Test if Next.js modules can be resolved
const nextServer = require('next/dist/server/web/exports/index.js');
console.log('NextResponse type:', typeof nextServer.NextResponse);
console.log('NextRequest type:', typeof nextServer.NextRequest);
console.log('Available exports:', Object.keys(nextServer));
