'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Users, Receipt, ShoppingCart, Home, Car, Utensils, Coffee, Gamepad2, Gift, TrendingUp, TrendingDown, Search, X, ChevronDown } from 'lucide-react';

import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import { formatCurrencyInLakhs } from '@/lib/utils';
import { SplitwiseBalanceChart } from '@/components/splitwise-balance-chart';

interface SplitwiseGroup {
  id: number;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  avatar?: {
    large?: string;
    medium?: string;
    small?: string;
  };
  cover_photo?: {
    xxlarge?: string;
    xlarge?: string;
    large?: string;
  };
  members: Array<{
    id: number;
    first_name: string;
    last_name: string;
    picture?: {
      medium?: string;
    };
  }>;
  simplify_by_default: boolean;
  original_debts: Array<{
    from: number;
    to: number;
    amount: string;
    currency_code: string;
  }>;
  simplified_debts: Array<{
    from: number;
    to: number;
    amount: string;
    currency_code: string;
  }>;
}

interface SplitwiseExpense {
  id: number;
  group_id: number;
  cost: string;
  description: string;
  currency_code: string;
  date: string;
  created_at: string;
  category: {
    id: number;
    name: string;
  };
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
  };
  users: Array<{
    user_id: number;
    paid_share: string;
    owed_share: string;
    net_balance: string;
    user?: {
      id: number;
      first_name: string;
      last_name: string;
      picture?: {
        medium?: string;
      };
    };
  }>;
}

interface SplitviseFriend {
  id: number;
  first_name: string;
  last_name: string;
  picture: {
    medium?: string;
  };
  balance: Array<{
    currency_code: string;
    amount: string;
  }>;
}

