'use client';
import { useState, useTransition } from 'react';
import { Note } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { BookText, Sparkles, Wand, ListTodo, Tags, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { summarizeNote } from '@/ai/flows/ai-summarize-notes';
import { suggestKeywordsForNotes } from '@/ai/flows/ai-suggest-keywords-for-notes';
import { aiGenerateTasksFromNote } from '@/ai/flows/ai-generate-tasks-from-note';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { useLocalization } from '../layout/localization-provider';
import { Badge } from '../ui/badge';

interface NoteViewerProps {
    note: Note | null;
    onDeleteRequest: (note: Note) => void;
}

export function NoteViewer({ note, onDeleteRequest }: NoteViewerProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [keywords, setKeywords] = useState<string[] | null>(null);
    const [tasks, setTasks] = useState<string[] | null>(null);
    const [isSummarizing, startSummarizeTransition] = useTransition();
    const [isGeneratingKeywords, startKeywordsTransition] = useTransition();
    const [isGeneratingTasks, startTasksTransition] = useTransition();
    const { toast } = useToast();
    const { t } = useLocalization();

    const handleSummarize = () => {
        if (!note) return;
        setKeywords(null);
        setTasks(null);
        startSummarizeTransition(async () => {
            try {
                const result = await summarizeNote({ noteContent: note.content });
                setSummary(result.summary);
                toast({
                    title: t.noteViewer.summarySuccessTitle,
                    description: t.noteViewer.summarySuccessDescription,
                });
            } catch (error) {
                console.error("Summarization error:", error);
                toast({
                    variant: "destructive",
                    title: t.noteViewer.summaryErrorTitle,
                    description: t.noteViewer.summaryErrorDescription,
                });
            }
        });
    }

    const handleSuggestKeywords = () => {
        if (!note) return;
        setSummary(null);
        setTasks(null);
        startKeywordsTransition(async () => {
            try {
                const result = await suggestKeywordsForNotes({ noteContent: note.content });
                setKeywords(result.keywords);
                toast({ title: t.noteViewer.keywordsSuccessTitle });
            } catch (error) {
                console.error("Keyword suggestion error:", error);
                toast({ variant: "destructive", title: t.noteViewer.aiError, description: t.noteViewer.keywordsErrorDescription });
            }
        });
    };

    const handleGenerateTasks = () => {
        if (!note) return;
        setSummary(null);
        setKeywords(null);
        startTasksTransition(async () => {
            try {
                const result = await aiGenerateTasksFromNote({ noteContent: note.content });
                setTasks(result.tasks);
                toast({ title: t.noteViewer.tasksSuccessTitle });
            } catch (error) {
                console.error("Task generation error:", error);
                toast({ variant: "destructive", title: t.noteViewer.aiError, description: t.noteViewer.tasksErrorDescription });
            }
        });
    };

    const isAiWorking = isSummarizing || isGeneratingKeywords || isGeneratingTasks;

    const resetAiOutputs = () => {
        setSummary(null);
        setKeywords(null);
        setTasks(null);
    }

    // Reset AI outputs when note changes
    useState(() => {
        resetAiOutputs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [note?.id]);


    if (!note) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                <BookText className="w-16 h-16 mb-4" />
                <h3 className="font-semibold text-2xl font-headline">{t.noteViewer.selectNoteTitle}</h3>
                <p className="max-w-md">{t.noteViewer.selectNoteDescription}</p>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 h-full">
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{note.title}</CardTitle>
                            <CardDescription>
                                {note.createdAt?.toDate ? new Date(note.createdAt.toDate()).toLocaleDateString() : t.common.justNow}
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteRequest(note)}>
                            <Trash2 className="h-5 w-5 text-destructive/70" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto whitespace-pre-wrap">
                    {note.content}
                </CardContent>
                <CardFooter className="flex-col items-start gap-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handleSummarize} disabled={isAiWorking} size="sm">
                            <Sparkles className="me-2 h-4 w-4" />
                            {isSummarizing ? t.noteViewer.summarizingButton : t.noteViewer.summarizeButton}
                        </Button>
                        <Button onClick={handleSuggestKeywords} disabled={isAiWorking} size="sm" variant="outline">
                            <Tags className="me-2 h-4 w-4" />
                            {isGeneratingKeywords ? t.noteViewer.suggestingButton : t.noteViewer.suggestButton}
                        </Button>
                         <Button onClick={handleGenerateTasks} disabled={isAiWorking} size="sm" variant="outline">
                            <ListTodo className="me-2 h-4 w-4" />
                            {isGeneratingTasks ? t.noteViewer.generatingButton : t.noteViewer.generateButton}
                        </Button>
                    </div>

                    {isAiWorking && (
                         <div className="w-full space-y-2 p-4 rounded-lg bg-muted">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>
                    )}
                    
                    {summary && !isAiWorking && (
                         <Card className="w-full bg-secondary/30 dark:bg-secondary/10">
                            <CardHeader>
                                <CardTitle className="text-lg font-headline flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />{t.noteViewer.aiSummaryTitle}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{summary}</p>
                            </CardContent>
                        </Card>
                    )}

                    {keywords && !isAiWorking && (
                         <Card className="w-full bg-secondary/30 dark:bg-secondary/10">
                            <CardHeader>
                                <CardTitle className="text-lg font-headline flex items-center gap-2"><Tags className="h-5 w-5 text-primary" />{t.noteViewer.aiKeywordsTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {keywords.map((kw, i) => <Badge key={i} variant="secondary">{kw}</Badge>)}
                            </CardContent>
                        </Card>
                    )}

                    {tasks && !isAiWorking && (
                         <Card className="w-full bg-secondary/30 dark:bg-secondary/10">
                            <CardHeader>
                                <CardTitle className="text-lg font-headline flex items-center gap-2"><ListTodo className="h-5 w-5 text-primary" />{t.noteViewer.aiTasksTitle}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc ps-5 space-y-2">
                                    {tasks.map((task, i) => <li key={i}>{task}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
