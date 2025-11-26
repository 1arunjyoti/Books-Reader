"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Flame,
  BarChart3,
  Calendar
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Lazy load heavy chart components
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
import { getReadingStats, ReadingStats } from '@/lib/api';

import { useAuth } from '@clerk/nextjs';

export function ReadingStatsDashboard() {
  const { getToken } = useAuth();
  const [isDark, setIsDark] = useState(false);

  // ... (theme detection useEffect remains same)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      setIsDark(document.documentElement.classList.contains('dark') || mql.matches);
    };
    update();
    if (mql.addEventListener) {
      mql.addEventListener('change', update);
    } else {
      // Safari / older browsers
      type LegacyMql = MediaQueryList & {
        addListener?: (listener: (e: MediaQueryListEvent) => void) => void;
      };
      const legacy = mql as LegacyMql;
      legacy.addListener?.(update as unknown as (e: MediaQueryListEvent) => void);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', update);
      } else {
        type LegacyMqlR = MediaQueryList & {
          removeListener?: (listener: (e: MediaQueryListEvent) => void) => void;
        };
        const legacyR = mql as LegacyMqlR;
        legacyR.removeListener?.(update as unknown as (e: MediaQueryListEvent) => void);
      }
    };
  }, []);

  const palette = isDark
    ? {
        primary: '#60A5FA', // blue-400
        primaryGradientStart: 'rgba(96,165,250,0.5)',
        primaryGradientEnd: 'rgba(96,165,250,0)',
        bar: '#FB923C', // orange-400
        pagesLine: '#34D399', // green-300
        minutesTooltip: '#93C5FD',
        pagesTooltip: '#86EFAC',
      }
    : {
        primary: '#2563EB', // blue-600
        primaryGradientStart: 'rgba(37,99,235,0.85)',
        primaryGradientEnd: 'rgba(37,99,235,0)',
        bar: '#F97316', // orange-500
        pagesLine: '#059669', // green-600
        minutesTooltip: '#1E40AF',
        pagesTooltip: '#047857',
      };
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [period, setPeriod] = useState<'all' | 'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await getReadingStats(period, token);
      setStats(data);
    } catch (error) {
      console.error('Error loading reading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDateDM = (value: string | number | Date) => {
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load reading statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm">
          {(['week', 'month', 'year', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${period === p 
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }
              `}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Books Read */}
        <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl relative overflow-hidden group hover:border-blue-300/50 dark:hover:border-blue-700/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen className="h-16 w-16 text-blue-500 transform rotate-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Books Finished</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              {stats.booksFinished ?? 0}
            </div>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">
              {stats.booksReading ?? 0} currently reading
            </p>
          </CardContent>
        </Card>

        {/* Reading Time */}
        <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl relative overflow-hidden group hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="h-16 w-16 text-purple-500 transform -rotate-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reading Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              {formatTime(stats.totalReadingTime ?? 0)}
            </div>
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1">
              {stats.sessionsCount ?? 0} reading sessions
            </p>
          </CardContent>
        </Card>

        {/* Pages Read */}
        <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl relative overflow-hidden group hover:border-green-300/50 dark:hover:border-green-700/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-16 w-16 text-green-500 transform rotate-6" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pages Read</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              {(stats.totalPagesRead ?? 0).toLocaleString()}
            </div>
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
              ~{stats.readingSpeed ?? 0} pages/hour
            </p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl relative overflow-hidden group hover:border-orange-300/50 dark:hover:border-orange-700/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame className="h-16 w-16 text-orange-500 transform -rotate-6" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              {stats.currentStreak ?? 0}
            </div>
            <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-1">
              {(stats.currentStreak ?? 0) === 1 ? 'day' : 'days'} in a row
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reading Time Chart */}
        <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              Daily Reading Time
            </CardTitle>
            <CardDescription>Minutes spent reading per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.primaryGradientStart} stopOpacity={0.9}/>
                      <stop offset="95%" stopColor={palette.primaryGradientEnd} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs font-medium text-gray-500"
                    tickFormatter={(value) => formatDateDM(value)}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    className="text-xs font-medium text-gray-500" 
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 p-3 rounded-xl shadow-xl">
                            <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">
                              {formatDateDM(data.date)}
                            </p>
                            <p className="text-sm font-medium flex items-center gap-2" style={{ color: palette.minutesTooltip }}>
                              <Clock className="w-3 h-3" />
                              {data.minutes} minutes
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="minutes" 
                    stroke={palette.primary} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMinutes)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pages Read Chart */}
        <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              Pages Per Day
            </CardTitle>
            <CardDescription>Number of pages read daily</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs font-medium text-gray-500"
                    tickFormatter={(value) => formatDateDM(value)}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    className="text-xs font-medium text-gray-500" 
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 p-3 rounded-xl shadow-xl">
                            <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">
                              {formatDateDM(data.date)}
                            </p>
                            <p className="text-sm font-medium flex items-center gap-2" style={{ color: palette.pagesTooltip }}>
                              <BookOpen className="w-3 h-3" />
                              {data.pages} pages
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="pages" 
                    fill={palette.bar} 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Chart */}
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg">Reading Activity Overview</CardTitle>
          <CardDescription>Combined view of reading time and pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  className="text-xs font-medium text-gray-500"
                  tickFormatter={(value) => formatDateDM(value)}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis yAxisId="left" className="text-xs font-medium text-gray-500" tickLine={false} axisLine={false} dx={-10} />
                <YAxis yAxisId="right" orientation="right" className="text-xs font-medium text-gray-500" tickLine={false} axisLine={false} dx={10} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 p-3 rounded-xl shadow-xl">
                          <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                            {formatDateDM(data.date)}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm font-medium flex items-center gap-2" style={{ color: palette.minutesTooltip }}>
                              <Clock className="w-3 h-3" />
                              {data.minutes} minutes
                            </p>
                            <p className="text-sm font-medium flex items-center gap-2" style={{ color: palette.pagesTooltip }}>
                              <BookOpen className="w-3 h-3" />
                              {data.pages} pages
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="minutes" 
                  stroke={palette.primary} 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: palette.primary }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Minutes"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="pages" 
                  stroke={palette.pagesLine} 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: palette.pagesLine }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Pages"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
