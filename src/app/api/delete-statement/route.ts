import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');

    if (!statementId) {
      return NextResponse.json(
        { error: 'Statement ID is required' },
        { status: 400 }
      );
    }

    // First, get the statement to return info about what's being deleted
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: {
        transactions: true
      }
    });

    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Delete all associated transactions first (due to foreign key constraint)
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: {
        statementId: statementId
      }
    });

    // Then delete the statement
    await prisma.statement.delete({
      where: { id: statementId }
    });

    return NextResponse.json({
      success: true,
      message: `Deleted statement "${statement.fileName}" and ${deletedTransactions.count} associated transactions`,
      data: {
        statementName: statement.fileName,
        transactionsDeleted: deletedTransactions.count
      }
    });

  } catch (error) {
    console.error('Error deleting statement:', error);
    return NextResponse.json(
      { error: 'Failed to delete statement' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 