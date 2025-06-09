import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Check if auth is required
    const authRequired = process.env.AUTH_REQUIRED === 'true';
    if (!authRequired) {
      return NextResponse.json({ success: true, message: 'Authentication disabled' });
    }
    
    // Validate password
    const correctPassword = process.env.AUTH_PASSWORD;
    if (!correctPassword) {
      return NextResponse.json(
        { error: 'Authentication not configured properly' },
        { status: 500 }
      );
    }
    
    if (password !== correctPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
    
    // Set session-only authentication cookie (expires when browser closes)
    const cookieStore = cookies();
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Authentication successful' 
    });
    
    response.cookies.set('argus-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      // No expires date = session cookie (expires when browser closes)
    });
    
    return response;
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication request failed' },
      { status: 500 }
    );
  }
} 