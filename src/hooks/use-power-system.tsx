'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useToast } from './use-toast';
import { useLocalization } from '@/components/layout/localization-provider';

export enum Power {
  AI_OVERCLOCK_MODE = 'AI_OVERCLOCK_MODE',
  DAY_MASTER_PLANNER = 'DAY_MASTER_PLANNER',
  DEEP_FOCUS_LOCK = 'DEEP_FOCUS_LOCK',
  TIME_CHEAT_ENGINE = 'TIME_CHEAT_ENGINE',
  FILE_X_RAY_VISION = 'FILE_X_RAY_VISION',
  FUTURE_YOU_MODE = 'FUTURE_YOU_MODE',
  KNOWLEDGE_GRAPH_BOOST = 'KNOWLEDGE_GRAPH_BOOST',
  AI_PERSONALITY_SWITCH = 'AI_PERSONALITY_SWITCH',
  DASHBOARD_OVERDRIVE = 'DASHBOARD_OVERDRIVE',
  MOTIVATION_INJECTION = 'MOTIVATION_INJECTION',
}

interface PowerConfig {
  duration: number; // in seconds
  isStackable: boolean;
  isInstant: boolean; // Does it trigger an action instead of a duration?
}

export const POWER_CONFIGS: Record<Power, PowerConfig> = {
  [Power.AI_OVERCLOCK_MODE]: {
    duration: 15 * 60, // 15 minutes
    isStackable: true,
    isInstant: false,
  },
  [Power.DAY_MASTER_PLANNER]: {
    duration: 24 * 60 * 60, // 24 hours
    isStackable: false,
    isInstant: false,
  },
  [Power.DEEP_FOCUS_LOCK]: {
    duration: 25 * 60, // 25 minutes
    isStackable: true,
    isInstant: false,
  },
    [Power.TIME_CHEAT_ENGINE]: {
    duration: 60 * 60, // 1 hour
    isStackable: false,
    isInstant: false,
  },
  [Power.FILE_X_RAY_VISION]: {
    duration: 10 * 60, // 10 minutes
    isStackable: true,
    isInstant: false,
  },
  [Power.FUTURE_YOU_MODE]: {
    duration: 5 * 60, // 5 minutes
    isStackable: false,
    isInstant: false,
  },
  [Power.KNOWLEDGE_GRAPH_BOOST]: {
    duration: 30 * 60, // 30 minutes
    isStackable: false,
    isInstant: false,
  },
  [Power.AI_PERSONALITY_SWITCH]: {
    duration: 60 * 60, // 1 hour
    isStackable: true,
    isInstant: false,
  },
  [Power.DASHBOARD_OVERDRIVE]: {
    duration: 2 * 60 * 60, // 2 hours
    isStackable: false,
    isInstant: false,
  },
    [Power.MOTIVATION_INJECTION]: {
    duration: 60, // 1 minute
    isStackable: false,
    isInstant: true,
  },
};

interface ActivePower {
  id: Power;
  expiresAt: number; // timestamp
}

interface PowerSystemState {
  activationsAvailable: number;
  activePowers: ActivePower[];
}

interface PowerContextValue {
  activationsAvailable: number;
  addPowerActivation: () => void;
  activatePower: (power: Power, onInstantActivate?: () => void) => boolean;
  getPowerState: (
    power: Power
  ) => { isActive: boolean; durationLeft: number };
}

const PowerContext = createContext<PowerContextValue | undefined>(undefined);

export function PowerProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useLocalization();
  const [state, setState] = useState<PowerSystemState>(() => {
    // Lazy initialization from localStorage
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('powerSystemState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Filter out expired powers on load
        parsed.activePowers = parsed.activePowers.filter(
          (p: ActivePower) => p.expiresAt > Date.now()
        );
        return parsed;
      }
    }
    // Default state if nothing in localStorage
    return {
      activationsAvailable: 5, // Start with 5 free activations
      activePowers: [],
    };
  });

  // Effect to handle timers and persistence
  useEffect(() => {
    localStorage.setItem('powerSystemState', JSON.stringify(state));

    const intervals = state.activePowers.map(power => {
      const config = POWER_CONFIGS[power.id];
      const localizedName = t.powers.powersList[power.id]?.name || power.id;
      if (config.isInstant) return null; // No timer for instant powers

      const interval = setInterval(() => {
        if (power.expiresAt <= Date.now()) {
          // Power expired, remove it
          setState(s => ({
            ...s,
            activePowers: s.activePowers.filter(p => p.id !== power.id),
          }));
          toast({
            title: `${localizedName} Deactivated`,
            description: 'The power boost has ended.',
          });
          clearInterval(interval);
        } else {
          // Force a re-render to update countdowns
          setState(s => ({...s}));
        }
      }, 1000);
      return interval;
    }).filter(Boolean);

    // @ts-ignore
    return () => intervals.forEach(clearInterval); // Cleanup on unmount/re-render
  }, [state, toast, t]);

  const addPowerActivation = useCallback(() => {
    setState(s => ({
      ...s,
      activationsAvailable: s.activationsAvailable + 1,
    }));
  }, []);

  const activatePower = useCallback(
    (power: Power, onInstantActivate?: () => void): boolean => {
      if (state.activationsAvailable <= 0) {
        toast({
          variant: 'destructive',
          title: t.powers.activationFailed,
          description: t.powers.noActivations,
        });
        return false;
      }

      const config = POWER_CONFIGS[power];
      
      // Handle instant powers
      if (config.isInstant) {
          if (onInstantActivate) {
              onInstantActivate();
          }
          setState(s => ({
             ...s,
             activationsAvailable: s.activationsAvailable - 1,
          }));
          return true;
      }


      const now = Date.now();
      let newExpiresAt = now + config.duration * 1000;

      setState(s => {
        const existingPower = s.activePowers.find(p => p.id === power);
        if (existingPower && config.isStackable) {
          // Stack duration
          newExpiresAt = existingPower.expiresAt + config.duration * 1000;
          return {
            activationsAvailable: s.activationsAvailable - 1,
            activePowers: s.activePowers.map(p =>
              p.id === power ? { ...p, expiresAt: newExpiresAt } : p
            ),
          };
        } else {
           // Activate new or non-stackable power
           return {
            activationsAvailable: s.activationsAvailable - 1,
            activePowers: [
                ...s.activePowers.filter(p => p.id !== power),
                { id: power, expiresAt: newExpiresAt }
            ],
           }
        }
      });
      
      return true;
    },
    [state.activationsAvailable, toast, t]
  );

  const getPowerState = useCallback(
    (power: Power) => {
      const config = POWER_CONFIGS[power];
      if (config.isInstant) {
        return { isActive: false, durationLeft: 0 };
      }
      const activePower = state.activePowers.find(p => p.id === power);
      if (activePower && activePower.expiresAt > Date.now()) {
        return {
          isActive: true,
          durationLeft: Math.round((activePower.expiresAt - Date.now()) / 1000),
        };
      }
      return { isActive: false, durationLeft: 0 };
    },
    [state.activePowers]
  );

  return (
    <PowerContext.Provider
      value={{
        activationsAvailable: state.activationsAvailable,
        addPowerActivation,
        activatePower,
        getPowerState,
      }}
    >
      {children}
    </PowerContext.Provider>
  );
}

export function usePowerSystem() {
  const context = useContext(PowerContext);
  if (!context) {
    throw new Error('usePowerSystem must be used within a PowerProvider');
  }
  return context;
}
