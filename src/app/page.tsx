'use client';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CheckSquare, Clock, BookText, File as FileIcon, BrainCircuit } from 'lucide-react';
import { NewTaskDialog } from '@/components/tasks/new-task-dialog';
import { useState, useEffect, useTransition } from 'react';
import { useUser } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Task, Note, File } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { useLocalization } from '@/components/layout/localization-provider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { aiGenerateMotivation } from '@/ai/flows/ai-generate-motivation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function TaskItem({ task }: { task: Task }) {
  const { t } = useLocalization();

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getDateInfo = () => {
    if (!task.dueDate) return null;
    const date = parseISO(task.dueDate); // Use parseISO for reliability

    if (isPast(date) && !isToday(date)) {
        return { text: `${t.tasks.overdue} - ${format(date, 'MMM d')}`, color: 'text-destructive', Icon: Clock };
    }
    if (isToday(date)) {
        return { text: t.tasks.today, color: 'text-blue-500', Icon: Clock };
    }
    return { text: format(date, 'MMM d'), color: 'text-muted-foreground', Icon: Calendar };
  }

  const dateInfo = getDateInfo();

  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <CheckSquare className="h-5 w-5 text-muted-foreground" />
        <div className="flex flex-col">
          <p className="font-medium text-sm">{task.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {dateInfo && (
          <div className={cn("flex items-center gap-1 text-xs", dateInfo.color)}>
            <dateInfo.Icon className="h-4 w-4" />
            <span>{dateInfo.text}</span>
          </div>
        )}
        <Badge variant={getPriorityVariant(task.priority)} className="hidden sm:inline-flex">{t.tasks.priorities[task.priority]}</Badge>
      </div>
    </div>
  );
}

function RecentNoteItem({ note }: { note: Note }) {
    const { t } = useLocalization();
    return (
        <Link href="/notes" className="block p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors rounded-lg">
            <div className="flex items-center gap-3">
                <BookText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                    <p className="font-medium text-sm truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {note.createdAt?.toDate ? format(note.createdAt.toDate(), 'MMM d, yyyy') : t.common.justNow}
                    </p>
                </div>
            </div>
        </Link>
    );
}

function RecentFileItem({ file }: { file: File }) {
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    return (
        <Link href="/files" className="block p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors rounded-lg">
            <div className="flex items-center gap-3">
                <FileIcon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                    </p>
                </div>
            </div>
        </Link>
    );
}


export default function DashboardPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { t } = useLocalization();
  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);
  const [isGeneratingMotivation, startMotivationTransition] = useTransition();
  const { toast } = useToast();

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
  const todayEnd = new Date(now.setHours(23, 59, 59, 999)).toISOString().split('T')[0];

  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'tasks'),
        where('status', '!=', 'Done')
    );
  }, [firestore, user]);

  const recentNotesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'notes'), 
        orderBy('createdAt', 'desc'), 
        limit(5)
    );
  }, [firestore, user]);
  
  const recentFilesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'files'), 
        orderBy('uploadDate', 'desc'), 
        limit(5)
    );
  }, [firestore, user]);

  const { data: tasks, isLoading: areTasksLoading } = useCollection<Task>(tasksQuery);
  const { data: notes, isLoading: areNotesLoading } = useCollection<Note>(recentNotesQuery);
  const { data: files, isLoading: areFilesLoading } = useCollection<File>(recentFilesQuery);

  useEffect(() => {
    if (tasks && tasks.length > 0 && !motivationalMessage && !isGeneratingMotivation) {
        startMotivationTransition(async () => {
            try {
                const result = await aiGenerateMotivation({ tasks });
                setMotivationalMessage(result.message);
            } catch (error) {
                console.error("Failed to generate motivation:", error);
                // Don't show a toast, fail silently
            }
        });
    }
  }, [tasks, motivationalMessage, isGeneratingMotivation]);

  const overdueTasks = tasks?.filter(task => task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate))) || [];
  const todayTasks = tasks?.filter(task => task.dueDate && isToday(parseISO(task.dueDate))) || [];

  const isLoading = isUserLoading || areTasksLoading || areNotesLoading || areFilesLoading;

  return (
    <div className="flex-1">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-headline">
                {isUserLoading ? <Skeleton className="h-8 w-64"/> : `${t.home.welcomeBack}, ${user?.email?.split('@')[0] || 'User'}!`}
            </h1>
            <p className="text-muted-foreground">{t.home.commandCenter}</p>
          </div>
          <Button onClick={() => setIsNewTaskOpen(true)} variant="default" disabled={!user}>
            <Plus className="me-2 h-4 w-4" /> {t.home.newTaskButton}
          </Button>
        </div>
        
        {isGeneratingMotivation && (
             <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
                <BrainCircuit className="h-4 w-4" />
                <AlertTitle>{t.home.aiThinking}</AlertTitle>
                <AlertDescription>{t.home.aiThinkingDesc}</AlertDescription>
            </Alert>
        )}

        {motivationalMessage && !isGeneratingMotivation && (
            <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
                <BrainCircuit className="h-4 w-4" />
                <AlertTitle>{t.home.aiCoach}</AlertTitle>
                <AlertDescription>{motivationalMessage}</AlertDescription>
            </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Tasks */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive">{t.home.overdueTasks} ({overdueTasks.length})</CardTitle>
                        <CardDescription>{t.home.overdueTasksDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="space-y-2 p-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                        ) : overdueTasks.length > 0 ? (
                            <div>{overdueTasks.map(task => <TaskItem key={task.id} task={task} />)}</div>
                        ) : (
                            <p className="text-sm text-muted-foreground p-3 text-center">{t.home.noOverdue}</p>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>{t.home.todayTasks} ({todayTasks.length})</CardTitle>
                        <CardDescription>{t.home.todayTasksDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                         {isLoading ? (
                            <div className="space-y-2 p-3"><Skeleton className="h-12 w-full" /></div>
                        ) : todayTasks.length > 0 ? (
                            <div>{todayTasks.map(task => <TaskItem key={task.id} task={task} />)}</div>
                        ) : (
                            <p className="text-sm text-muted-foreground p-3 text-center">{t.home.noToday}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Column 3: Recent Activity */}
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t.home.recentNotes}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                         {isLoading ? (
                            <div className="space-y-2 p-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                        ) : notes && notes.length > 0 ? (
                            <div>{notes.map(note => <RecentNoteItem key={note.id} note={note} />)}</div>
                        ) : (
                            <p className="text-sm text-muted-foreground p-3 text-center">{t.home.noRecentNotes}</p>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>{t.home.recentFiles}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                          {isLoading ? (
                            <div className="space-y-2 p-3"><Skeleton className="h-12 w-full" /></div>
                        ) : files && files.length > 0 ? (
                            <div>{files.map(file => <RecentFileItem key={file.id} file={file} />)}</div>
                        ) : (
                            <p className="text-sm text-muted-foreground p-3 text-center">{t.home.noRecentFiles}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>

      </div>
      {user && <NewTaskDialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} userId={user.uid} />}
    </div>
  );
}
