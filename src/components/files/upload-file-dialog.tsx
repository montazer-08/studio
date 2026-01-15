'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { useLocalization } from "../layout/localization-provider";
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiFileAnalysis } from '@/ai/flows/ai-file-analysis';
import { usePowerSystem, Power } from '@/hooks/use-power-system';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useAds } from '../ads/ads-provider';
import { useMemoFirebase } from '@/firebase/provider';

const fileFormSchema = z.object({
  file: z.instanceof(File).refine(file => file.size > 0, "File is required."),
});

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

// Counter for interstitial ad
let creationCount = 0;
const INTERSTITIAL_TRIGGER_COUNT = 3;


export function UploadFileDialog({ open, onOpenChange, userId }: UploadFileDialogProps) {
  const firestore = useFirestore();
  const storage = getStorage();
  const { toast } = useToast();
  const { t } = useLocalization();
  const [isUploading, setIsUploading] = useState(false);
  const { getPowerState } = usePowerSystem();
  const fileXrayState = getPowerState(Power.FILE_X_RAY_VISION);
  const { showInterstitialAd, isInterstitialReady } = useAds();

  const form = useForm<z.infer<typeof fileFormSchema>>({
    resolver: zodResolver(fileFormSchema),
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      form.setValue('file', acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const filesCollection = useMemoFirebase(() => collection(firestore, `users/${userId}/files`), [firestore, userId]);
  const notificationsCollection = useMemoFirebase(() => collection(firestore, `users/${userId}/notifications`), [firestore, userId]);


  const onSubmit = async (values: z.infer<typeof fileFormSchema>) => {
    setIsUploading(true);
    const file = values.file;
    const storagePath = `users/${userId}/files/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);

    try {
      // 1. Upload file to Firebase Storage
      await uploadBytes(storageRef, file);
      
      // 2. Add file metadata to Firestore
      const newFileData = {
        userId,
        name: file.name,
        type: file.type,
        size: file.size,
        storagePath: storagePath,
        uploadDate: serverTimestamp(),
      };
      addDocumentNonBlocking(filesCollection, newFileData);

      const notificationData = {
        userId,
        type: 'file_uploaded',
        message: `File uploaded: "${file.name}"`,
        createdAt: serverTimestamp(),
        isRead: false,
      };
      addDocumentNonBlocking(notificationsCollection, notificationData);


      toast({
        title: t.uploadFile.toastSuccessTitle,
        description: `"${file.name}" ${t.uploadFile.toastSuccessDescription}`,
      });

      // 3. Trigger AI analysis if the power is active
      if (fileXrayState.isActive) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const dataUri = event.target?.result as string;
          if (dataUri) {
            try {
              toast({
                title: 'X-Ray Vision Activated!',
                description: `Performing deep analysis on ${file.name}...`
              });
              const analysisResult = await aiFileAnalysis({ fileDataUri: dataUri });
              
              // Show detailed results in a new toast
              toast({
                duration: 15000, // Keep this toast longer
                title: '🔬 File X-Ray Analysis Complete',
                description: (
                  <div className="text-sm">
                    <p className="font-semibold">Summary:</p>
                    <p className="mb-2">{analysisResult.summary}</p>
                    {analysisResult.actionItems.length > 0 && <p className="font-semibold">Action Items:</p>}
                    <ul className="list-disc ps-5 mb-2">
                        {analysisResult.actionItems.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                ),
              });

            } catch (aiError) {
               console.error("AI analysis failed:", aiError);
               toast({
                variant: 'destructive',
                title: 'AI Analysis Failed',
                description: 'The X-Ray Vision could not analyze the file.'
               })
            }
          }
        };
        reader.readAsDataURL(file);
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

    } catch (error) {
      console.error("File upload error:", error);
      toast({
        variant: 'destructive',
        title: t.uploadFile.toastErrorTitle,
        description: t.uploadFile.toastErrorDescription,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) form.reset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.uploadFile.title}</DialogTitle>
          <DialogDescription>{t.uploadFile.description}</DialogDescription>
        </DialogHeader>

        {fileXrayState.isActive && (
            <Alert className="border-primary text-primary">
                <Sparkles className="h-4 w-4" />
                <AlertTitle className="font-bold">File X-Ray Vision is ACTIVE!</AlertTitle>
                <AlertDescription>
                    This file will be deeply analyzed by the AI upon upload.
                </AlertDescription>
            </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.uploadFile.fileLabel}</FormLabel>
                  <FormControl>
                    <div
                      {...getRootProps()}
                      className={cn(
                        'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors',
                        isDragActive && 'border-primary bg-primary/10'
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="text-center">
                        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                        {form.watch('file') ? (
                          <p className="mt-2 text-sm font-medium">{form.watch('file')?.name}</p>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">{t.uploadFile.filePlaceholder}</p>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isUploading}>{t.common.cancel}</Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? t.uploadFile.uploading : t.uploadFile.uploadButton}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
