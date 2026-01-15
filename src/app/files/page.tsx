'use client';
import { useState } from 'react';
import { FolderKanban, Plus, File as FileIcon, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { File } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalization } from '@/components/layout/localization-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { UploadFileDialog } from '@/components/files/upload-file-dialog';
import { getStorage, ref, getDownloadURL, deleteObject } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';


function FileItem({ file, onDelete }: { file: File, onDelete: (file: File) => void }) {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const storage = getStorage();
      const url = await getDownloadURL(ref(storage, file.storagePath));
      window.open(url, '_blank');
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: 'destructive',
        title: t.files.downloadErrorTitle,
        description: t.files.downloadErrorDescription,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
        <div className="flex items-center gap-4">
            <FileIcon className="h-6 w-6 text-muted-foreground" />
            <div className="flex flex-col">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {file.uploadDate?.toDate ? format(file.uploadDate.toDate(), 'MMM d, yyyy') : t.common.justNow} - {formatBytes(file.size)}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={handleDownload} disabled={isDownloading}>
                <Download className="h-5 w-5"/>
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(file)}>
                <Trash2 className="h-5 w-5 text-destructive/70"/>
            </Button>
        </div>
    </div>
  )
}


export default function FilesPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deletingFile, setDeletingFile] = useState<File | null>(null);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { t } = useLocalization();
  const { toast } = useToast();

  const filesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'files'), orderBy('uploadDate', 'desc'));
  }, [firestore, user]);

  const { data: files, isLoading: areFilesLoading } = useCollection<File>(filesQuery);

  const handleDeleteRequest = (file: File) => {
    setDeletingFile(file);
  };
  
  const handleDeleteConfirm = async () => {
    if (!deletingFile || !user) return;
    
    // 1. Delete file from Firebase Storage
    const storage = getStorage();
    const fileStorageRef = ref(storage, deletingFile.storagePath);
    try {
        await deleteObject(fileStorageRef);
    } catch (error) {
        console.error("Storage deletion error:", error);
        toast({
            variant: 'destructive',
            title: t.files.deleteErrorTitle,
            description: t.files.deleteErrorStorage,
        });
        setDeletingFile(null);
        return;
    }

    // 2. Delete firestore record
    const fileDocRef = doc(firestore, 'users', user.uid, 'files', deletingFile.id);
    deleteDocumentNonBlocking(fileDocRef);

    toast({
        title: t.files.deleteSuccessTitle,
        description: `"${deletingFile.name}" ${t.files.deleteSuccessDescription}`,
    });

    setDeletingFile(null);
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
       <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <FolderKanban className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold font-headline">{t.files.title}</h1>
            <p className="text-lg text-muted-foreground">{t.files.description}</p>
          </div>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} variant="default" disabled={!user}>
            <Plus className="me-2 h-4 w-4" /> {t.files.uploadButton}
        </Button>
      </div>

      <Card>
            <CardHeader>
                <CardTitle>{t.files.allFilesTitle}</CardTitle>
                <CardDescription>{t.files.allFilesDescription}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 {(isUserLoading || areFilesLoading) && (
                    <div className="space-y-2 p-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                )}

                {!(isUserLoading || areFilesLoading) && files && files.length > 0 && (
                    <div>
                        {files.map(file => (
                            <FileItem key={file.id} file={file} onDelete={handleDeleteRequest} />
                        ))}
                    </div>
                )}
                
                {!(isUserLoading || areFilesLoading) && (!files || files.length === 0) && (
                     <div className="text-center text-muted-foreground p-12">
                        <FolderKanban className="h-12 w-12 mx-auto mb-4"/>
                        <h3 className="text-xl font-semibold font-headline mb-1">{t.files.noFilesTitle}</h3>
                        <p>{t.files.noFilesDescription}</p>
                    </div>
                )}
            </CardContent>
        </Card>

      {user && <UploadFileDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} userId={user.uid} />}
      {deletingFile && (
        <DeleteConfirmationDialog
            open={!!deletingFile}
            onOpenChange={() => setDeletingFile(null)}
            onConfirm={handleDeleteConfirm}
            title={t.deleteDialog.titleFile}
            description={`${t.deleteDialog.description} "${deletingFile.name}".`}
        />
      )}
    </div>
  );
}
