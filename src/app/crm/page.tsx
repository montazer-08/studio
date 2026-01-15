'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, Plus, Trash2 } from "lucide-react";
import { useUser } from "@/firebase";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Contact } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewContactDialog } from '@/components/crm/new-contact-dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLocalization } from '@/components/layout/localization-provider';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

function ContactItem({ contact, onDelete }: { contact: Contact, onDelete: (contact: Contact) => void }) {
    const { t } = useLocalization();

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Lead': return 'secondary';
            case 'Customer': return 'default';
            case 'Archived': return 'outline';
            default: return 'secondary';
        }
    }
    
    return (
        <div className="flex items-center justify-between p-4 border-b last:border-b-0">
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <p className="text-sm text-muted-foreground hidden sm:block">{contact.company}</p>
                <Badge variant={getStatusVariant(contact.status)}>{t.crm.statuses[contact.status]}</Badge>
                 <Button variant="ghost" size="icon" onClick={() => onDelete(contact)}>
                    <Trash2 className="h-4 w-4 text-destructive/70" />
                </Button>
            </div>
        </div>
    )
}

export default function CrmPage() {
    const [isNewContactOpen, setIsNewContactOpen] = useState(false);
    const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { t } = useLocalization();
    const { toast } = useToast();

    const contactsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'contacts'), orderBy('name'));
    }, [firestore, user]);

    const { data: contacts, isLoading: areContactsLoading } = useCollection<Contact>(contactsQuery);

    const isLoading = isUserLoading || areContactsLoading;

    const handleDeleteRequest = (contact: Contact) => {
        setDeletingContact(contact);
    };

    const handleDeleteConfirm = () => {
        if (!deletingContact || !user) return;
        const contactRef = doc(firestore, 'users', user.uid, 'contacts', deletingContact.id);
        deleteDocumentNonBlocking(contactRef);
        toast({
            title: t.crm.deleteSuccessTitle,
            description: `"${deletingContact.name}" ${t.crm.deleteSuccessDescription}`,
        });
        setDeletingContact(null);
    }


  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
            <h1 className="text-4xl font-bold font-headline">{t.crm.title}</h1>
            <p className="text-lg text-muted-foreground">{t.crm.description}</p>
            </div>
        </div>
        <Button onClick={() => setIsNewContactOpen(true)} disabled={!user}>
            <Plus className="me-2 h-4 w-4" /> {t.crm.addContactButton}
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>{t.crm.allContactsTitle}</CardTitle>
            <CardDescription>{t.crm.allContactsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            {isLoading && (
                <div className="p-4 space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            )}
            {!isLoading && contacts && contacts.length > 0 && (
                <div>
                    {contacts.map(contact => (
                        <ContactItem key={contact.id} contact={contact} onDelete={handleDeleteRequest} />
                    ))}
                </div>
            )}
             {!isLoading && (!contacts || contacts.length === 0) && (
                 <div className="text-center p-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-xl font-bold font-headline">{t.crm.noContactsTitle}</h3>
                    <p>{t.crm.noContactsDescription}</p>
                 </div>
             )}
        </CardContent>
      </Card>
      {user && <NewContactDialog open={isNewContactOpen} onOpenChange={setIsNewContactOpen} userId={user.uid} />}
      {deletingContact && (
        <DeleteConfirmationDialog
            open={!!deletingContact}
            onOpenChange={() => setDeletingContact(null)}
            onConfirm={handleDeleteConfirm}
            title={t.deleteDialog.titleContact}
            description={`${t.deleteDialog.description} "${deletingContact.name}".`}
        />
      )}
    </div>
  );
}
