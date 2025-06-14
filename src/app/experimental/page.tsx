"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/header';
import { ChatInput } from '@/components/ui/chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Mail, FileText, UserPlus, Users, ArrowUp, DollarSign, TrendingUp, CheckCircle, Sun, Moon, Sunset, Sunrise } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatCurrencyInLakhs } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  transactions?: TransactionData[];
  chartData?: ChartData;
  splitwiseFriends?: SplitviseFriendData[];
  splitwiseGroups?: SplitwiseGroupData[];
  splitwiseActivity?: SplitwiseActivityData[];
}

interface TransactionData {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  bank_name: string;
  account_type: string;
  source: string;
}

interface ChartData {
  type: 'area' | 'bar' | 'line' | 'pie';
  title: string;
  description?: string;
  data: any[];
  xAxis: string;
  yAxis: string;
  color?: string;
  colors?: string[];
}

interface SplitviseFriendData {
  id: number;
  first_name: string;
  last_name: string;
  picture?: {
    medium?: string;
  };
  balance: Array<{
    currency_code: string;
    amount: string;
  }>;
}

interface SplitwiseGroupData {
  id: number;
  name: string;
  type: string;
  avatar?: {
    medium?: string;
  };
  cover_photo?: {
    large?: string;
  };
  members: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
  outstandingBalance: number;
}

interface SplitwiseActivityData {
  id: number;
  description: string;
  cost: string;
  date: string;
  category: {
    name: string;
  };
  myShare: {
    type: 'lent' | 'borrowed' | 'settled';
    amount: number;
  };
  created_by: {
    first_name: string;
    last_name: string;
  };
}

