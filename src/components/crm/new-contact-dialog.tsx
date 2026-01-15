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
import { collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocalization } from "../layout/localization-provider";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  company: z.string().optional(),
  status: z.enum(["Lead", "Customer", "Archived"]),
});

interface NewContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function NewContactDialog({ open, onOpenChange, userId }: NewContactDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useLocalization();
  
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      status: "Lead",
    },
  });

  const contactsCollection = collection(firestore, `users/${userId}/contacts`);

  const onSubmit = (values: z.infer<typeof contactFormSchema>) => {
    const contactData = { ...values, userId };
    addDocumentNonBlocking(contactsCollection, contactData);
    toast({
        title: t.crm.addSuccessTitle,
        description: `${values.name} ${t.crm.addSuccessDescription}`,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) form.reset();
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.crm.newContactDialog.title}</DialogTitle>
          <DialogDescription>
            {t.crm.newContactDialog.description}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.crm.newContactDialog.nameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.crm.newContactDialog.namePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.crm.newContactDialog.emailLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.crm.newContactDialog.emailPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.crm.newContactDialog.companyLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.crm.newContactDialog.companyPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t.crm.newContactDialog.statusLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={t.crm.newContactDialog.statusPlaceholder} />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Lead">{t.crm.statuses.Lead}</SelectItem>
                            <SelectItem value="Customer">{t.crm.statuses.Customer}</SelectItem>
                            <SelectItem value="Archived">{t.crm.statuses.Archived}</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

            <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
                <Button type="submit">{t.crm.addContactButton}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
