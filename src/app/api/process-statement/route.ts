import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processFinancialStatement } from '@/lib/file-processor';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Function to generate file hash
async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashSum = crypto.createHash('sha256');
  hashSum.update(new Uint8Array(arrayBuffer));
  return hashSum.digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a CSV, PDF, or Excel file.' },
        { status: 400 }
      );
    }

    // Generate file hash for content-based deduplication
    const fileHash = await generateFileHash(file);
    
    // Get file content as buffer for storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Check for duplicate files by name and size (fileHash disabled temporarily)
    const existingStatement = await prisma.statement.findFirst({
      where: {
        fileName: file.name,
        fileSize: file.size,
        processed: true
      },
      include: {
        transactions: true
      }
    });

    if (existingStatement) {
      // Include metadata for duplicate files too so they can show updated titles
      const metadata = existingStatement.transactions.length > 0 ? {
        bankName: existingStatement.transactions[0].bankName,
        accountType: existingStatement.transactions[0].accountType,
        dateRange: {
          start: Math.min(...existingStatement.transactions.map(t => new Date(t.date).getTime())),
          end: Math.max(...existingStatement.transactions.map(t => new Date(t.date).getTime()))
        }
      } : null;

      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'File has already been processed',
        data: {
          statementId: existingStatement.id,
          transactionCount: existingStatement.transactions.length,
          uploadedAt: existingStatement.uploadedAt,
          metadata
        },
      });
    }

    // Create statement record
    const statement = await prisma.statement.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileHash: fileHash,
        fileContent: fileBuffer,
        processed: false,
      },
    });

    try {
      // Process the file with OpenAI
      const processedData = await processFinancialStatement(file);

      // Check for duplicate transactions before inserting
      const uniqueTransactions = [];
      
      for (const transaction of processedData.transactions) {
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            date: new Date(transaction.date),
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
          }
        });

        // Only add if transaction doesn't exist
        if (!existingTransaction) {
          uniqueTransactions.push(transaction);
        }
      }

      // Save only unique transactions to database
      const transactions = await Promise.all(
        uniqueTransactions.map(transaction =>
          prisma.transaction.create({
            data: {
              date: new Date(transaction.date),
              description: transaction.description,
              amount: transaction.amount,
              closingBalance: transaction.closingBalance,
              category: transaction.category,
              type: transaction.type,
              source: file.type.includes('pdf') ? 'bank' : 'csv',
              accountType: transaction.accountType,
              bankName: transaction.bankName,
              statementId: statement.id,
            },
          })
        )
      );

      // Update statement as processed
      await prisma.statement.update({
        where: { id: statement.id },
        data: { processed: true },
      });

      const duplicatesSkipped = processedData.transactions.length - uniqueTransactions.length;

      return NextResponse.json({
        success: true,
        data: {
          statementId: statement.id,
          transactionCount: transactions.length,
          duplicatesSkipped,
          summary: processedData.summary,
          // Add metadata for updated file titles using the original processed data
          metadata: processedData.transactions.length > 0 ? {
            bankName: processedData.transactions[0].bankName,
            accountType: processedData.transactions[0].accountType,
            dateRange: {
              start: Math.min(...processedData.transactions.map(t => new Date(t.date).getTime())),
              end: Math.max(...processedData.transactions.map(t => new Date(t.date).getTime()))
            }
          } : null
        },
      });

    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      // Update statement with error status
      await prisma.statement.update({
        where: { id: statement.id },
        data: { processed: false },
      });

      return NextResponse.json(
        { 
          error: 'Failed to process file', 
          details: processingError instanceof Error ? processingError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 