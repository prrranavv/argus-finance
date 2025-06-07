import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE() {
  try {
    // Delete all transactions first (due to foreign key constraints)
    await prisma.transaction.deleteMany({});
    
    // Then delete all statements
    await prisma.statement.deleteMany({});

    return NextResponse.json({ 
      success: true, 
      message: 'All statements and transactions cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing all statements:', error);
    return NextResponse.json(
      { error: 'Failed to clear statements' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 