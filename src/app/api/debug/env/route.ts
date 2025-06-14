import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow this in development or for debugging
  if (process.env.NODE_ENV === 'production' && !process.env.DEBUG_MODE) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_REGION: process.env.VERCEL_REGION,
    VERCEL_ENV: process.env.VERCEL_ENV,
    // Don't expose sensitive data
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(envInfo);
} 