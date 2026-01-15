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
import { doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { format, parseISO } from "date-fns";
import { useEffect } from "react";
import { useLocalization } from "../layout/localization-provider";
import { Task } from "@/lib/types";

const taskFormSchema = z.object({
  name: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["To Do", "In Progress", "Done"]),
  dueDate: z.date().optional(),
});

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  task: Task;
}

export function EditTaskDialog({ open, onOpenChange, userId, task }: EditTaskDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useLocalization();
  
  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
        name: task.name,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? parseISO(task.dueDate) : undefined,
    },
  });

  useEffect(() => {
    form.reset({
        name: task.name,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? parseISO(task.dueDate) : undefined,
    })
  }, [task, form])


  const onSubmit = (values: z.infer<typeof taskFormSchema>) => {
    const taskRef = doc(firestore, "users", userId, "tasks", task.id);
    const taskData = {
        ...values,
        dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : undefined,
    };
    updateDocumentNonBlocking(taskRef, taskData);
    toast({
        title: t.newTask.toastUpdateSuccessTitle,
        description: `"${values.name}" ${t.newTask.toastUpdateSuccessDescription}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.newTask.editTitle}</DialogTitle>
          <DialogDescription>
            {t.newTask.editDescription}
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
                    <Input placeholder={t.newTask.taskTitlePlaceholder} {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
                <Button type="submit">{t.common.saveChanges}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
