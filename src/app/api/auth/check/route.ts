import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Check if auth is required
    const authRequired = process.env.AUTH_REQUIRED === 'true';
    if (!authRequired) {
      return NextResponse.json({ authenticated: true, message: 'Authentication disabled' });
    }
    
    // Check for authentication cookie
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('argus-auth');
    
    if (authCookie && authCookie.value === 'authenticated') {
      return NextResponse.json({ authenticated: true });
    }
    
    return NextResponse.json(
      { authenticated: false, message: 'Not authenticated' },
      { status: 401 }
    );
    
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: 'Authentication check failed' },
      { status: 500 }
    );
  }
} 