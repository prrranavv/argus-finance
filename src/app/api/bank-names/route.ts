import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // This is more efficient than fetching all transactions.
    // We create a function in Supabase to get distinct bank names.
    // The user should run this SQL in their Supabase SQL editor:
    /*
      create or replace function get_distinct_bank_names()
      returns table (bank_name text) as $$
      begin
        return query
        select distinct t.bank_name 
        from all_transactions as t 
        where t.bank_name is not null and t.bank_name <> ''
        order by t.bank_name;
      end;
      $$ language plpgsql;
    */
    
    const { data, error } = await supabase.rpc('get_distinct_bank_names');

    if (error) {
      console.error("Error calling RPC get_distinct_bank_names. Falling back to fetching all.", error);
      // Fallback method if RPC is not created: fetch all and get unique names.
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('all_transactions')
        .select('bank_name');
        
      if (fallbackError) {
        throw fallbackError;
      }
      
      const bankNames = Array.from(new Set(fallbackData.map(t => t.bank_name).filter(Boolean))).sort();
      return NextResponse.json(bankNames);
    }
    
    // The RPC returns an array of objects like [{ bank_name: '...' }], so we map it.
    const bankNames = data.map((item: { bank_name: string }) => item.bank_name);
    return NextResponse.json(bankNames);

  } catch (error) {
    console.error('Error fetching bank names:', error);
    return NextResponse.json({ error: 'Failed to fetch bank names' }, { status: 500 });
  }
} 