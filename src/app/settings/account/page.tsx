'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Lock, Trash2 } from "lucide-react";
import { useLocalization } from "@/components/layout/localization-provider";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser, useAuth } from "@/firebase";
import { deleteUser, sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


export default function AccountSettingsPage() {
  const { t } = useLocalization();
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    try {
        await sendPasswordResetEmail(auth, user.email);
        toast({
            title: t.settings.account.passwordChangeSuccess,
            description: t.settings.account.passwordChangeSuccessDesc,
        });
    } catch (error: any) {
        console.error("Password reset error:", error);
        toast({
            variant: "destructive",
            title: t.settings.account.passwordChangeError,
            description: error.message || t.settings.account.passwordChangeErrorDesc,
        });
    } finally {
        setIsSendingReset(false);
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
        await deleteUser(user);
        toast({
            title: t.settings.account.deleteSuccess,
            description: t.settings.account.deleteSuccessDesc,
        });
        router.push('/signup');
    } catch (error: any) {
        console.error("Account deletion error:", error);
        toast({
            variant: "destructive",
            title: t.settings.account.deleteError,
            description: error.message || t.settings.account.deleteErrorDesc,
        });
    } finally {
        setIsDeleting(false);
        setIsAlertOpen(false);
    }
  }


  return (
    <>
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="w-6 h-6"/> {t.settings.account.title}</CardTitle>
            <CardDescription>{t.settings.account.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t.settings.account.passwordChangePrompt}</p>
                <Button onClick={handlePasswordReset} disabled={!user?.email || isSendingReset}>
                    {isSendingReset ? t.settings.account.passwordChangeSent : t.settings.account.passwordChangeButton}
                </Button>
             </div>
             <div className="space-y-2 pt-4 border-t">
                 <p className="text-sm font-medium text-destructive">{t.settings.account.deleteAccountTitle}</p>
                <p className="text-sm text-muted-foreground">{t.settings.account.deleteAccountWarning}</p>
                <Button variant="destructive" onClick={() => setIsAlertOpen(true)} disabled={!user || isDeleting}>
                    <Trash2 className="me-2 h-4 w-4" />
                    {isDeleting ? t.settings.account.deleting : t.settings.account.deleteAccountButton}
                </Button>
             </div>
        </CardContent>
    </Card>

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
                {t.settings.account.deleteAccountWarning}
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                {t.deleteDialog.confirm}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
