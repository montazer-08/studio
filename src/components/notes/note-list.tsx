'use client';

import { Note } from "@/lib/types";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { BookText } from "lucide-react";
import { useLocalization } from "../layout/localization-provider";

interface NoteListProps {
  notes: Note[];
  selectedNoteId?: string;
  onSelectNote: (note: Note) => void;
}

export function NoteList({ notes, selectedNoteId, onSelectNote }: NoteListProps) {
  const { t } = useLocalization();

  if (notes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
        <BookText className="w-12 h-12 mb-4" />
        <h3 className="font-semibold text-lg">{t.notes.noNotesTitle}</h3>
        <p className="text-sm">{t.notes.noNotesDescription}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <h2 className="text-lg font-semibold p-2 font-headline">{t.notes.allNotes}</h2>
        <div className="space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-colors",
                selectedNoteId === note.id
                  ? "bg-secondary"
                  : "hover:bg-muted/50"
              )}
            >
              <h3 className="font-medium truncate">{note.title}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {note.content.substring(0, 80) || t.notes.noContent}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {note.createdAt?.toDate ? format(note.createdAt.toDate(), 'MMM d, yyyy') : t.common.justNow}
              </p>
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
