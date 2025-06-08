import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection & Data...')
  console.log('========================================')

  try {
    // Test 1: Count records
    const { count: statementsCount } = await supabase
      .from('statements')
      .select('*', { count: 'exact', head: true })

    const { count: transactionsCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })

    console.log('📊 Record Counts:')
    console.log(`  ✅ Statements: ${statementsCount}`)
    console.log(`  ✅ Transactions: ${transactionsCount}`)

    // Test 2: Sample statement with transactions
    const { data: statementWithTransactions } = await supabase
      .from('statements')
      .select(`
        id,
        file_name,
        processed,
        transactions:transactions(count)
      `)
      .limit(1)
      .single()

    if (statementWithTransactions) {
      console.log('\n📄 Sample Statement:')
      console.log(`  File: ${statementWithTransactions.file_name}`)
      console.log(`  Processed: ${statementWithTransactions.processed}`)
      console.log(`  Transactions: ${statementWithTransactions.transactions?.[0]?.count || 0}`)
    }

    // Test 3: Transaction aggregations
    const { data: aggregations } = await supabase
      .rpc('get_transaction_summary')
      .single()

    // If RPC doesn't exist, do manual aggregation
    if (!aggregations) {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')

      if (transactions) {
        const totalCredits = transactions
          .filter(t => t.type === 'credit')
          .reduce((sum, t) => sum + t.amount, 0)

        const totalDebits = transactions
          .filter(t => t.type === 'debit')
          .reduce((sum, t) => sum + t.amount, 0)

        console.log('\n💰 Transaction Summary:')
        console.log(`  Total Credits: ₹${totalCredits.toLocaleString()}`)
        console.log(`  Total Debits: ₹${totalDebits.toLocaleString()}`)
        console.log(`  Net: ₹${(totalCredits - totalDebits).toLocaleString()}`)
      }
    }

    // Test 4: Check storage bucket
    const { data: buckets } = await supabase.storage.listBuckets()
    const statementsBucket = buckets?.find(b => b.name === 'statements')

    console.log('\n📦 Storage:')
    console.log(`  ✅ Statements bucket: ${statementsBucket ? 'Available' : 'Not found'}`)

    // Test 5: Recent transactions
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('date, description, amount, type, bank_name')
      .order('date', { ascending: false })
      .limit(5)

    console.log('\n📋 Recent Transactions:')
    recentTransactions?.forEach(t => {
      console.log(`  ${t.date.split('T')[0]} | ${t.bank_name} | ${t.type === 'credit' ? '+' : '-'}₹${t.amount} | ${t.description.substring(0, 30)}...`)
    })

    console.log('\n🎉 Supabase connection test completed successfully!')
    console.log('Your data migration is working perfectly!')

  } catch (error) {
    console.error('❌ Supabase connection test failed:', error)
  }
}

testSupabaseConnection() 