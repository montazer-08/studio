'use client';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare, Clock, Calendar, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { NewTaskDialog } from '@/components/tasks/new-task-dialog';
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog';
import { useState } from 'react';
import { useUser } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Task } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isPast, isToday, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/components/layout/localization-provider';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { ar } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


function TaskItem({ task, onEdit, onDelete }: { task: Task, onEdit: (task: Task) => void, onDelete: (task: Task) => void }) {
  const { t, locale } = useLocalization();

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
    try {
        const date = parseISO(task.dueDate);
        
        const localeOptions = locale === 'ar' ? { locale: ar } : {};

        if (isPast(date) && !isToday(date)) {
            return { text: `${t.tasks.overdue} - ${formatDistanceToNow(date, { addSuffix: true, ...localeOptions })}`, color: 'text-destructive', Icon: Clock };
        }
        if (isToday(date)) {
            return { text: t.tasks.today, color: 'text-blue-500', Icon: Clock };
        }
        return { text: formatDistanceToNow(date, { addSuffix: true, ...localeOptions }), color: 'text-muted-foreground', Icon: Calendar };
    } catch(e) {
        console.error("Invalid date format for task", task.id, task.dueDate);
        return null;
    }
  }

  const dateInfo = getDateInfo();

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                    <CheckSquare className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                        <p className="font-medium">{task.name}</p>
                        <p className="text-sm text-muted-foreground">{t.tasks.statuses[task.status]}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {dateInfo && (
                        <div className={cn("flex items-center gap-1 text-sm", dateInfo.color)}>
                            <dateInfo.Icon className="h-4 w-4" />
                            <span>{dateInfo.text}</span>
                        </div>
                    )}
                    <Badge variant={getPriorityVariant(task.priority)} className="hidden sm:inline-flex">{t.tasks.priorities[task.priority]}</Badge>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(task)}>
                <Pencil className="me-2 h-4 w-4" />
                <span>{t.newTask.editTitle}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDelete(task)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <Trash2 className="me-2 h-4 w-4" />
                <span>{t.deleteDialog.titleTask}</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}


export default function TasksPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { t } = useLocalization();
  const { toast } = useToast();

  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'tasks'), orderBy('dueDate'));
  }, [firestore, user]);

  const { data: tasks, isLoading: areTasksLoading } = useCollection<Task>(tasksQuery);
  
  const handleDeleteConfirm = () => {
    if (!deletingTask || !user) return;
    const taskRef = doc(firestore, 'users', user.uid, 'tasks', deletingTask.id);
    deleteDocumentNonBlocking(taskRef);
    toast({
        title: t.tasks.deleteSuccessTitle,
        description: `"${deletingTask.name}" ${t.tasks.deleteSuccessDescription}`,
    });
    setDeletingTask(null);
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <CheckSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold font-headline">{t.tasks.title}</h1>
            <p className="text-lg text-muted-foreground">{t.tasks.description}</p>
          </div>
        </div>
        <Button onClick={() => setIsNewTaskOpen(true)} variant="default" disabled={!user}>
            <Plus className="me-2 h-4 w-4" /> {t.tasks.newTaskButton}
        </Button>
      </div>
      
      <Card>
            <CardHeader>
                <CardTitle>{t.tasks.allTasksTitle}</CardTitle>
                <CardDescription>{t.tasks.allTasksDescription}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 {(isUserLoading || areTasksLoading) && (
                    <div className="space-y-2 p-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                )}

                {!(isUserLoading || areTasksLoading) && tasks && tasks.length > 0 && (
                    <div>
                        {tasks.map(task => (
                            <TaskItem key={task.id} task={task} onEdit={setEditingTask} onDelete={setDeletingTask} />
                        ))}
                    </div>
                )}
                
                {!(isUserLoading || areTasksLoading) && (!tasks || tasks.length === 0) && (
                     <div className="text-center text-muted-foreground p-12">
                        <CheckSquare className="h-12 w-12 mx-auto mb-4"/>
                        <h3 className="text-xl font-semibold font-headline mb-1">{t.tasks.noTasksTitle}</h3>
                        <p>{t.tasks.noTasksDescription}</p>
                    </div>
                )}

            </CardContent>
        </Card>

      {user && <NewTaskDialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} userId={user.uid} />}
      {user && editingTask && <EditTaskDialog open={!!editingTask} onOpenChange={() => setEditingTask(null)} userId={user.uid} task={editingTask}/>}
      {deletingTask && (
        <DeleteConfirmationDialog
            open={!!deletingTask}
            onOpenChange={() => setDeletingTask(null)}
            onConfirm={handleDeleteConfirm}
            title={t.deleteDialog.titleTask}
            description={`${t.deleteDialog.description} "${deletingTask.name}".`}
        />
      )}
    </div>
  );
}
