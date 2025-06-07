import { openai, MODEL_CONFIG, SYSTEM_PROMPTS } from './openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

// Zod schema for structured output - updated to include all fields OpenAI provides
const TransactionSchema = z.object({
  date: z.string().describe('Transaction date in YYYY-MM-DD format'),
  description: z.string().describe('Clean merchant/payee name'),
  amount: z.number().positive().describe('Transaction amount as positive number'),
  closingBalance: z.number().nullable().describe('Account balance after this transaction (null if not available)'),
  openingBalance: z.number().nullable().optional().describe('Account balance before this transaction'),
  runningBalance: z.number().nullable().optional().describe('Running balance during transaction'),
  type: z.enum(['income', 'expense']).describe('Transaction type'),
  category: z.string().describe('Transaction category'),
  accountType: z.enum(['Bank Account', 'Credit Card']).describe('Type of account - Bank Account or Credit Card'),
  bankName: z.enum(['Axis', 'HDFC', 'HDFC Diners', 'HDFC Swiggy', 'Axis Magnus', 'Flipkart Axis']).describe('Bank or credit card name'),
  creditLimit: z.number().nullable().optional().describe('Credit limit for credit cards'),
  dueDate: z.string().nullable().optional().describe('Due date for credit card payments'),
  rewardPoints: z.number().nullable().optional().describe('Reward points earned or balance'),
  merchantCategory: z.string().nullable().optional().describe('Merchant category code or description'),
  mode: z.string().nullable().optional().describe('Payment mode (UPI, Card, Cash, etc.)')
});

const TransactionsResponseSchema = z.object({
  transactions: z.array(TransactionSchema).describe('Array of extracted transactions')
});

export interface TransactionData {
  date: string;
  description: string;
  amount: number;
  closingBalance: number | null;
  openingBalance?: number | null;
  runningBalance?: number | null;
  type: 'income' | 'expense';
  category: string;
  accountType: 'Bank Account' | 'Credit Card';
  bankName: 'Axis' | 'HDFC' | 'HDFC Diners' | 'HDFC Swiggy' | 'Axis Magnus' | 'Flipkart Axis';
  creditLimit?: number | null;
  dueDate?: string | null;
  rewardPoints?: number | null;
  merchantCategory?: string | null;
  mode?: string | null;
}

export interface ProcessedStatement {
  transactions: TransactionData[];
  summary: {
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    topCategories: Record<string, number>;
  };
}

/**
 * Extract text content from different file types
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  
  if (fileType === 'text/csv') {
    return await file.text();
  }
  
  if (fileType === 'application/pdf') {
    try {
      // Use pdfreader to extract text from PDF
      const { PdfReader } = await import('pdfreader');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      return new Promise<string>((resolve, reject) => {
        let pdfText = '';
        
        new PdfReader().parseBuffer(buffer, (err: any, item: any) => {
          if (err) {
            reject(new Error(`Failed to parse PDF: ${err.message}`));
          } else if (!item) {
            // End of file
            resolve(pdfText);
          } else if (item.text) {
            // Add text with space
            pdfText += item.text + ' ';
          }
        });
      });
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF file. Please ensure it\'s a valid PDF with selectable text.');
    }
  }
  
  if (fileType.includes('sheet') || fileType.includes('excel')) {
    // For Excel files, we'd need to use a library like xlsx
    throw new Error('Excel processing not implemented yet. Please use CSV files for testing.');
  }
  
  throw new Error(`Unsupported file type: ${fileType}`);
}

/**
 * Process financial statement using OpenAI
 */
export async function processStatementWithAI(fileContent: string): Promise<TransactionData[]> {
  try {
    let processContent = fileContent;
    
    // Process all content (CSV or extracted PDF text) the same way
    // For structured data (CSV-like), filter to transaction rows
    const lines = fileContent.split('\n');
    const transactionLines = lines.filter(line => {
      // Skip header information and focus on data rows
      const hasDate = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(line);
      const hasAmount = /\d+[\.,]\d{2}/.test(line);
      const hasTransaction = /debit|credit|withdrawal|deposit|transfer|payment/i.test(line);
      return hasDate || hasAmount || hasTransaction;
    });

    // Use filtered content if it significantly reduces the size (CSV case)
    if (transactionLines.length > 0 && transactionLines.length < lines.length * 0.8) {
      processContent = transactionLines.join('\n');
    }
    
    // Limit content size for API efficiency (keep first 15000 characters)
    if (processContent.length > 15000) {
      processContent = processContent.substring(0, 15000);
    }

    // For all file types (including extracted PDF text), use regular text processing
    const response = await openai.chat.completions.create({
      ...MODEL_CONFIG,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.TRANSACTION_EXTRACTION
        },
        {
          role: 'user',
          content: `Please extract transaction data from this financial statement:\n\n${processContent}`
        }
      ],
      response_format: zodResponseFormat(TransactionsResponseSchema, 'transactions')
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the structured response
    const parsedResponse = JSON.parse(content);
    const validatedResponse = TransactionsResponseSchema.parse(parsedResponse);
    
    return validatedResponse.transactions;
  } catch (error) {
    console.error('Error processing statement with AI:', error);
    throw new Error('Failed to process statement with AI');
  }
}

/**
 * Generate financial insights using OpenAI
 */
export async function generateInsights(transactions: TransactionData[]): Promise<string> {
  try {
    const transactionSummary = JSON.stringify(transactions, null, 2);
    
    const response = await openai.chat.completions.create({
      ...MODEL_CONFIG,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.FINANCIAL_INSIGHTS
        },
        {
          role: 'user',
          content: `Please analyze these transactions and provide financial insights:\n\n${transactionSummary}`
        }
      ]
    });

    return response.choices[0]?.message?.content || 'Unable to generate insights';
  } catch (error) {
    console.error('Error generating insights:', error);
    return 'Failed to generate insights';
  }
}

/**
 * Calculate transaction summary statistics
 */
export function calculateSummary(transactions: TransactionData[]): ProcessedStatement['summary'] {
  const totalTransactions = transactions.length;
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals: Record<string, number> = {};

  transactions.forEach(transaction => {
    if (transaction.type === 'income') {
      totalIncome += transaction.amount;
    } else {
      totalExpenses += transaction.amount;
    }

    categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
  });

  // Sort categories by amount (descending)
  const topCategories = Object.fromEntries(
    Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  );

  return {
    totalTransactions,
    totalIncome,
    totalExpenses,
    topCategories
  };
}

/**
 * Main function to process a complete financial statement
 */
export async function processFinancialStatement(file: File): Promise<ProcessedStatement> {
  try {
    // Extract text from file
    const fileContent = await extractTextFromFile(file);
    
    // Process with AI
    const transactions = await processStatementWithAI(fileContent);
    
    // Calculate summary
    const summary = calculateSummary(transactions);
    
    return {
      transactions,
      summary
    };
  } catch (error) {
    console.error('Error processing financial statement:', error);
    throw error;
  }
} 