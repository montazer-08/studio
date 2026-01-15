'use client';
import { useState } from 'react';
import { BookText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Note } from '@/lib/types';
import { NewNoteDialog } from '@/components/notes/new-note-dialog';
import { NoteList } from '@/components/notes/note-list';
import { NoteViewer } from '@/components/notes/note-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalization } from '@/components/layout/localization-provider';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function NotesPage() {
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { t } = useLocalization();
  const { toast } = useToast();

  const notesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'notes'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: notes, isLoading: areNotesLoading } = useCollection<Note>(notesQuery);

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
  };
  
  const handleNoteCreated = (note: Note) => {
    setSelectedNote(note);
  }

  const handleDeleteRequest = (note: Note) => {
    setDeletingNote(note);
  };

  const handleDeleteConfirm = () => {
    if (!deletingNote || !user) return;
    const noteRef = doc(firestore, 'users', user.uid, 'notes', deletingNote.id);
    deleteDocumentNonBlocking(noteRef);
    toast({
        title: t.notes.deleteSuccessTitle,
        description: `"${deletingNote.title}" ${t.notes.deleteSuccessDescription}`,
    });
    setDeletingNote(null);
    if(selectedNote?.id === deletingNote.id){
      setSelectedNote(null);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 h-full">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <BookText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold font-headline">{t.notes.title}</h1>
            <p className="text-lg text-muted-foreground">{t.notes.description}</p>
          </div>
        </div>
         <Button onClick={() => setIsNewNoteOpen(true)} variant="default" disabled={!user}>
            <Plus className="me-2 h-4 w-4" /> {t.notes.newNoteButton}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 h-[calc(100%-120px)]">
         <div className="md:col-span-1 lg:col-span-1 border rounded-lg h-full overflow-y-auto">
            {(isUserLoading || areNotesLoading) ? (
                <div className="p-4 space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <NoteList notes={notes || []} onSelectNote={handleSelectNote} selectedNoteId={selectedNote?.id}/>
            )}
        </div>
        <div className="md:col-span-2 lg:col-span-3 border rounded-lg h-full overflow-y-auto">
            <NoteViewer note={selectedNote} onDeleteRequest={handleDeleteRequest} />
        </div>
      </div>

      {user && <NewNoteDialog open={isNewNoteOpen} onOpenChange={setIsNewNoteOpen} userId={user.uid} onNoteCreated={handleNoteCreated}/>}
      {deletingNote && (
        <DeleteConfirmationDialog
            open={!!deletingNote}
            onOpenChange={() => setDeletingNote(null)}
            onConfirm={handleDeleteConfirm}
            title={t.deleteDialog.titleNote}
            description={`${t.deleteDialog.description} "${deletingNote.title}".`}
        />
      )}
    </div>
  );
}
