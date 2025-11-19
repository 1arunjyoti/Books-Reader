"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

interface ReadingGoalsProps {
  accessToken: string;
}

export function ReadingGoals({ accessToken }: ReadingGoalsProps) {
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
      const data = await getReadingGoals(accessToken);
      setGoals(data);
    } catch (error) {
      logger.error('Error loading reading goals:', error);
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
      const goalData: CreateGoalData = {
        type: goalType,
        period: goalPeriod,
        target
      };

      await createReadingGoal(goalData, accessToken);
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
      await deleteReadingGoal(id, accessToken);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reading Goals</h2>
          <p className="text-muted-foreground">Track and achieve your reading targets</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-[40vh] sm:max-w-lg rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'>
            <DialogHeader>
              <DialogTitle>Create Reading Goal</DialogTitle>
              <DialogDescription>
                Set a new reading goal to track your progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="goal-type">Goal Type</Label>
                <Select value={goalType} onValueChange={(value) => setGoalType(value as typeof goalType)}>
                  <SelectTrigger id="goal-type">
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
                  <SelectTrigger id="goal-period">
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
                />
                <p className="text-xs text-muted-foreground">
                  {goalType === 'time' && 'Enter minutes (e.g., 60 for 1 hour)'}
                  {goalType === 'books' && 'Number of books to read'}
                  {goalType === 'pages' && 'Number of pages to read'}
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGoal}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first reading goal to start tracking your progress
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal.current, goal.target);
            const isCompleted = isGoalCompleted(goal.current, goal.target);
            const daysRemaining = Math.ceil(
              (new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Card key={goal.id} className={isCompleted ? 'border-green-500' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getGoalIcon(goal.type)}
                      <CardTitle className="text-lg capitalize">{goal.period}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDeleteDialog(goal)}
                      title="Delete goal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="capitalize">
                    {goal.type} Goal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {formatCurrentValue(goal.type, goal.current)} / {getGoalLabel(goal.type, goal.target)}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{progress}% complete</span>
                      {!isCompleted && daysRemaining > 0 && (
                        <span>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left</span>
                      )}
                      {isCompleted && (
                        <span className="text-green-600 font-semibold flex items-center gap-1">
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