interface CurrentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export default function SplitvisePage() {
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [groups, setGroups] = useState<SplitwiseGroup[]>([]);
  const [expenses, setExpenses] = useState<SplitwiseExpense[]>([]);
  const [friends, setFriends] = useState<SplitviseFriend[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyInvolved, setShowOnlyInvolved] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<SplitviseFriend | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SplitwiseGroup | null>(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [oldestExpenseDate, setOldestExpenseDate] = useState<string | null>(null);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<SplitwiseGroup | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Load privacy preference from localStorage on mount
  useEffect(() => {
    const savedPrivacyMode = localStorage.getItem('privacyMode');
    if (savedPrivacyMode !== null) {
      setIsPrivacyMode(JSON.parse(savedPrivacyMode));
    }
  }, []);

  // Save privacy preference to localStorage when changed
  const handlePrivacyToggle = () => {
    const newPrivacyMode = !isPrivacyMode;
    setIsPrivacyMode(newPrivacyMode);
    localStorage.setItem('privacyMode', JSON.stringify(newPrivacyMode));
  };

  const fetchData = async (isInitial: boolean = true) => {
    if (isInitial) {
      setLoading(true);
    }
    setError(null);
    
    try {
      let expensesUrl = '/api/splitwise/expenses';
      
      if (isInitial) {
        // For initial load, get ALL expenses from last 30 days (no limit)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
        expensesUrl += `?dated_after=${dateFrom}&limit=0`; // limit=0 means get all
      } else {
        // For loading more, get 50 expenses older than the oldest we have
        if (oldestExpenseDate) {
          // Use the day before the oldest expense date to avoid duplicates
          const oldestDate = new Date(oldestExpenseDate);
          oldestDate.setDate(oldestDate.getDate() - 1);
          const dateBefore = oldestDate.toISOString().split('T')[0];
          expensesUrl += `?dated_before=${dateBefore}&limit=50`;
        } else {
          expensesUrl += '?limit=50';
        }
      }

      const promises = [
        fetch(expensesUrl)
      ];

      // Only fetch other data on initial load
      if (isInitial) {
        promises.unshift(
          fetch('/api/splitwise/groups'),
          fetch('/api/splitwise/friends'),
          fetch('/api/splitwise/current-user')
        );
      }

      const responses = await Promise.all(promises);
      const dataPromises = responses.map(res => res.json());
      const data = await Promise.all(dataPromises);

      if (isInitial) {
        const [groupsData, friendsData, currentUserData, expensesData] = data;
        setGroups(groupsData.groups || []);
        setFriends(friendsData.friends || []);
        setCurrentUser(currentUserData.user || null);
        
        const expenses = expensesData.expenses || [];
        setExpenses(expenses);
        
        // Set oldest date if we have expenses
        if (expenses.length > 0) {
          const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const oldestDate = sortedExpenses[0].date;
          setOldestExpenseDate(oldestDate);
        }
        
        // For initial load from last 30 days, check if we should show load more
        // We show load more if we have expenses (meaning there might be older ones)
        setHasMoreExpenses(expenses.length > 0);
      } else {
        const [expensesData] = data;
        const newExpenses = expensesData.expenses || [];
        
        if (newExpenses.length > 0) {
          // Filter out any duplicates based on expense ID
          setExpenses(prev => {
            const existingIds = new Set(prev.map((e: SplitwiseExpense) => e.id));
            const uniqueNewExpenses = newExpenses.filter((e: SplitwiseExpense) => !existingIds.has(e.id));
            return [...prev, ...uniqueNewExpenses];
          });
          
          // Update oldest date with the oldest from new expenses
          const sortedNewExpenses = [...newExpenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          if (sortedNewExpenses.length > 0) {
            setOldestExpenseDate(sortedNewExpenses[0].date);
          }
          
          // Check if we got less than 50, meaning no more to load
          setHasMoreExpenses(newExpenses.length === 50);
        } else {
          setHasMoreExpenses(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loadMoreExpenses = async () => {
    if (!hasMoreExpenses || loadingMore) return;
    
    setLoadingMore(true);
    try {
      await fetchData(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatAmount = (amount: string) => {
    if (isPrivacyMode) return '••••••';
    const num = parseFloat(amount);
    return `₹${Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to get group outstanding balance (moved here to avoid initialization order issues)
  const getGroupOutstandingBalance = (group: SplitwiseGroup) => {
    if (!currentUser) return 0;
    
    return group.simplified_debts
      .filter(debt => debt.from === currentUser.id || debt.to === currentUser.id)
      .reduce((total, debt) => {
        const amount = parseFloat(debt.amount);
        // If current user is 'to', they are owed money (positive)
        // If current user is 'from', they owe money (negative)
        return total + (debt.to === currentUser.id ? amount : -amount);
      }, 0);
  };

  // Filter groups with outstanding balances and sort by updated date
  const activeGroups = useMemo(() => {
    return groups
      .filter(group => {
        if (group.name === 'Non-group expenses') return false;
        const outstandingBalance = getGroupOutstandingBalance(group);
        return Math.abs(outstandingBalance) > 0;
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [groups, currentUser]);

  // Filter friends with outstanding balances
  const activeFriends = useMemo(() => {
    return friends
      .filter(friend => friend.balance.some(bal => parseFloat(bal.amount) !== 0))
      .sort((a, b) => {
        const aTotal = a.balance.reduce((sum, bal) => sum + Math.abs(parseFloat(bal.amount)), 0);
        const bTotal = b.balance.reduce((sum, bal) => sum + Math.abs(parseFloat(bal.amount)), 0);
        return bTotal - aTotal;
      });
  }, [friends]);

  // Helper function to get my share details (moved here to avoid initialization order issues)
  const getMyShareDetails = (expense: SplitwiseExpense): { type: string; amount?: number; netBalance?: number; paidShare?: number; owedShare?: number } | null => {
    if (!currentUser) return null;
    
    const myUserData = expense.users.find(user => user.user_id === currentUser.id);
    if (!myUserData) {
      return { type: 'not_involved' };
    }

    const netBalance = parseFloat(myUserData.net_balance);
    const paidShare = parseFloat(myUserData.paid_share);
    const owedShare = parseFloat(myUserData.owed_share);
    
    if (netBalance === 0) {
      return { type: 'settled', paidShare, owedShare };
    }
    
    if (netBalance > 0) {
      return { type: 'lent', amount: netBalance, paidShare, owedShare, netBalance };
    } else {
      return { type: 'borrowed', amount: Math.abs(netBalance), paidShare, owedShare, netBalance };
    }
  };

  // Helper function to search expenses
  const searchExpenses = (expenses: SplitwiseExpense[], query: string) => {
    if (!query.trim()) return expenses;
    
    const searchTerm = query.toLowerCase();
    
    return expenses.filter(expense => {
      // Search in expense title/description
      if (expense.description.toLowerCase().includes(searchTerm)) return true;
      
      // Search in amount
      if (expense.cost.includes(searchTerm) || formatAmount(expense.cost).toLowerCase().includes(searchTerm)) return true;
      
      // Search in date
      const expenseDate = parseISO(expense.date);
      const dateStr = format(expenseDate, 'MMM d, yyyy').toLowerCase();
      if (dateStr.includes(searchTerm)) return true;
      
      // Search in involved member names
      const involvedMembers = expense.users.map(user => {
        if (user.user?.first_name || user.user?.last_name) {
          const firstName = user.user.first_name && user.user.first_name.toLowerCase() !== 'null' ? user.user.first_name : '';
          const lastName = user.user.last_name && user.user.last_name.toLowerCase() !== 'null' ? user.user.last_name : '';
          return [firstName, lastName].filter(Boolean).join(' ').toLowerCase();
        }
        return '';
      }).filter(Boolean);
      
      // Also search in creator name
      const creatorFirstName = expense.created_by.first_name && expense.created_by.first_name.toLowerCase() !== 'null' ? expense.created_by.first_name : '';
      const creatorLastName = expense.created_by.last_name && expense.created_by.last_name.toLowerCase() !== 'null' ? expense.created_by.last_name : '';
      const creatorName = [creatorFirstName, creatorLastName].filter(Boolean).join(' ').toLowerCase();
      
      if (creatorName.includes(searchTerm)) return true;
      if (involvedMembers.some(name => name.includes(searchTerm))) return true;
      
      return false;
    });
  };

  // Group expenses by time periods with proper sorting
  const groupedExpenses = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter expenses based on involvement toggle and selected friend/group
    let filteredExpenses = showOnlyInvolved 
      ? expenses.filter(expense => {
          const myShare = getMyShareDetails(expense);
          return myShare && myShare.type !== 'not_involved';
        })
      : expenses;

    // Filter by selected friend
    if (selectedFriend) {
      filteredExpenses = filteredExpenses.filter(expense => {
        // Check if the selected friend was involved in this expense
        return expense.users.some(user => user.user_id === selectedFriend.id) ||
               expense.created_by.id === selectedFriend.id;
      });
    }

    // Filter by selected group
    if (selectedGroup) {
      filteredExpenses = filteredExpenses.filter(expense => {
        // Use the group_id field to filter expenses properly
        return expense.group_id === selectedGroup.id;
      });
    }

    // Apply search filter
    const searchedExpenses = searchExpenses(filteredExpenses, searchQuery);
    
    const sortedExpenses = searchedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const todayExpenses = sortedExpenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= today;
    });

    const yesterdayExpenses = sortedExpenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= yesterday && expenseDate < today;
    });

    const last7DaysExpenses = sortedExpenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= sevenDaysAgo && expenseDate < yesterday;
    });

    const last30DaysExpenses = sortedExpenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= thirtyDaysAgo && expenseDate < sevenDaysAgo;
    });

    const olderExpenses = sortedExpenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate < thirtyDaysAgo;
    });

    return {
      today: todayExpenses,
      yesterday: yesterdayExpenses,
      last7Days: last7DaysExpenses,
      last30Days: last30DaysExpenses,
      older: olderExpenses
    };
  }, [expenses, showOnlyInvolved, selectedFriend, selectedGroup, searchQuery]);

  const getTotalOutstandingBalance = () => {
    return activeFriends.reduce((total, friend) => {
      return total + friend.balance.reduce((sum, bal) => sum + parseFloat(bal.amount), 0);
    }, 0);
  };

  const getGroupMembers = (group: SplitwiseGroup) => {
    if (!currentUser) return [];
    
    interface MemberInfo {
      member: {
        id: number;
        first_name: string;
        last_name: string;
        picture?: { medium?: string };
      };
      amount: number;
      owesYou: boolean;
      memberName: string;
    }
    
    const memberInfo: Array<MemberInfo> = [];
    
    // Check simplified debts for relationships involving current user
    group.simplified_debts.forEach(debt => {
      const amount = parseFloat(debt.amount);
      if (amount === 0) return;
      
      if (debt.from === currentUser.id) {
        // Current user owes money to debt.to
        const member = group.members.find(m => m.id === debt.to);
        if (member) {
          memberInfo.push({
            member,
            amount: Math.abs(amount),
            owesYou: false,
            memberName: (() => {
              const firstName = member.first_name && member.first_name.toLowerCase() !== 'null' ? member.first_name : '';
              const lastName = member.last_name && member.last_name.toLowerCase() !== 'null' ? member.last_name : '';
              return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown Member';
            })()
          });
        }
      } else if (debt.to === currentUser.id) {
        // debt.from owes money to current user
        const member = group.members.find(m => m.id === debt.from);
        if (member) {
          memberInfo.push({
            member,
            amount: Math.abs(amount),
            owesYou: true,
            memberName: (() => {
              const firstName = member.first_name && member.first_name.toLowerCase() !== 'null' ? member.first_name : '';
              const lastName = member.last_name && member.last_name.toLowerCase() !== 'null' ? member.last_name : '';
              return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown Member';
            })()
          });
        }
      }
    });
    
    return memberInfo;
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('food')) return Utensils;
    if (name.includes('grocery') || name.includes('shopping')) return ShoppingCart;
    if (name.includes('rent') || name.includes('house')) return Home;
    if (name.includes('transport') || name.includes('car') || name.includes('gas')) return Car;
    if (name.includes('coffee') || name.includes('drink')) return Coffee;
    if (name.includes('entertainment') || name.includes('movie') || name.includes('game')) return Gamepad2;
    if (name.includes('gift')) return Gift;
    return Receipt;
  };

  const getGroupIcon = (groupName: string) => {
    const name = groupName.toLowerCase();
    if (name.includes('house') || name.includes('flat') || name.includes('home')) return Home;
    if (name.includes('trip') || name.includes('travel') || name.includes('vacation')) return Car;
    return Users;
  };

  const getGroupAvatar = (group: SplitwiseGroup) => {
    if (group.avatar?.medium) return group.avatar.medium;
    if (group.cover_photo?.large) return group.cover_photo.large;
    return null;
  };

  const totalOutstanding = getTotalOutstandingBalance();

  // Calculate last 7 days balance with comparison
  const getLast7DaysBalance = () => {
    if (!currentUser) return { current: 0, previous: 0, percentChange: 0 };
    
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const last7DaysExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= last7Days && expenseDate <= now;
    });
    
    const previous7DaysExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= last14Days && expenseDate < last7Days;
    });
    
    const calculateBalance = (expenseList: SplitwiseExpense[]) => {
      return expenseList.reduce((total, expense) => {
        const myShare = getMyShareDetails(expense);
        if (myShare?.type === 'lent' && myShare.amount) {
          return total + myShare.amount;
        } else if (myShare?.type === 'borrowed' && myShare.amount) {
          return total - myShare.amount;
        }
        return total;
      }, 0);
    };
    
    const currentBalance = calculateBalance(last7DaysExpenses);
    const previousBalance = calculateBalance(previous7DaysExpenses);
    
    const percentChange = previousBalance !== 0 
      ? ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100 
      : 0;
    
    return { current: currentBalance, previous: previousBalance, percentChange };
  };

  // Get top 3 expenses by my borrowed share
  const getTop3BorrowedExpenses = () => {
    if (!currentUser) return [];
    
    return expenses
      .map(expense => ({
        ...expense,
        myBorrowedAmount: (() => {
          const myShare = getMyShareDetails(expense);
          return myShare?.type === 'borrowed' && myShare.amount ? myShare.amount : 0;
        })()
      }))
      .filter(expense => expense.myBorrowedAmount > 0)
      .sort((a, b) => b.myBorrowedAmount - a.myBorrowedAmount)
      .slice(0, 3);
  };

  // Get last 3 expenses added by me
  const getMyLast3Expenses = () => {
    if (!currentUser) return [];
    
    return expenses
      .filter(expense => expense.created_by.id === currentUser.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  };

  const last7DaysData = getLast7DaysBalance();
  const top3BorrowedExpenses = getTop3BorrowedExpenses();
  const myLast3Expenses = getMyLast3Expenses();

  // Expense Card Component
  const ExpenseCard = ({ expense }: { expense: SplitwiseExpense }) => {
    const myShare = getMyShareDetails(expense);
    const expenseDate = parseISO(expense.date);
    const CategoryIcon = getCategoryIcon(expense.category.name);
    
    // Get thumbnail color based on category
    const getThumbnailGradient = (categoryName: string) => {
      const name = categoryName.toLowerCase();
      if (name.includes('food') || name.includes('restaurant')) return 'from-orange-400 to-red-500';
      if (name.includes('grocery') || name.includes('shopping')) return 'from-green-400 to-emerald-500';
      if (name.includes('rent') || name.includes('house') || name.includes('home')) return 'from-blue-400 to-indigo-500';
      if (name.includes('transport') || name.includes('car') || name.includes('gas')) return 'from-purple-400 to-violet-500';
      if (name.includes('coffee') || name.includes('drink')) return 'from-amber-400 to-orange-500';
      if (name.includes('entertainment') || name.includes('movie')) return 'from-pink-400 to-rose-500';
      if (name.includes('gift')) return 'from-red-400 to-pink-500';
      return 'from-gray-400 to-gray-500';
    };
    
    return (
      <Card className="cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.05] relative group">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Thumbnail */}
            <div className="flex justify-center mb-3">
              <div className={`h-12 w-12 bg-gradient-to-br ${getThumbnailGradient(expense.category.name)} rounded-lg flex items-center justify-center shadow-lg`}>
                <CategoryIcon className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
            </div>
            
            {/* Expense Title */}
            <div className="text-center">
              <h3 className="font-semibold text-foreground text-sm truncate" title={expense.description}>
                {expense.description}
              </h3>
            </div>
            
            {/* Who paid and total amount */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const firstName = expense.created_by.first_name && expense.created_by.first_name.toLowerCase() !== 'null' ? expense.created_by.first_name : '';
                  const lastName = expense.created_by.last_name && expense.created_by.last_name.toLowerCase() !== 'null' ? expense.created_by.last_name : '';
                  const fullName = [firstName, lastName].filter(Boolean).join(' ');
                  return fullName || 'Someone';
                })()} paid {formatAmount(expense.cost)}.
              </p>
            </div>
            
            {/* My share */}
            <div className="text-center">
              {myShare?.type === 'not_involved' ? (
                <p className="text-xs text-muted-foreground">Not involved</p>
              ) : myShare?.type === 'settled' ? (
                <p className="text-xs text-muted-foreground">Settled</p>
              ) : myShare?.type === 'lent' && myShare.amount ? (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  You lent {formatAmount(myShare.amount.toString())}
                </p>
              ) : myShare?.type === 'borrowed' && myShare.amount ? (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  You borrowed {formatAmount(myShare.amount.toString())}
                </p>
              ) : null}
            </div>
            
            {/* Date */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {format(expenseDate, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Skeleton Components
  const KeyMetricsSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const FriendsSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Avatar */}
              <div className="flex justify-center mb-3">
                <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
              </div>
              {/* Name */}
              <div className="text-center">
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
              </div>
              {/* Status */}
              <div className="text-center space-y-1">
                <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-20 mx-auto"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const GroupsSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Group Avatar */}
              <div className="flex justify-center mb-3">
                <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
              </div>
              {/* Group Name */}
              <div className="text-center space-y-1">
                <div className="h-4 bg-gray-200 rounded w-28 mx-auto"></div>
                <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
              </div>
              {/* Member Details */}
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
              {/* Total Outstanding */}
              <div className="text-center pt-2 border-t border-gray-100 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-24 mx-auto"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const ActivitySkeleton = () => (
    <div className="space-y-3">
      {[...Array(12)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              {/* Date */}
              <div className="text-center w-12 flex-shrink-0 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-8 mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-6 mx-auto"></div>
              </div>
              {/* Category Icon */}
              <div className="h-10 w-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
              {/* Expense Details */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-200 rounded w-36"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              {/* My Share */}
              <div className="text-right flex-shrink-0 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-10 max-w-7xl">
      <Header 
        isPrivacyMode={isPrivacyMode}
        onPrivacyToggle={handlePrivacyToggle}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Key Metrics Section */}
      {loading ? (
        <KeyMetricsSkeleton />
      ) : (
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Outstanding - Keep as is */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                {totalOutstanding >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalOutstanding >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatAmount(Math.abs(totalOutstanding).toString())}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalOutstanding >= 0 ? 'You are owed' : 'You owe'}
                </p>
              </CardContent>
            </Card>

            {/* Last 7 Days Balance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
                {last7DaysData.percentChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${last7DaysData.current >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatAmount(Math.abs(last7DaysData.current).toString())}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.abs(last7DaysData.percentChange).toFixed(1)}% vs prev week
                </p>
              </CardContent>
            </Card>

            {/* Top 3 Borrowed Expenses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Borrowed</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {top3BorrowedExpenses.length > 0 ? (
                    top3BorrowedExpenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between text-xs">
                        <span className="truncate flex-1 mr-2">{expense.description}</span>
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          -{formatAmount(expense.myBorrowedAmount.toString())}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No borrowed expenses</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Last 3 Expenses Added by Me */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Recent</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {myLast3Expenses.length > 0 ? (
                    myLast3Expenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between text-xs">
                        <span className="truncate flex-1 mr-2">{expense.description}</span>
                        <span className="text-foreground font-medium">
                          {formatAmount(expense.cost)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No recent expenses</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Outstanding Balance Chart */}
      <div className="mb-8">
        <SplitwiseBalanceChart isPrivacyMode={isPrivacyMode} />
      </div>

      {/* Main Content Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Splitwise Dashboard</CardTitle>
                <CardDescription>Track your shared expenses, group balances, and recent activity</CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setOldestExpenseDate(null);
                  setHasMoreExpenses(true);
                  fetchData(true);
                }} 
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="friends">
                  Friends {loading ? '' : `(${activeFriends.length})`}
                </TabsTrigger>
                <TabsTrigger value="groups">
                  Groups {loading ? '' : `(${activeGroups.length})`}
                </TabsTrigger>
                <TabsTrigger value="activity">
                  Activity {loading ? '' : `(${expenses.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="friends">
                {loading ? (
                  <FriendsSkeleton />
                ) : activeFriends.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {activeFriends.map((friend) => {
                      const totalBalance = friend.balance.reduce((sum, bal) => sum + parseFloat(bal.amount), 0);
                      const isPositive = totalBalance > 0;
                      
                      return (
                        <Card 
                          key={friend.id} 
                          className="cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.05] relative group"
                          onClick={() => {
                            setSelectedFriend(friend);
                            setSelectedGroup(null);
                            setActiveTab('activity');
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Friend Avatar - Centered */}
                              <div className="flex justify-center mb-3">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium overflow-hidden">
                                  {friend.picture?.medium ? (
                                    <Image 
                                      src={friend.picture.medium} 
                                      alt="Profile" 
                                      width={64} 
                                      height={64} 
                                      className="h-16 w-16 rounded-full object-cover" 
                                    />
                                  ) : (
                                    <span className="text-lg">
                                      {(() => {
                                        const firstName = friend.first_name && friend.first_name.toLowerCase() !== 'null' ? friend.first_name : '';
                                        const lastName = friend.last_name && friend.last_name.toLowerCase() !== 'null' ? friend.last_name : '';
                                        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
                                        return initials || '?';
                                      })()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Friend Name */}
                              <div className="text-center">
                                <h3 className="font-medium text-foreground text-sm">
                                  {[friend.first_name, friend.last_name].filter(name => name && name.toLowerCase() !== 'null').join(' ') || 'No Name'}
                                </h3>
                              </div>
                              
                              {/* Status */}
                              <div className="text-center">
                                <p className={`text-xs font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {isPositive ? 'owes you' : 'you owe'}
                                </p>
                                <div className={`text-lg font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatAmount(Math.abs(totalBalance).toString())}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No friends with outstanding balances</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="groups">
                {loading ? (
                  <GroupsSkeleton />
                ) : activeGroups.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {activeGroups.map((group) => {
                      const outstandingBalance = getGroupOutstandingBalance(group);
                      const isPositive = outstandingBalance >= 0;
                      const GroupIconComponent = getGroupIcon(group.name);
                      const groupAvatar = getGroupAvatar(group);
                      // const groupMembers = getGroupMembers(group);
                      
                      return (
                        <Card 
                          key={group.id} 
                          className="cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.05] relative group"
                          onMouseEnter={(e) => {
                            if (hoverTimeout) clearTimeout(hoverTimeout);
                            if (showTimeout) clearTimeout(showTimeout);
                            
                            const rect = e.currentTarget.getBoundingClientRect();
                            const timeout = setTimeout(() => {
                              setTooltipPosition({
                                x: rect.left + rect.width / 2,
                                y: rect.bottom + 8
                              });
                              setHoveredGroup(group);
                            }, 200);
                            setShowTimeout(timeout);
                          }}
                                                      onMouseLeave={() => {
                              if (showTimeout) clearTimeout(showTimeout);
                              const timeout = setTimeout(() => {
                                setHoveredGroup(null);
                                setTooltipPosition(null);
                              }, 150);
                              setHoverTimeout(timeout);
                            }}
                          onClick={() => {
                            setSelectedGroup(group);
                            setSelectedFriend(null);
                            setActiveTab('activity');
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Group Avatar/Cover - Centered */}
                              <div className="flex justify-center mb-3">
                                {groupAvatar ? (
                                  <div className="h-16 w-16 rounded-lg overflow-hidden shadow-sm border border-gray-100">
                                    <Image 
                                      src={groupAvatar} 
                                      alt={group.name} 
                                      width={64} 
                                      height={64} 
                                      className="h-16 w-16 object-cover" 
                                    />
                                  </div>
                                ) : (
                                  <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                                    <GroupIconComponent className="h-8 w-8 text-white" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Group Name */}
                              <div className="text-center">
                                <h3 className="font-medium text-foreground text-sm truncate" title={group.name}>
                                  {group.name}
                                </h3>
                              </div>
                              
                              {/* Total Outstanding */}
                              <div className="text-center pt-2">
                                <p className={`text-xs ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {isPositive ? 'you are owed' : 'you owe'}
                                </p>
                                <div className={`text-lg font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatAmount(Math.abs(outstandingBalance).toString())}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          

                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No groups with outstanding balances</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activity">
                {loading ? (
                  <ActivitySkeleton />
                ) : (
                  <div className="space-y-6">
                    {/* Search and Filters Bar */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Search Bar */}
                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search expenses, members, amounts, or dates..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm placeholder-muted-foreground bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                      </div>
                      
                      {/* Filter Dropdown */}
                      <div className="relative">
                        <select
                          value={selectedFriend ? `friend-${selectedFriend.id}` : selectedGroup ? `group-${selectedGroup.id}` : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setSelectedFriend(null);
                              setSelectedGroup(null);
                            } else if (value.startsWith('friend-')) {
                              const friendId = parseInt(value.replace('friend-', ''));
                              const friend = friends.find(f => f.id === friendId);
                              setSelectedFriend(friend || null);
                              setSelectedGroup(null);
                            } else if (value.startsWith('group-')) {
                              const groupId = parseInt(value.replace('group-', ''));
                              const group = groups.find(g => g.id === groupId);
                              setSelectedGroup(group || null);
                              setSelectedFriend(null);
                            }
                          }}
                          className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                        >
                          <option value="">All Friends & Groups</option>
                          <optgroup label="Friends">
                            {activeFriends.map(friend => (
                              <option key={friend.id} value={`friend-${friend.id}`}>
                                {[friend.first_name, friend.last_name].filter(name => name && name.toLowerCase() !== 'null').join(' ') || 'No Name'}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Groups">
                            {activeGroups.map(group => (
                              <option key={group.id} value={`group-${group.id}`}>
                                {group.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Only Involved Toggle */}
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showOnlyInvolved}
                            onChange={(e) => setShowOnlyInvolved(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showOnlyInvolved ? 'bg-blue-600' : 'bg-gray-200'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOnlyInvolved ? 'translate-x-6' : 'translate-x-1'}`} />
                          </div>
                          <span className="ml-2 text-sm font-medium text-foreground">Only involved</span>
                        </label>
                      </div>

                      {/* Clear All Filters */}
                      {(searchQuery || selectedFriend || selectedGroup || !showOnlyInvolved) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedFriend(null);
                            setSelectedGroup(null);
                            setShowOnlyInvolved(true);
                          }}
                          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 border-gray-300"
                        >
                          <X className="h-3 w-3" />
                          <span>Clear</span>
                        </Button>
                      )}
                    </div>
                    
                    {/* Info about date range */}
                    {!searchQuery && !selectedFriend && !selectedGroup && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Showing all expenses from the last 30 days. Use &quot;Load More&quot; to see older expenses.
                        </p>
                      </div>
                    )}
                    
                    {/* Today Section */}
                    {groupedExpenses.today.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Today</h3>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {groupedExpenses.today.map((expense) => (
                            <ExpenseCard key={expense.id} expense={expense} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Yesterday Section */}
                    {groupedExpenses.yesterday.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Yesterday</h3>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {groupedExpenses.yesterday.map((expense) => (
                            <ExpenseCard key={expense.id} expense={expense} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Last 7 Days Section */}
                    {groupedExpenses.last7Days.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Last 7 days</h3>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {groupedExpenses.last7Days.map((expense) => (
                            <ExpenseCard key={expense.id} expense={expense} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Last 30 Days Section */}
                    {groupedExpenses.last30Days.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Last 30 days</h3>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {groupedExpenses.last30Days.map((expense) => (
                            <ExpenseCard key={expense.id} expense={expense} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Older Section */}
                    {groupedExpenses.older.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Older</h3>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {groupedExpenses.older.map((expense) => (
                            <ExpenseCard key={expense.id} expense={expense} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Load More Button */}
                    {hasMoreExpenses && Object.values(groupedExpenses).some(group => group.length > 0) && (
                      <div className="flex justify-center pt-6">
                        <Button 
                          onClick={loadMoreExpenses}
                          disabled={loadingMore}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          {loadingMore ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <span>Load More Expenses</span>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* No Expenses Message */}
                    {Object.values(groupedExpenses).every(group => group.length === 0) && (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <p className="text-muted-foreground">No expenses found</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Portal-based Tooltip */}
      {hoveredGroup && tooltipPosition && (
        <div 
          className="fixed pointer-events-none z-[99999] transition-all duration-200 ease-out"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[180px] max-w-[240px] animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="mb-2 pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-600 uppercase tracking-wide">MEMBER BALANCES</span>
              </div>
            </div>

            {/* Member List */}
            <div className="space-y-1.5">
              {(() => {
                const groupMembers = getGroupMembers(hoveredGroup);
                return groupMembers.length === 0 ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">All settled up</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {groupMembers.slice(0, 4).map((memberInfo, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5">
                        <span className="text-sm text-gray-700 font-medium">
                          {memberInfo.memberName.split(' ')[0]}
                        </span>
                        <span className={`text-sm font-semibold ${memberInfo.owesYou ? 'text-green-600' : 'text-red-600'}`}>
                          {memberInfo.owesYou ? '+' : '-'}{formatCurrencyInLakhs(memberInfo.amount)}
                        </span>
                      </div>
                    ))}
                    {groupMembers.length > 4 && (
                      <div className="text-center pt-1.5 mt-1.5 border-t border-gray-100">
                        <span className="text-xs text-gray-400">+{groupMembers.length - 4} more members</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Tooltip Arrow - Argus style */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0.5">
              <svg width="12" height="6" viewBox="0 0 12 6" className="text-white drop-shadow-sm">
                <path d="M0 6l6-6 6 6H0z" fill="currentColor" />
              </svg>
              <svg width="12" height="6" viewBox="0 0 12 6" className="absolute top-0 left-0 text-gray-200">
                <path d="M0 6l6-6 6 6H0z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 