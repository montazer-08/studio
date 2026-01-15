'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Note } from "@/lib/types";
import { useLocalization } from "../layout/localization-provider";
import { useAds } from '../ads/ads-provider';

const noteFormSchema = z.object({
  title: z.string().min(1, "Title is required."),
  content: z.string().min(1, "Content is required."),
});


interface NewNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onNoteCreated?: (note: Note) => void;
}

// Counter for interstitial ad
let creationCount = 0;
const INTERSTITIAL_TRIGGER_COUNT = 3;

export function NewNoteDialog({ open, onOpenChange, userId, onNoteCreated }: NewNoteDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useLocalization();
  const { showInterstitialAd, isInterstitialReady } = useAds();
  
  const form = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const notesCollection = useMemoFirebase(() => collection(firestore, `users/${userId}/notes`), [firestore, userId]);
  const notificationsCollection = useMemoFirebase(() => collection(firestore, `users/${userId}/notifications`), [firestore, userId]);


  const onSubmit = async (values: z.infer<typeof noteFormSchema>) => {
    const newNoteDoc = doc(notesCollection); // Create a new doc ref to get the ID
    const newNote: Omit<Note, 'id'> = {
        ...values,
        userId,
        createdAt: serverTimestamp(),
    };
    
    addDocumentNonBlocking(notesCollection, newNote);

    const notificationData = {
        userId,
        type: 'note_created',
        message: `New note created: "${values.title}"`,
        createdAt: serverTimestamp(),
        isRead: false,
    };
    addDocumentNonBlocking(notificationsCollection, notificationData);

    toast({
        title: t.newNote.toastSuccessTitle,
        description: `"${values.title}" ${t.newNote.toastSuccessDescription}`,
    });
    
    if (onNoteCreated) {
        onNoteCreated({
            ...newNote,
            id: newNoteDoc.id, 
            createdAt: new Date(),
        });
    }

    form.reset();
    onOpenChange(false);

    // Interstitial Ad Logic
    creationCount++;
    if (creationCount % INTERSTITIAL_TRIGGER_COUNT === 0) {
        if(isInterstitialReady) {
            showInterstitialAd();
        }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) form.reset();
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.newNote.title}</DialogTitle>
          <DialogDescription>
            {t.newNote.description}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.newNote.noteTitleLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.newNote.noteTitlePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.newNote.contentLabel}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t.newNote.contentPlaceholder} {...field} rows={10} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
                <Button type="submit">{t.newNote.createButton}</Button>
            </DialogFooter>
          </form>
        </Form>
        
      </DialogContent>
    </Dialog>
  );
}
