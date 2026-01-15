'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Bell, CheckSquare, BookText, File as FileIcon } from "lucide-react";
import { useUser } from "@/firebase";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Notification } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { useLocalization } from "@/components/layout/localization-provider";

function NotificationItem({ notification }: { notification: Notification }) {
    
    const getIcon = () => {
        switch (notification.type) {
            case 'task_created': return <CheckSquare className="h-5 w-5 text-blue-500" />;
            case 'note_created': return <BookText className="h-5 w-5 text-green-500" />;
            case 'file_uploaded': return <FileIcon className="h-5 w-5 text-purple-500" />;
            default: return <Bell className="h-5 w-5 text-muted-foreground" />;
        }
    };
    
    return (
        <div className="flex items-start gap-4 p-4 border-b last:border-b-0">
            <div>{getIcon()}</div>
            <div className="flex-1">
                <p className="font-medium">{notification.message}</p>
                <p className="text-sm text-muted-foreground">
                    {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                </p>
            </div>
        </div>
    )
}

export default function UpdatesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { t } = useLocalization();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore, user]);

  const { data: notifications, isLoading: areNotificationsLoading } = useCollection<Notification>(notificationsQuery);
  const isLoading = isUserLoading || areNotificationsLoading;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-headline">{t.updates.title}</h1>
          <p className="text-lg text-muted-foreground">{t.updates.description}</p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>{t.updates.activityFeed}</CardTitle>
            <CardDescription>{t.updates.activityDescription}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            {isLoading && (
                 <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/4" /></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/4" /></div>
                    </div>
                 </div>
            )}
            {!isLoading && notifications && notifications.length > 0 && (
                <div>
                    {notifications.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} />
                    ))}
                </div>
            )}
            {!isLoading && (!notifications || notifications.length === 0) && (
                <div className="text-center p-12 text-muted-foreground">
                    <Bell className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold font-headline mb-2">{t.updates.allQuiet}</h3>
                    <p>{t.updates.quietDescription}</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

