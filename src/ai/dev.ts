'use server';
import 'dotenv/config';

import '@/ai/flows/ai-suggest-task-priorities.ts';
import '@/ai/flows/ai-file-analysis.ts';
import '@/ai/flows/ai-summarize-notes.ts';
import '@/ai/flows/ai-suggest-keywords-for-notes.ts';
import '@/ai/flows/ai-auto-tag-content.ts';
import '@/ai/flows/ai-generate-tasks-from-note.ts';
import '@/ai/flows/ai-chat.ts';
import '@/ai/flows/ai-process-task-input.ts';
import '@/ai/flows/ai-generate-motivation.ts';
