'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePowerSystem, POWER_CONFIGS, Power } from '@/hooks/use-power-system';
import { Zap, Sparkles, UserCog } from 'lucide-react';
import { useAds } from '@/components/ads/ads-provider';
import { useToast } from '@/hooks/use-toast';
import { VenetianMask } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Task } from '@/lib/types';
import { query, collection } from 'firebase/firestore';
import { aiGenerateMotivation } from '@/ai/flows/ai-generate-motivation';
import { useLocalization } from '@/components/layout/localization-provider';

const POWER_ICONS: Record<Power, React.ElementType> = {
  [Power.AI_OVERCLOCK_MODE]: () => <>🚀</>,
  [Power.DAY_MASTER_PLANNER]: () => <>📅</>,
  [Power.DEEP_FOCUS_LOCK]: () => <>🔥</>,
  [Power.TIME_CHEAT_ENGINE]: () => <>⏳</>,
  [Power.FILE_X_RAY_VISION]: () => <>📄</>,
  [Power.FUTURE_YOU_MODE]: UserCog,
  [Power.KNOWLEDGE_GRAPH_BOOST]: () => <>🧬</>,
  [Power.AI_PERSONALITY_SWITCH]: VenetianMask,
  [Power.DASHBOARD_OVERDRIVE]: () => <>🧩</>,
  [Power.MOTIVATION_INJECTION]: () => <>🔥</>,
};


function PowerCard({ powerId, tasks }: { powerId: Power, tasks: Task[] | null }) {
  const { t } = useLocalization();
  const config = POWER_CONFIGS[powerId];
  const localizedConfig = t.powers.powersList[powerId];
  const Icon = POWER_ICONS[powerId];
  const { activatePower, getPowerState } = usePowerSystem();
  const state = getPowerState(powerId);
  const { toast } = useToast();
  const { showRewardedAd, isRewardedReady } = useAds();
  const [isActivating, startActivationTransition] = useTransition();


  const handleMotivationInjection = () => {
     startActivationTransition(async () => {
        if (!tasks) {
             toast({
                variant: 'destructive',
                title: t.powers.motivationFailed,
                description: 'Task data is not available.'
            });
            return;
        }
        try {
            const result = await aiGenerateMotivation({ tasks });
            toast({
                duration: 10000,
                title: `🔥 ${t.powers.powersList.MOTIVATION_INJECTION.name}!`,
                description: result.message
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: t.powers.motivationFailed,
                description: t.powers.motivationFailedDesc
            });
        }
     });
  }


  const handleActivation = () => {
    showRewardedAd({
      onSuccess: () => {
        const success = activatePower(powerId, () => {
            if (powerId === Power.MOTIVATION_INJECTION) {
                handleMotivationInjection();
            }
        });

        if (success) {
           toast({
            title: `🚀 ${localizedConfig.name} ${t.powers.powerActivated}`,
            description: powerId === Power.MOTIVATION_INJECTION ? t.powers.motivationInjection : `${t.powers.enjoyBoost} ${config.duration / 60} ${t.powers.minutes}.`
          });
        }
      },
      onFailure: () => {
         toast({
            variant: 'destructive',
            title: t.powers.adNotReady,
            description: t.powers.adNotReadyDesc,
        });
      }
    });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    if (h !== '00') return `${h}:${m}:${s}`;
    return `${m}:${s}`;
  };

  return (
    <Card className={`flex flex-col justify-between transition-all ${state.isActive ? 'border-primary shadow-lg shadow-primary/20' : 'border-border'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Icon className="w-5 h-5" />
          {localizedConfig.name}
        </CardTitle>
        <CardDescription>{localizedConfig.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {state.isActive && !config.isInstant ? (
          <div className="text-center font-bold text-lg text-primary animate-pulse">
            {t.powers.active.toUpperCase()}: {formatTime(state.durationLeft)}
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleActivation}
            disabled={!isRewardedReady || isActivating || state.isActive}
          >
            <Sparkles className="me-2 h-4 w-4" />
            {isActivating ? t.powers.activating : (state.isActive ? t.powers.active : t.powers.activate)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


export default function PowersPage() {
    const { activationsAvailable, addPowerActivation } = usePowerSystem();
    const { showRewardedAd, isRewardedReady } = useAds();
    const { toast } = useToast();
    const allPowers = Object.keys(POWER_CONFIGS) as Power[];
    const [isClient, setIsClient] = useState(false);
    const { t } = useLocalization();
    
    const { user } = useUser();
    const firestore = useFirestore();

    const tasksQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'tasks'));
    }, [firestore, user]);

    const { data: tasks } = useCollection<Task>(tasksQuery);


    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleGetActivation = () => {
        showRewardedAd({
            onSuccess: () => {
                addPowerActivation();
                toast({
                    title: t.powers.activationGained,
                    description: t.powers.activationAdded,
                });
            },
            onFailure: () => {
                 toast({
                    variant: 'destructive',
                    title: t.powers.adNotReady,
                    description: t.powers.adNotReadyDesc,
                });
            }
        });
    };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Zap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold font-headline">{t.powers.title}</h1>
            <p className="text-lg text-muted-foreground">{t.powers.description}</p>
          </div>
        </div>
         <div className="text-right">
            {isClient ? (
                <div className="text-2xl font-bold">{activationsAvailable}</div>
            ) : (
                <Skeleton className="h-8 w-10 ms-auto" />
            )}
            <div className="text-sm text-muted-foreground">{t.powers.activationsAvailable}</div>
             <Button 
                size="sm" 
                variant="outline" 
                className="mt-2" 
                onClick={handleGetActivation}
                disabled={!isRewardedReady}
            >
                {t.powers.getActivation}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allPowers.map(powerId => (
            <PowerCard key={powerId} powerId={powerId} tasks={tasks}/>
        ))}
      </div>
    </div>
  );
}
