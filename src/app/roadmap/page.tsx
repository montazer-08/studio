'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Milestone, Lightbulb, Construction, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RoadmapItem } from "@/lib/types";
import { roadmapItems as seedData } from "@/lib/roadmap-seed";
import { useLocalization } from "@/components/layout/localization-provider";

function RoadmapItemCard({ item }: { item: RoadmapItem }) {

    const getIcon = () => {
        switch (item.status) {
            case 'Planned': return <Lightbulb className="h-5 w-5 text-blue-500" />;
            case 'In Progress': return <Construction className="h-5 w-5 text-yellow-500" />;
            case 'Completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
            default: return <Lightbulb className="h-5 w-5" />;
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    {getIcon()}
                    {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Badge variant={item.source === 'Community' ? 'secondary' : 'outline'}>
                    {item.source}
                </Badge>
            </CardContent>
        </Card>
    )
}

export default function RoadmapPage() {
    const { t } = useLocalization();
    // In a real app, this would come from a Firestore query.
    // For this prototype, we use seed data to ensure the page is not empty.
    const roadmapItems = seedData;
    const isLoading = false; // Set to false as we are using static data.

    const planned = roadmapItems?.filter(i => i.status === 'Planned') || [];
    const inProgress = roadmapItems?.filter(i => i.status === 'In Progress') || [];
    const completed = roadmapItems?.filter(i => i.status === 'Completed') || [];

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <Milestone className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-headline">{t.roadmap.title}</h1>
          <p className="text-lg text-muted-foreground">{t.roadmap.description}</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
            <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
        </div>
      ) : (
          <div className="space-y-12">
            <div>
                <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><Construction className="text-yellow-500" /> {t.roadmap.inProgress}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inProgress.length > 0 ? inProgress.map(item => <RoadmapItemCard key={item.id} item={item} />) : <p className="text-muted-foreground">{t.roadmap.noInProgress}</p>}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><Lightbulb className="text-blue-500" /> {t.roadmap.planned}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {planned.map(item => <RoadmapItemCard key={item.id} item={item} />)}
                </div>
            </div>
             <div>
                <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><CheckCircle className="text-green-500" /> {t.roadmap.completed}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {completed.map(item => <RoadmapItemCard key={item.id} item={item} />)}
                </div>
            </div>
          </div>
      )}
    </div>
  );
}

