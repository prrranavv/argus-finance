import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the statement with file content
    const statement = await prisma.statement.findUnique({
      where: { id },
      select: {
        fileContent: true,
        fileType: true,
        fileName: true,
      },
    });

    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    if (!statement.fileContent) {
      return NextResponse.json(
        { error: 'File content not available' },
        { status: 404 }
      );
    }

    // Return the file content with appropriate headers
    const response = new NextResponse(statement.fileContent);
    response.headers.set('Content-Type', statement.fileType);
    response.headers.set('Content-Disposition', `inline; filename="${statement.fileName}"`);
    
    return response;

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 