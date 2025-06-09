import { NextResponse } from 'next/server';

export async function GET() {
  const authRequired = process.env.AUTH_REQUIRED === 'true';
  
  return NextResponse.json({ 
    authRequired,
    message: authRequired ? 'Authentication required' : 'Authentication disabled'
  });
} 