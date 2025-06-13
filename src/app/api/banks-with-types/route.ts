import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all unique bank names and account types from balances table
    const { data: balances, error } = await supabase
      .from('balances')
      .select('bank_name, account_type')
      .order('bank_name');

    if (error) {
      console.error('Error fetching balances:', error);
      return NextResponse.json({ error: 'Failed to fetch banks with types' }, { status: 500 });
    }

    // Group banks by account type
    const banksByType = balances.reduce((acc, balance) => {
      if (!balance.bank_name || !balance.account_type) return acc;
      
      if (!acc[balance.account_type]) {
        acc[balance.account_type] = new Set();
      }
      acc[balance.account_type].add(balance.bank_name);
      
      return acc;
    }, {} as Record<string, Set<string>>);

    // Convert sets to arrays and sort
    const result = Object.entries(banksByType).reduce((acc, [accountType, bankSet]) => {
      acc[accountType] = Array.from(bankSet).sort();
      return acc;
    }, {} as Record<string, string[]>);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in banks-with-types API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 