// Chart Component
const ChartComponent = ({ chartData, isPrivacyMode }: { chartData: ChartData; isPrivacyMode: boolean }) => {

  
  const formatCurrency = (value: number) => {
    if (isPrivacyMode) {
      return '₹••••';
    }
    
    const absValue = Math.abs(value);
    if (absValue >= 100000) {
      const lakhs = absValue / 100000;
      const sign = value < 0 ? '-' : '';
      return `${sign}₹${lakhs.toFixed(2)}L`;
    } else if (absValue >= 1000) {
      const thousands = absValue / 1000;
      const sign = value < 0 ? '-' : '';
      return `${sign}₹${thousands.toFixed(1)}K`;
    } else {
      return `₹${value.toFixed(0)}`;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground mb-2">{`${chartData.xAxis}: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-foreground">
                {entry.dataKey}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData.data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartData.type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartData.color || '#2563eb'} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={chartData.color || '#2563eb'} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={chartData.xAxis} className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" tickFormatter={formatCurrency} />
            <Area
              type="monotone"
              dataKey={chartData.yAxis}
              stroke={chartData.color || '#2563eb'}
              strokeWidth={3}
              fill="url(#areaGradient)"
            />
            <Tooltip content={<CustomTooltip />} />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={chartData.xAxis} className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" tickFormatter={formatCurrency} />
            <Bar dataKey={chartData.yAxis} fill={chartData.color || '#2563eb'} />
            <Tooltip content={<CustomTooltip />} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={chartData.xAxis} className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" tickFormatter={formatCurrency} />
            <Line
              type="monotone"
              dataKey={chartData.yAxis}
              stroke={chartData.color || '#2563eb'}
              strokeWidth={3}
              dot={{ fill: chartData.color || '#2563eb', strokeWidth: 2, r: 4 }}
            />
            <Tooltip content={<CustomTooltip />} />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={chartData.yAxis}
            >
              {chartData.data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={chartData.colors?.[index] || `hsl(${index * 45}, 70%, 50%)`} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  // Check if data is empty or invalid
  if (!chartData.data || chartData.data.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{chartData.title}</CardTitle>
          {chartData.description && <CardDescription>{chartData.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>No data available to display</p>
              <p className="text-sm mt-2">Chart data: {JSON.stringify(chartData.data)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{chartData.title}</CardTitle>
        {chartData.description && <CardDescription>{chartData.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Splitwise Friend Card Component
const SplitviseFriendCard = ({ friend, isPrivacyMode }: { friend: SplitviseFriendData; isPrivacyMode: boolean }) => {
  const totalBalance = friend.balance.reduce((sum, bal) => sum + parseFloat(bal.amount), 0);
  const isPositive = totalBalance > 0;

  const formatAmount = (amount: number) => {
    if (isPrivacyMode) return '••••••';
    const absValue = Math.abs(amount);
    if (absValue >= 100000) {
      return `₹${(absValue / 100000).toFixed(2)}L`;
    }
    if (absValue >= 1000) {
      return `₹${(absValue / 1000).toFixed(1)}K`;
    }
    return `₹${absValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <Card className="cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.05] relative group">
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
              {formatAmount(Math.abs(totalBalance))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Splitwise Group Card Component
const SplitwiseGroupCard = ({ group, isPrivacyMode }: { group: SplitwiseGroupData; isPrivacyMode: boolean }) => {
  const isPositive = group.outstandingBalance >= 0;

  const formatAmount = (amount: number) => {
    if (isPrivacyMode) return '••••••';
    const absValue = Math.abs(amount);
    if (absValue >= 100000) {
      return `₹${(absValue / 100000).toFixed(2)}L`;
    }
    if (absValue >= 1000) {
      return `₹${(absValue / 1000).toFixed(1)}K`;
    }
    return `₹${absValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getGroupAvatar = () => {
    if (group.avatar?.medium) return group.avatar.medium;
    if (group.cover_photo?.large) return group.cover_photo.large;
    return null;
  };

  const getGroupIcon = (groupName: string) => {
    const name = groupName.toLowerCase();
    if (name.includes('house') || name.includes('flat') || name.includes('home')) return Users;
    if (name.includes('trip') || name.includes('travel') || name.includes('vacation')) return Users;
    return Users;
  };

  const GroupIconComponent = getGroupIcon(group.name);

  return (
    <Card className="cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.05] relative group">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Group Avatar/Cover - Centered */}
          <div className="flex justify-center mb-3">
            {getGroupAvatar() ? (
              <div className="h-16 w-16 rounded-lg overflow-hidden shadow-sm border border-gray-100">
                <Image 
                  src={getGroupAvatar()!} 
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
              {formatAmount(Math.abs(group.outstandingBalance))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Splitwise Activity Card Component
const SplitwiseActivityCard = ({ activity, isPrivacyMode }: { activity: SplitwiseActivityData; isPrivacyMode: boolean }) => {
  const formatAmount = (amount: number) => {
    if (isPrivacyMode) return '••••••';
    const absValue = Math.abs(amount);
    if (absValue >= 100000) {
      return `₹${(absValue / 100000).toFixed(2)}L`;
    }
    if (absValue >= 1000) {
      return `₹${(absValue / 1000).toFixed(1)}K`;
    }
    return `₹${absValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDateWithSuffix = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";

    return `${month} ${day}${suffix}, ${year}`;
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('food')) return '🍽️';
    if (name.includes('grocery') || name.includes('shopping')) return '🛒';
    if (name.includes('rent') || name.includes('house')) return '🏠';
    if (name.includes('transport') || name.includes('car') || name.includes('gas')) return '🚗';
    if (name.includes('coffee') || name.includes('drink')) return '☕';
    if (name.includes('entertainment') || name.includes('movie') || name.includes('game')) return '🎮';
    if (name.includes('gift')) return '🎁';
    return '💰';
  };

  const expenseDate = new Date(activity.date);

  return (
    <Card className="p-3 sm:p-4 cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] relative flex flex-col justify-between h-full">
      <div className="absolute top-2 right-2 text-muted-foreground" title={activity.category.name}>
        <span className="text-lg">{getCategoryIcon(activity.category.name)}</span>
      </div>
      
      <div className="flex flex-col flex-grow">
        <p className={`text-sm font-medium mb-2`}>
          {activity.myShare.type === 'lent' ? 'You lent' : activity.myShare.type === 'borrowed' ? 'You owe' : 'Settled'}
        </p>

        <div className={`text-2xl font-bold mb-1 ${
          activity.myShare.type === 'lent' ? 'text-green-600' : 
          activity.myShare.type === 'borrowed' ? 'text-red-500' : 
          'text-gray-600'
        }`}>
          {isPrivacyMode ? '••••••' : formatAmount(activity.myShare.amount)}
        </div>

        <p className="text-sm font-medium text-foreground truncate" title={activity.description}>
          {isPrivacyMode ? '••••••••••••••••' : activity.description}
        </p>

        <p className="text-xs text-muted-foreground mt-1">
          {isPrivacyMode ? '•••••• paid ••••••' : `Total: ${formatAmount(parseFloat(activity.cost))}`}
        </p>
      </div>
      
      <div className="mt-4 pt-2 border-t border-muted/50 flex items-center text-xs text-muted-foreground">
        <Calendar className="h-3 w-3 mr-1.5" />
        <span>{formatDateWithSuffix(expenseDate)}</span>
      </div>
    </Card>
  );
};

// Transaction Card Component (Fixed height)
const TransactionCard = ({ transaction, isPrivacyMode }: { transaction: TransactionData; isPrivacyMode: boolean }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";

    return `${month} ${day}${suffix}, ${year}`;
  };

  const getBankLogo = (bankName: string, accountType: string, source: string) => {
    if (accountType === 'Credit Card' || accountType === 'credit_card') {
      const cardImageMap: Record<string, string> = {
        'HDFC Diners': '/cardImages/dinersCard.png',
        'HDFC Swiggy': '/cardImages/swiggyCard.png',
        'Axis Magnus': '/cardImages/magnusCard.png',
        'Flipkart Axis': '/cardImages/flipkartCard.webp',
      };
      
      if (cardImageMap[source]) return cardImageMap[source];
      if (source.includes('Swiggy') || bankName === 'HDFC Swiggy') return '/cardImages/swiggyCard.png';
      if (source.includes('Diners') || bankName === 'HDFC Diners') return '/cardImages/dinersCard.png';
      if (source.includes('Magnus') || bankName === 'Axis Magnus') return '/cardImages/magnusCard.png';
      if (source.includes('Flipkart') || bankName === 'Flipkart Axis') return '/cardImages/flipkartCard.webp';
    }
    
    const logoMap: Record<string, string> = {
      'HDFC': '/cardImages/hdfclogo.png',
      'Axis': '/cardImages/axislogo.png',
    };
    return logoMap[bankName];
  };

  return (
    <Card className="p-3 sm:p-4 cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] hover:z-10 relative group flex flex-col justify-between w-[180px] h-[200px] flex-shrink-0">
      {/* Source Icon - top right corner */}
      <div
        className="absolute top-2 right-2 text-muted-foreground transition-opacity duration-200"
        title={
          transaction.source === "email" 
            ? "Email" 
            : transaction.source === "manual" 
              ? "Manual" 
              : "Statement"
        }
      >
        {transaction.source === "email" || transaction.source.includes("email") ? (
          <Mail className="h-4 w-4" />
        ) : transaction.source === "manual" ? (
          <UserPlus className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </div>

      {/* Centered Bank Logo */}
      <div className="flex justify-center mb-2">
        <div
          className={`${
            transaction.account_type === "Credit Card"
              ? "w-16 h-10 sm:w-20 sm:h-12"
              : "w-10 h-6 sm:w-12 sm:h-8"
          } rounded-lg bg-card shadow-sm border border-border flex items-center justify-center overflow-hidden p-1`}
        >
          <Image
            src={getBankLogo(
              transaction.bank_name,
              transaction.account_type,
              transaction.source
            )}
            alt={`${transaction.bank_name} logo`}
            width={transaction.account_type === "Credit Card" ? 80 : 48}
            height={transaction.account_type === "Credit Card" ? 48 : 32}
            className="object-contain filter drop-shadow-sm max-w-full max-h-full"
            quality={100}
            priority={false}
          />
        </div>
      </div>

      {/* Middle section: Amount and description */}
      <div className="text-center my-1 flex-grow flex flex-col justify-center">
        {/* Amount */}
        <div
          className={`text-lg sm:text-xl font-bold ${
            transaction.type === "expense" ? "text-red-600" : "text-green-600"
          }`}
        >
          {transaction.type === "expense" ? "-" : "+"}
          {formatCurrencyInLakhs(transaction.amount, isPrivacyMode)}
        </div>

        {/* Description */}
        <div className="text-sm font-medium text-foreground px-1 mt-1 overflow-hidden text-ellipsis" style={{ 
          display: '-webkit-box', 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: 'vertical',
          maxHeight: '2.5rem'
        }}>
          {transaction.description}
        </div>
      </div>

      {/* Bottom section: Date */}
      <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1 mt-auto px-1">
        <Calendar className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{formatDate(transaction.date)}</span>
      </div>
    </Card>
  );
};

export default function ExperimentalPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Get personalized greeting based on current time
  const getPersonalizedGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });

    if (hour >= 7 && hour < 12) {
      return { text: "Morning champ! Tell me whatcha need?", icon: Sun };
    } else if (hour >= 12 && hour < 17) {
      return { text: "Noon! How's your mornin been, anything I can help with?", icon: Sun };
    } else if (hour >= 17 && hour < 22) {
      return { text: "Evening-tring! Day's starting to see, what do you wan know?", icon: Sunset };
    } else if (hour >= 22 || hour < 1) {
      return { text: "Night night! How was your day?", icon: Moon };
    } else {
      return { text: `Nothing good happens after ${timeString}`, icon: Sunrise };
    }
  };

  // Handle clicking on feature cards
  const handleCardClick = async (query: string) => {
    setMessage(query);
    // Trigger send automatically after setting the message
    setTimeout(async () => {
      if (!isLoading) {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: query,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setMessage('');
        setIsLoading(true);

        // Auto-scroll after sending message
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);

        // Add assistant loading message
        const loadingMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, loadingMessage]);

        try {
          const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [userMessage].map(msg => ({
                role: msg.role,
                content: msg.content,
              })),
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to send message');
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let accumulatedContent = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.content) {
                      accumulatedContent += data.content;
                      
                      // Parse all data types and clean content
                      const { cleanContent, transactions, chartData, splitwiseFriends, splitwiseGroups, splitwiseActivity } = parseAllData(accumulatedContent);
                      
                      // Update the loading message with accumulated content
                      setMessages(prev => prev.map(msg => 
                        msg.id === loadingMessage.id 
                          ? { ...msg, content: cleanContent, transactions, chartData, splitwiseFriends, splitwiseGroups, splitwiseActivity }
                          : msg
                      ));

                      // Auto-scroll during streaming
                      setTimeout(() => {
                        if (chatContainerRef.current) {
                          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                        }
                      }, 50);
                    }

                    if (data.done) {
                      setIsLoading(false);
                      break;
                    }
                  } catch (error) {
                    console.error('Error parsing streaming data:', error);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error sending message:', error);
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessage.id 
              ? { ...msg, content: 'Sorry, there was an error processing your request.' }
              : msg
          ));
        } finally {
          setIsLoading(false);
        }
      }
    }, 100);
  };

  // Load privacy preference from localStorage on mount
  useEffect(() => {
    const savedPrivacyMode = localStorage.getItem('privacyMode');
    if (savedPrivacyMode !== null) {
      setIsPrivacyMode(JSON.parse(savedPrivacyMode));
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Save privacy preference to localStorage when changed
  const handlePrivacyToggle = () => {
    const newPrivacyMode = !isPrivacyMode;
    setIsPrivacyMode(newPrivacyMode);
    localStorage.setItem('privacyMode', JSON.stringify(newPrivacyMode));
  };

  // Parse transaction data from message content
  const parseTransactionData = (content: string): { cleanContent: string; transactions: TransactionData[] } => {
    const transactionDataRegex = /<TRANSACTIONS_DATA>\s*([\s\S]*?)\s*<\/TRANSACTIONS_DATA>/;
    const match = content.match(transactionDataRegex);
    
    if (match) {
      try {
        const transactions = JSON.parse(match[1]);
        const cleanContent = content.replace(transactionDataRegex, '').trim();
        return { cleanContent, transactions };
      } catch (error) {
        console.error('Error parsing transaction data:', error);
      }
    }
    
    return { cleanContent: content, transactions: [] };
  };

  // Parse chart data from message content
  const parseChartData = (content: string): { cleanContent: string; chartData?: ChartData } => {
    const chartDataRegex = /<CHART_DATA>\s*([\s\S]*?)\s*<\/CHART_DATA>/;
    const match = content.match(chartDataRegex);
    
    if (match) {
      try {
        const chartData = JSON.parse(match[1]);
        const cleanContent = content.replace(chartDataRegex, '').trim();
        return { cleanContent, chartData };
      } catch (error) {
        console.error('Error parsing chart data:', error);
      }
    }
    
    return { cleanContent: content };
  };

  // Parse Splitwise friends data from message content
  const parseSplitwiseFriendsData = (content: string): { cleanContent: string; splitwiseFriends?: SplitviseFriendData[] } => {
    const friendsDataRegex = /<SPLITWISE_FRIENDS_DATA>\s*([\s\S]*?)\s*<\/SPLITWISE_FRIENDS_DATA>/;
    const match = content.match(friendsDataRegex);
    
    if (match) {
      try {
        const splitwiseFriends = JSON.parse(match[1]);
        const cleanContent = content.replace(friendsDataRegex, '').trim();
        return { cleanContent, splitwiseFriends };
      } catch (error) {
        console.error('Error parsing Splitwise friends data:', error);
      }
    }
    
    return { cleanContent: content };
  };

  // Parse Splitwise groups data from message content
  const parseSplitwiseGroupsData = (content: string): { cleanContent: string; splitwiseGroups?: SplitwiseGroupData[] } => {
    const groupsDataRegex = /<SPLITWISE_GROUPS_DATA>\s*([\s\S]*?)\s*<\/SPLITWISE_GROUPS_DATA>/;
    const match = content.match(groupsDataRegex);
    
    if (match) {
      try {
        const splitwiseGroups = JSON.parse(match[1]);
        const cleanContent = content.replace(groupsDataRegex, '').trim();
        return { cleanContent, splitwiseGroups };
      } catch (error) {
        console.error('Error parsing Splitwise groups data:', error);
      }
    }
    
    return { cleanContent: content };
  };

  // Parse Splitwise activity data from message content
  const parseSplitwiseActivityData = (content: string): { cleanContent: string; splitwiseActivity?: SplitwiseActivityData[] } => {
    const activityDataRegex = /<SPLITWISE_ACTIVITY_DATA>\s*([\s\S]*?)\s*<\/SPLITWISE_ACTIVITY_DATA>/;
    const match = content.match(activityDataRegex);
    
    if (match) {
      try {
        const splitwiseActivity = JSON.parse(match[1]);
        const cleanContent = content.replace(activityDataRegex, '').trim();
        return { cleanContent, splitwiseActivity };
      } catch (error) {
        console.error('Error parsing Splitwise activity data:', error);
      }
    }
    
    return { cleanContent: content };
  };

  // Parse all data types from message content
  const parseAllData = (content: string) => {
    let cleanContent = content;
    let transactions: TransactionData[] = [];
    let chartData: ChartData | undefined;
    let splitwiseFriends: SplitviseFriendData[] | undefined;
    let splitwiseGroups: SplitwiseGroupData[] | undefined;
    let splitwiseActivity: SplitwiseActivityData[] | undefined;

    // Parse transactions
    const transactionResult = parseTransactionData(cleanContent);
    cleanContent = transactionResult.cleanContent;
    transactions = transactionResult.transactions;

    // Parse chart data
    const chartResult = parseChartData(cleanContent);
    cleanContent = chartResult.cleanContent;
    chartData = chartResult.chartData;

    // Parse Splitwise friends
    const friendsResult = parseSplitwiseFriendsData(cleanContent);
    cleanContent = friendsResult.cleanContent;
    splitwiseFriends = friendsResult.splitwiseFriends;

    // Parse Splitwise groups
    const groupsResult = parseSplitwiseGroupsData(cleanContent);
    cleanContent = groupsResult.cleanContent;
    splitwiseGroups = groupsResult.splitwiseGroups;

    // Parse Splitwise activity
    const activityResult = parseSplitwiseActivityData(cleanContent);
    cleanContent = activityResult.cleanContent;
    splitwiseActivity = activityResult.splitwiseActivity;

    return {
      cleanContent,
      transactions,
      chartData,
      splitwiseFriends,
      splitwiseGroups,
      splitwiseActivity
    };
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    // Auto-scroll after sending message
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);

    // Add assistant loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let hasStartedStreaming = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedContent += data.content;
                  hasStartedStreaming = true;
                  
                  // Parse all data types and clean content
                  const { cleanContent, transactions, chartData, splitwiseFriends, splitwiseGroups, splitwiseActivity } = parseAllData(accumulatedContent);
                  
                  // Update the loading message with accumulated content
                  setMessages(prev => prev.map(msg => 
                    msg.id === loadingMessage.id 
                      ? { ...msg, content: cleanContent, transactions, chartData, splitwiseFriends, splitwiseGroups, splitwiseActivity }
                      : msg
                  ));

                  // Auto-scroll during streaming
                  setTimeout(() => {
                    if (chatContainerRef.current) {
                      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                    }
                  }, 50);
                }
                if (data.done) {
                  break;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Update loading message with error
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <Header 
        isPrivacyMode={isPrivacyMode}
        onPrivacyToggle={handlePrivacyToggle}
      />
      
      <div className="mb-4">
        <Card>
          <CardContent className="p-0">
            <div className="h-[calc(100vh-220px)] flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden">
                {messages.length === 0 ? (
                  // Welcome Screen
                  <div className="h-full flex flex-col items-center justify-center p-8">
                    <div className="w-full max-w-3xl text-center space-y-8">
                      {/* Coins Icon and Title */}
                      <div className="flex flex-col items-center space-y-6">
               
                        <div className="flex items-center justify-center gap-3">
                          {(() => {
                            const greeting = getPersonalizedGreeting();
                            const IconComponent = greeting.icon;
                            const now = new Date();
                            const timeString = now.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit', 
                              hour12: true 
                            });
                            
                            // Split the text to highlight the time part
                            const textParts = greeting.text.split(timeString);
                            
                            return (
                              <>
                                <IconComponent className="h-8 w-8 text-muted-foreground" />
                                <h1 className="text-3xl font-semibold text-foreground">
                                  {textParts[0]}
                                  {greeting.text.includes(timeString) && (
                                    <span className="relative inline-block mx-1">
                                      <span className="relative z-10 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-lg font-medium">
                                        {timeString}
                                      </span>
                                    </span>
                                  )}
                                  {textParts[1] || ''}
                                </h1>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Feature Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card 
                          className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border hover:border-foreground/20 group"
                          onClick={() => handleCardClick("How much have I spent on Swiggy in the last 7 days?")}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="bg-foreground/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                              <DollarSign className="h-6 w-6 text-foreground" />
                            </div>
                            <h3 className="font-semibold mb-2 text-foreground">Swiggy Spending Analysis</h3>
                            <p className="text-sm text-muted-foreground">
                              &quot;How much have I spent on Swiggy in the last 7 days?&quot;
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card 
                          className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border hover:border-foreground/20 group"
                          onClick={() => handleCardClick("How much have I spent month-on-month on Shopping in the last 6 months?")}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="bg-foreground/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                              <TrendingUp className="h-6 w-6 text-foreground" />
                            </div>
                            <h3 className="font-semibold mb-2 text-foreground">Shopping Trends</h3>
                            <p className="text-sm text-muted-foreground">
                              &quot;How much have I spent month-on-month on Shopping in the last 6 months?&quot;
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card 
                          className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border hover:border-foreground/20 group"
                          onClick={() => handleCardClick("Who are the friends that owe me the most money on Splitwise?")}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="bg-foreground/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                              <Users className="h-6 w-6 text-foreground" />
                            </div>
                            <h3 className="font-semibold mb-2 text-foreground">Splitwise Friends</h3>
                            <p className="text-sm text-muted-foreground">
                              &quot;Who are the friends that owe me the most money on Splitwise?&quot;
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Chat Messages with proper scroll
                  <div className="h-full overflow-y-auto" ref={chatContainerRef}>
                    <div className="p-4 space-y-6">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                <Image
                                  src={msg.role === 'user' 
                                    ? '/misc-assets/question 1.png' 
                                    : '/misc-assets/shell.png'
                                  }
                                  alt={msg.role === 'user' ? 'User' : 'AI'}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                />
                              </div>
                            </div>

                            {/* Message Bubble */}
                            <div className={`rounded-lg px-4 py-3 ${
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground ml-2' 
                                : 'bg-muted text-foreground mr-2'
                            }`}>
                              {/* Timestamp */}
                              <div className={`text-xs text-muted-foreground mb-2 ${msg.role === 'user' ? 'text-right text-primary-foreground/70' : 'text-left'}`}>
                                {msg.timestamp.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit', 
                                  hour12: true 
                                })}
                              </div>
                              
                              {msg.role === 'assistant' && !msg.content && !msg.transactions && !msg.chartData && !msg.splitwiseFriends && !msg.splitwiseGroups && !msg.splitwiseActivity && isLoading ? (
                                <div className="flex items-center space-x-2">
                                  <div className="animate-pulse">💡 Thinking...</div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* Text Content */}
                                  {msg.content && (
                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                                          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                                          li: ({ children }) => <li className="mb-1">{children}</li>,
                                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                          code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                                          pre: ({ children }) => <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-sm">{children}</pre>,
                                          h1: ({ children }) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
                                          h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                                          h3: ({ children }) => <h3 className="text-sm font-semibold mb-2">{children}</h3>,
                                        }}
                                      >
                                        {msg.content}
                                      </ReactMarkdown>
                                    </div>
                                  )}
                                  
                                  {/* Chart Component */}
                                  {msg.chartData && (
                                    <div className="mt-6">
                                      <ChartComponent 
                                        chartData={msg.chartData} 
                                        isPrivacyMode={isPrivacyMode}
                                      />
                                    </div>
                                  )}

                                  {/* Transaction Cards */}
                                  {msg.transactions && msg.transactions.length > 0 && (
                                    <div className="mt-6">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 justify-items-center">
                                        {msg.transactions.map((transaction) => (
                                          <TransactionCard 
                                            key={transaction.id}
                                            transaction={transaction} 
                                            isPrivacyMode={isPrivacyMode}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Splitwise Friends Cards */}
                                  {msg.splitwiseFriends && msg.splitwiseFriends.length > 0 && (
                                    <div className="mt-6">
                                      <h4 className="text-sm font-semibold mb-3 text-foreground">Friends</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 justify-items-center">
                                        {msg.splitwiseFriends.map((friend) => (
                                          <SplitviseFriendCard 
                                            key={friend.id}
                                            friend={friend} 
                                            isPrivacyMode={isPrivacyMode}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Splitwise Groups Cards */}
                                  {msg.splitwiseGroups && msg.splitwiseGroups.length > 0 && (
                                    <div className="mt-6">
                                      <h4 className="text-sm font-semibold mb-3 text-foreground">Groups</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 justify-items-center">
                                        {msg.splitwiseGroups.map((group) => (
                                          <SplitwiseGroupCard 
                                            key={group.id}
                                            group={group} 
                                            isPrivacyMode={isPrivacyMode}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Splitwise Activity Cards */}
                                  {msg.splitwiseActivity && msg.splitwiseActivity.length > 0 && (
                                    <div className="mt-6">
                                      <h4 className="text-sm font-semibold mb-3 text-foreground">Recent Activity</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 justify-items-center">
                                        {msg.splitwiseActivity.map((activity) => (
                                          <SplitwiseActivityCard 
                                            key={activity.id}
                                            activity={activity} 
                                            isPrivacyMode={isPrivacyMode}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6">
                <div className="max-w-4xl mx-auto space-y-3">
                  <div className="relative">
                    <ChatInput
                      ref={chatInputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask anything about your finances - charts and visualizations will appear automatically..."
                      disabled={isLoading}
                      className="min-h-[52px] max-h-32 resize-none bg-transparent border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/30 focus:border-foreground/50 pl-4 pr-14 py-3"
                    />
                    <Button 
                      onClick={handleSend}
                      disabled={!message.trim() || isLoading}
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-foreground hover:bg-foreground/90 text-background"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Verified Data Labels */}
                  <div className="flex flex-wrap justify-center gap-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <CheckCircle className="h-3 w-3" />
                      Your Splitwise Data
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <CheckCircle className="h-3 w-3" />
                      Your Transactions
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <CheckCircle className="h-3 w-3" />
                      All Your Accounts and Credit Cards Data
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 