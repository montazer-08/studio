'use client';
import { useState, useRef, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Send, User, Bot, Zap, VenetianMask, UserCog } from 'lucide-react';
import { aiChat, AiChatInput } from '@/ai/flows/ai-chat';
import { AI_PERSONALITIES } from '@/ai/personalities';
import { Separator } from '@/components/ui/separator';
import { usePowerSystem, Power } from '@/hooks/use-power-system';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from '@/components/ui/skeleton';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type AIPersonality = keyof typeof AI_PERSONALITIES;

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { getPowerState } = usePowerSystem();
  
  const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality>('default');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const aiOverclockState = getPowerState(Power.AI_OVERCLOCK_MODE);
  const isOverclocked = aiOverclockState.isActive;
  
  const personalitySwitchState = getPowerState(Power.AI_PERSONALITY_SWITCH);
  const isPersonalitySwitchActive = personalitySwitchState.isActive;
  
  const futureYouState = getPowerState(Power.FUTURE_YOU_MODE);
  const isFutureYouModeActive = futureYouState.isActive;

  useEffect(() => {
    // Reset to default personality if the power expires
    if (!isPersonalitySwitchActive) {
      setSelectedPersonality('default');
    }
  }, [isPersonalitySwitchActive]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const chatInput: AiChatInput = { 
        query: input,
        overclock: isOverclocked,
        personality: isPersonalitySwitchActive ? selectedPersonality : 'default',
        futureYouMode: isFutureYouModeActive
      };
      const { response } = await aiChat(chatInput);
      const reader = response.getReader();
      const decoder = new TextDecoder();

      let content = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setMessages(prev =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, content } : msg
          )
        );
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
       setMessages(prev =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, content: "Sorry, I encountered an error. Please try again." } : msg
          )
        );
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getPersonalityName = (key: AIPersonality) => {
    switch(key) {
      case 'default': return 'Default Assistant';
      case 'strictCoach': return 'Strict Coach';
      case 'ceoMentor': return 'CEO Mentor';
      case 'arabicClassicalScholar': return 'Arabic Classical Scholar';
      case 'futureYou': return 'Future You';
      default: return 'Default';
    }
  }


  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 h-full flex flex-col">
       <div className="flex items-center gap-4 mb-4">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-headline">AI Assistant</h1>
          <p className="text-lg text-muted-foreground">Your intelligent partner for thought and creation.</p>
        </div>
      </div>
      <Separator className="my-4" />
      <Card className="flex-grow flex flex-col">
        <CardHeader>
           <div className='flex justify-between items-center gap-4'>
            <CardTitle>Conversation</CardTitle>
            <div className="flex items-center gap-4">
              {!isClient ? (
                  <Skeleton className="h-10 w-48" />
              ) : (
                <>
                  {isFutureYouModeActive && (
                     <div className="flex items-center gap-2 text-sm font-semibold text-primary animate-pulse">
                        <UserCog className="h-4 w-4" />
                        <span>Future You Mode Active ({formatTime(futureYouState.durationLeft)})</span>
                     </div>
                  )}
                  {isPersonalitySwitchActive && !isFutureYouModeActive && (
                    <div className='flex items-center gap-2'>
                       <VenetianMask className="h-5 w-5 text-primary"/>
                       <Select 
                          value={selectedPersonality} 
                          onValueChange={(value) => setSelectedPersonality(value as AIPersonality)}
                        >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select Personality" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(AI_PERSONALITIES).filter(p => p !== 'futureYou').map((key) => (
                            <SelectItem key={key} value={key}>{getPersonalityName(key as AIPersonality)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                   {isOverclocked ? (
                     <div className="flex items-center gap-2 text-sm font-semibold text-destructive animate-pulse">
                        <Zap className="h-4 w-4" />
                        <span>AI Overclock Active ({formatTime(aiOverclockState.durationLeft)})</span>
                     </div>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/powers">
                        <Zap className="me-2 h-4 w-4" />
                        Activate Powers
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </div>
           </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto pr-4">
          <div className="space-y-6">
            {messages.length === 0 && (
               <div className="text-center text-muted-foreground py-16">
                 <BrainCircuit className="h-16 w-16 mx-auto mb-4"/>
                 <h2 className="text-2xl font-semibold font-headline">Welcome to OmniCore AI</h2>
                 <p>Ask me anything, from summarizing your notes to planning your next big project.</p>
               </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 ${
                  message.role === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="p-2 bg-primary/10 rounded-full">
                     {isFutureYouModeActive ? <UserCog className="h-6 w-6 text-primary" /> : <Bot className="h-6 w-6 text-primary" />}
                   </div>
                )}
                <div
                  className={`max-w-xl rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}{isLoading && index === messages.length - 1 ? '...' : ''}</p>
                </div>
                 {message.role === 'user' && (
                   <div className="p-2 bg-muted rounded-full">
                    <User className="h-6 w-6 text-muted-foreground" />
                   </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask the AI anything..."
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
