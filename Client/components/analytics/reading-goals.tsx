"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BookOpen, 
  FileText, 
  Clock, 
  Plus,
  Trash2,
  Target,
  TrendingUp
} from 'lucide-react';
import { 
  getReadingGoals, 
  createReadingGoal, 
  deleteReadingGoal,
  ReadingGoal,
  CreateGoalData
} from '@/lib/api';
import { DeleteGoalDialog } from './delete-goal-dialog';
import { logger } from '@/lib/logger';

import { useAuth } from '@clerk/nextjs';

export function ReadingGoals() {
  const { getToken } = useAuth();
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<ReadingGoal | null>(null);
  
  // Form state
  const [goalType, setGoalType] = useState<'books' | 'pages' | 'time'>('books');
  const [goalPeriod, setGoalPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [goalTarget, setGoalTarget] = useState('');

  useEffect(() => {
    loadGoals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Load reading goals */
  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;
      
      const data = await getReadingGoals(token);
      // Handle case where API returns { goals: [...] } or just [...]
      if (Array.isArray(data)) {
        setGoals(data);
      } else if (data && typeof data === 'object' && 'goals' in data && Array.isArray((data as { goals: ReadingGoal[] }).goals)) {
        setGoals((data as { goals: ReadingGoal[] }).goals);
      } else {
        logger.warn('Unexpected response format for reading goals:', data);
        setGoals([]);
      }
    } catch (error) {
      logger.error('Error loading reading goals:', error);
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  };

  /* Handle creating a new goal */
  const handleCreateGoal = async () => {
    const target = parseInt(goalTarget);
    if (isNaN(target) || target <= 0) {
      alert('Please enter a valid target number');
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const goalData: CreateGoalData = {
        type: goalType,
        period: goalPeriod,
        target
      };

      await createReadingGoal(goalData, token);
      setShowCreateDialog(false);
      setGoalTarget('');
      await loadGoals();
    } catch (error) {
      logger.error('Error creating goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  /* Open delete dialog */
  const handleOpenDeleteDialog = (goal: ReadingGoal) => {
    setGoalToDelete(goal);
    setShowDeleteDialog(true);
  };

  /* Handle deleting a goal */
  const handleConfirmDelete = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await deleteReadingGoal(id, token);
      await loadGoals();
      setShowDeleteDialog(false);
      setGoalToDelete(null);
    } catch (error) {
      logger.error('Error deleting goal:', error);
      throw new Error('Failed to delete goal. Please try again.');
    }
  };

  /* Get goal icon */
  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'books':
        return <BookOpen className="h-5 w-5" />;
      case 'pages':
        return <FileText className="h-5 w-5" />;
      case 'time':
        return <Clock className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  /* Get goal label */
  const getGoalLabel = (type: string, target: number) => {
    switch (type) {
      case 'books':
        return `${target} ${target === 1 ? 'book' : 'books'}`;
      case 'pages':
        return `${target} pages`;
      case 'time':
        return `${Math.floor(target / 60)} hours`;
      default:
        return target.toString();
    }
  };

  /* Format current value */
  const formatCurrentValue = (type: string, current: number) => {
    switch (type) {
      case 'books':
        return `${current} ${current === 1 ? 'book' : 'books'}`;
      case 'pages':
        return `${current} pages`;
      case 'time':
        return `${Math.floor(current / 60)}h ${current % 60}m`;
      default:
        return current.toString();
    }
  };

  /* Calculate progress percentage */
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  /* Check if goal is completed */
  const isGoalCompleted = (current: number, target: number) => {
    return current >= target;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">Reading Goals</h2>
          <p className="text-muted-foreground mt-1">Track and achieve your reading targets</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-[40vh] sm:max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl'>
            <DialogHeader>
              <DialogTitle>Create Reading Goal</DialogTitle>
              <DialogDescription>
                Set a new reading goal to track your progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="goal-type">Goal Type</Label>
                <Select value={goalType} onValueChange={(value) => setGoalType(value as typeof goalType)}>
                  <SelectTrigger id="goal-type" className="h-11 rounded-lg">
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="pages">Pages</SelectItem>
                    <SelectItem value="time">Time (minutes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-period">Period</Label>
                <Select value={goalPeriod} onValueChange={(value) => setGoalPeriod(value as typeof goalPeriod)}>
                  <SelectTrigger id="goal-period" className="h-11 rounded-lg">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-target">Target</Label>
                <Input
                  id="goal-target"
                  type="number"
                  placeholder="Enter target number"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  min="1"
                  className="h-11 rounded-lg"
                />
                <p className="text-xs text-muted-foreground">
                  {goalType === 'time' && 'Enter minutes (e.g., 60 for 1 hour)'}
                  {goalType === 'books' && 'Number of books to read'}
                  {goalType === 'pages' && 'Number of pages to read'}
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-lg h-11">
                Cancel
              </Button>
              <Button onClick={handleCreateGoal} className="rounded-lg h-11 bg-blue-600 hover:bg-blue-700 text-white">Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              Create your first reading goal to start tracking your progress and stay motivated.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal.current, goal.target);
            const isCompleted = isGoalCompleted(goal.current, goal.target);
            const daysRemaining = Math.ceil(
              (new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            // Determine color scheme based on goal type
            let colorClass = "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
            let progressColor = "bg-blue-600";
            
            if (goal.type === 'pages') {
              colorClass = "text-green-500 bg-green-50 dark:bg-green-900/20";
              progressColor = "bg-green-600";
            } else if (goal.type === 'time') {
              colorClass = "text-purple-500 bg-purple-50 dark:bg-purple-900/20";
              progressColor = "bg-purple-600";
            }

            return (
              <Card 
                key={goal.id} 
                className={`
                  border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl 
                  transition-all duration-300 hover:shadow-xl hover:border-blue-300/50 dark:hover:border-blue-700/50
                  ${isCompleted ? 'ring-1 ring-green-500/50 dark:ring-green-500/30' : ''}
                `}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        {getGoalIcon(goal.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg capitalize font-bold">{goal.period}</CardTitle>
                        <CardDescription className="capitalize text-xs font-medium mt-0.5">
                          {goal.type} Goal
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      onClick={() => handleOpenDeleteDialog(goal)}
                      title="Delete goal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Progress</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrentValue(goal.type, goal.current)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">
                          / {getGoalLabel(goal.type, goal.target)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500' : progressColor}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs font-medium pt-1">
                      <span className={isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                        {progress}% complete
                      </span>
                      
                      {!isCompleted && daysRemaining > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                        </span>
                      )}
                      
                      {isCompleted && (
                        <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Completed!
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Goal Dialog */}
      {goalToDelete && (
        <DeleteGoalDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          goalId={goalToDelete.id}
          goalType={goalToDelete.type}
          goalPeriod={goalToDelete.period}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
}
