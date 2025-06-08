import { NextResponse } from 'next/server';

async function getMonthlyBalances(request: Request) {
  // Use the existing monthly summary API logic to get accurate balance data
  const baseUrl = new URL(request.url).origin;
  const response = await fetch(`${baseUrl}/api/monthly-summary?bank=Total`);
  const monthlyData = await response.json();
  
  return monthlyData;
}

function getMonthName(monthString: string): string {
  return monthString; // Already formatted like "June 2025"
}

export async function GET(request: Request) {
  try {
    // Get monthly balance data from the existing API
    const monthlyBalances = await getMonthlyBalances(request);
    
    if (monthlyBalances.length < 2) {
      return NextResponse.json({ error: 'Insufficient data for comparison' }, { status: 400 });
    }

    // Get current and previous month data
    const currentMonth = monthlyBalances[0];
    const previousMonth = monthlyBalances[1];
    const monthBeforePrevious = monthlyBalances[2] || { accountBalance: 0, totalCreditBill: 0 };

    // 1. Current Bank Balance vs Previous Month
    const currentBalance = currentMonth.accountBalance || 0;
    const prevBankBalance = previousMonth.accountBalance || 0;

    // 2. Credit Card Dues - Show previous month's bill (May expenses to be paid in June)
    const lastMonthCreditCardBill = previousMonth.totalCreditBill || 0;
    const monthBeforePreviousBill = monthBeforePrevious.totalCreditBill || 0;

    // 3. Real Balance (Bank Balance - Credit Card Dues)
    const realBalance = currentBalance - lastMonthCreditCardBill;
    const prevRealBalance = prevBankBalance - monthBeforePreviousBill;

    // 4. HDFC Diners Reward Points (simplified - use fallback values)
    const currentRewardPoints = 29417;
    const prevRewardPoints = 28100;

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return 0;
      return ((current - previous) / Math.abs(previous)) * 100;
    };

    const response = {
      currentBalance: {
        value: currentBalance,
        change: calculatePercentageChange(currentBalance, prevBankBalance),
        month: getMonthName(currentMonth.month)
      },
      creditCardBill: {
        value: lastMonthCreditCardBill, // Show previous month's bill (May expenses)
        change: calculatePercentageChange(lastMonthCreditCardBill, monthBeforePreviousBill),
        month: getMonthName(previousMonth.month), // May expenses
        paymentMonth: getMonthName(currentMonth.month) // Due in June
      },
      realBalance: {
        value: realBalance,
        change: calculatePercentageChange(realBalance, prevRealBalance),
        month: getMonthName(currentMonth.month)
      },
      rewardPoints: {
        value: currentRewardPoints,
        change: calculatePercentageChange(currentRewardPoints, prevRewardPoints),
        month: getMonthName(currentMonth.month)
      },
      // Add debug info
      debug: {
        currentMonth: currentMonth.month,
        previousMonth: previousMonth.month,
        currentBalance,
        prevBankBalance,
        lastMonthCreditCardBill,
        monthBeforePreviousBill,
        realBalance,
        prevRealBalance
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching key metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch key metrics' }, { status: 500 });
  }
} 