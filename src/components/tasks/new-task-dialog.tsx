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
import { useFirestore } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { useState, useTransition } from "react";
import { aiProcessTaskInput } from "@/ai/flows/ai-process-task-input";
import { useLocalization } from "../layout/localization-provider";
import { useAds } from '../ads/ads-provider';
import { useMemoFirebase } from "@/firebase/provider";

const taskFormSchema = z.object({
  name: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["To Do", "In Progress", "Done"]),
  dueDate: z.date().optional(),
});

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

// Counter for interstitial ad
let creationCount = 0;
const INTERSTITIAL_TRIGGER_COUNT = 3;

export function NewTaskDialog({ open, onOpenChange, userId }: NewTaskDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useLocalization();
  const [isAIPending, startAITransition] = useTransition();
  const { showInterstitialAd, isInterstitialReady } = useAds();
  
  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: "Medium",
      status: "To Do",
      dueDate: undefined,
    },
  });

  const tasksCollection = useMemoFirebase(() => collection(firestore, `users/${userId}/tasks`), [firestore, userId]);
  const notificationsCollection = useMemoFirebase(() => collection(firestore, `users/${userId}/notifications`), [firestore, userId]);

  const handleAISuggest = () => {
    const taskInput = form.getValues("name");
    if (!taskInput) {
        toast({
            variant: "destructive",
            title: t.newTask.aiErrorInputNeededTitle,
            description: t.newTask.aiErrorInputNeededDescription,
        });
        return;
    }

    startAITransition(async () => {
        try {
            const result = await aiProcessTaskInput({ taskInput });
            form.setValue("name", result.name);
            if (result.description) form.setValue("description", result.description);
            form.setValue("priority", result.priority);
            form.setValue("status", result.status);
            if (result.dueDate) {
                // Important: Parse date string into a Date object for the calendar
                const dateParts = result.dueDate.split('-').map(Number);
                const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                form.setValue("dueDate", localDate);
            }
            toast({
                title: t.newTask.aiSuccessTitle,
                description: t.newTask.aiSuccessDescription,
            });
        } catch (error) {
            console.error("AI processing error:", error);
            toast({
                variant: "destructive",
                title: t.newTask.aiErrorTitle,
                description: t.newTask.aiErrorDescription,
            });
        }
    });
  };

  const onSubmit = (values: z.infer<typeof taskFormSchema>) => {
    const taskData = {
        ...values,
        userId,
        dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : undefined,
    };
    addDocumentNonBlocking(tasksCollection, taskData);

    const notificationData = {
        userId,
        type: 'task_created',
        message: `New task created: "${values.name}"`,
        createdAt: serverTimestamp(),
        isRead: false,
    };
    addDocumentNonBlocking(notificationsCollection, notificationData);

    toast({
        title: t.newTask.toastSuccessTitle,
        description: `"${values.name}" ${t.newTask.toastSuccessDescription}`,
    });
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
        if (!isOpen) {
          form.reset();
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.newTask.title}</DialogTitle>
          <DialogDescription>
            {t.newTask.description}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.newTask.taskTitleLabel}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                        <Input placeholder={t.newTask.taskTitlePlaceholder} {...field} />
                         <Button variant="outline" size="icon" type="button" onClick={handleAISuggest} disabled={isAIPending}>
                            <Sparkles className={cn("h-4 w-4", isAIPending && "animate-spin")} />
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.newTask.descriptionLabel}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t.newTask.descriptionPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t.newTask.priorityLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={t.newTask.priorityPlaceholder} />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Low">{t.tasks.priorities.Low}</SelectItem>
                            <SelectItem value="Medium">{t.tasks.priorities.Medium}</SelectItem>
                            <SelectItem value="High">{t.tasks.priorities.High}</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t.newTask.statusLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={t.newTask.statusPlaceholder} />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="To Do">{t.tasks.statuses["To Do"]}</SelectItem>
                            <SelectItem value="In Progress">{t.tasks.statuses["In Progress"]}</SelectItem>
                            <SelectItem value="Done">{t.tasks.statuses.Done}</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t.newTask.dueDateLabel}</FormLabel>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start ps-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>{t.newTask.dueDatePlaceholder}</span>
                          )}
                          <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
                <Button type="submit">{t.newTask.createButton}</Button>
            </DialogFooter>
          </form>
        </Form>
        
      </DialogContent>
    </Dialog>
  );
}
