'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, CheckSquare, BookText, BarChart } from "lucide-react";
import { useUser } from "@/firebase";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { collection, query } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Task, Note } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useLocalization } from "@/components/layout/localization-provider";

function AnalyticsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
            <div className="lg:col-span-3">
                 <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { t } = useLocalization();

    const tasksQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'tasks'));
    }, [firestore, user]);

    const notesQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'notes'));
    }, [firestore, user]);

    const { data: tasks, isLoading: areTasksLoading } = useCollection<Task>(tasksQuery);
    const { data: notes, isLoading: areNotesLoading } = useCollection<Note>(notesQuery);

    const isLoading = isUserLoading || areTasksLoading || areNotesLoading;

    const completedTasks = tasks?.filter(task => task.status === 'Done').length || 0;
    const totalTasks = tasks?.length || 0;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const tasksByStatus = [
        { name: t.tasks.statuses["To Do"], count: tasks?.filter(t => t.status === 'To Do').length || 0 },
        { name: t.tasks.statuses["In Progress"], count: tasks?.filter(t => t.status === 'In Progress').length || 0 },
        { name: t.tasks.statuses.Done, count: tasks?.filter(t => t.status === 'Done').length || 0 },
    ];
    
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <LineChart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-headline">{t.sidebar.analytics}</h1>
          <p className="text-lg text-muted-foreground">Insights into your productivity and performance.</p>
        </div>
      </div>
      
      {isLoading ? <AnalyticsSkeleton /> : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><CheckSquare /> Task Completion</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{completedTasks} / {totalTasks}</p>
                    <Progress value={completionPercentage} className="mt-2" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><BookText /> Notes Created</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-3xl font-bold">{notes?.length || 0}</p>
                     <p className="text-sm text-muted-foreground">Total notes in your knowledge base.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">Task Priorities</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-around">
                        <div className="text-center"><p className="font-bold text-lg">{tasks?.filter(t => t.priority === 'High').length}</p><p className="text-sm text-destructive">{t.tasks.priorities.High}</p></div>
                        <div className="text-center"><p className="font-bold text-lg">{tasks?.filter(t => t.priority === 'Medium').length}</p><p className="text-sm text-yellow-500">{t.tasks.priorities.Medium}</p></div>
                        <div className="text-center"><p className="font-bold text-lg">{tasks?.filter(t => t.priority === 'Low').length}</p><p className="text-sm text-green-500">{t.tasks.priorities.Low}</p></div>
                    </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><BarChart /> Task Status Distribution</CardTitle>
                        <CardDescription>A visual breakdown of your tasks by their current status.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={tasksByStatus}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip wrapperClassName="!bg-popover !border-border" cursor={{fill: 'hsl(var(--muted))'}} />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
         </div>
      )}
    </div>
  );
}
