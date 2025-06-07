import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const statements = await prisma.statement.findMany({
      orderBy: {
        uploadedAt: 'desc'
      },
      include: {
        transactions: true
      }
    });

    return NextResponse.json(statements);
  } catch (error) {
    console.error('Error fetching statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statements' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 