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
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { getReadingStats, ReadingStats } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface ReadingStatsDashboardProps {
  accessToken: string;
}

export function ReadingStatsDashboard({ accessToken }: ReadingStatsDashboardProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      // detect both explicit dark class (next-themes) and system preference
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
      const data = await getReadingStats(period, accessToken);
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
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={period === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('week')}
        >
          Week
        </Button>
        <Button
          variant={period === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('month')}
        >
          Month
        </Button>
        <Button
          variant={period === 'year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('year')}
        >
          Year
        </Button>
        <Button
          variant={period === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('all')}
        >
          All Time
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Books Read */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Finished</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.booksFinished}</div>
            <p className="text-xs text-muted-foreground">
              {stats.booksReading} currently reading
            </p>
          </CardContent>
        </Card>

        {/* Reading Time */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats.totalReadingTime)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sessionsCount} reading sessions
            </p>
          </CardContent>
        </Card>

        {/* Pages Read */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Read</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPagesRead.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ~{stats.readingSpeed} pages/hour
            </p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              {stats.currentStreak === 1 ? 'day' : 'days'} in a row
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Reading Time Chart */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Reading Time
            </CardTitle>
            <CardDescription>Minutes spent reading per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={palette.primaryGradientStart} stopOpacity={0.9}/>
                    <stop offset="95%" stopColor={palette.primaryGradientEnd} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tickFormatter={(value) => formatDateDM(value)}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                          <p className="text-sm font-semibold">
                            {formatDateDM(data.date)}
                          </p>
                          <p className="text-sm" style={{ color: palette.minutesTooltip }}>
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
                  fillOpacity={1} 
                  fill="url(#colorMinutes)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pages Read Chart */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Pages Per Day
            </CardTitle>
            <CardDescription>Number of pages read daily</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tickFormatter={(value) => formatDateDM(value)}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                          <p className="text-sm font-semibold">
                            {formatDateDM(data.date)}
                          </p>
                          <p className="text-sm" style={{ color: palette.pagesTooltip }}>
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
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Combined Chart */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Reading Activity Overview</CardTitle>
          <CardDescription>Combined view of reading time and pages</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => formatDateDM(value)}
              />
              <YAxis yAxisId="left" className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                        <p className="text-sm font-semibold mb-2">
                          {formatDateDM(data.date)}
                        </p>
                        <p className="text-sm" style={{ color: palette.minutesTooltip }}>
                          ⏱️ {data.minutes} minutes
                        </p>
                        <p className="text-sm" style={{ color: palette.pagesTooltip }}>
                          📖 {data.pages} pages
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="minutes" 
                stroke={palette.primary} 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Minutes"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="pages" 
                stroke={palette.pagesLine} 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Pages"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
