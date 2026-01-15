'use client';
import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Search, CheckSquare, BookText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUser } from "@/firebase";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { collection, query } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Task, Note } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { useLocalization } from '@/components/layout/localization-provider';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredTasks = useMemo(() => {
    if (!tasks || !searchTerm) return [];
    return tasks.filter(task => 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const filteredNotes = useMemo(() => {
    if (!notes || !searchTerm) return [];
    return notes.filter(note =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notes, searchTerm]);

  const isLoading = isUserLoading || areTasksLoading || areNotesLoading;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <Search className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-headline">{t.search.title}</h1>
          <p className="text-lg text-muted-foreground">{t.search.description}</p>
        </div>
      </div>
      
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
            placeholder={t.search.placeholder} 
            className="ps-10 text-lg h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading && searchTerm && (
        <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!isLoading && searchTerm && (
         <div className="space-y-6">
            {filteredTasks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CheckSquare /> {t.search.tasksTitle}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredTasks.map(task => (
                            <Link href="/tasks" key={task.id} className="block p-4 border-b last:border-b-0 hover:bg-muted/50">
                                <p className="font-semibold">{task.name}</p>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}
             {filteredNotes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookText /> {t.search.notesTitle}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredNotes.map(note => (
                            <Link href="/notes" key={note.id} className="block p-4 border-b last:border-b-0 hover:bg-muted/50">
                                <p className="font-semibold">{note.title}</p>
                                <p className="text-sm text-muted-foreground truncate">{note.content}</p>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

            {filteredTasks.length === 0 && filteredNotes.length === 0 && (
                 <div className="text-center text-muted-foreground py-16">
                    <h3 className="text-xl font-bold">{t.search.noResults} "{searchTerm}"</h3>
                    <p>{t.search.tryAgain}</p>
                 </div>
            )}
         </div>
      )}

      {!searchTerm && (
        <div className="text-center text-muted-foreground py-16">
            <Search className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold font-headline mb-2">{t.search.searchWorkspace}</h3>
            <p>{t.search.searchDescription}</p>
        </div>
      )}
    </div>
  );
}
