'use server';
/**
 * @fileOverview An AI agent that generates tasks from a note.
 *
 * - aiGenerateTasksFromNote - A function that handles the task generation process.
 * - AiGenerateTasksFromNoteInput - The input type for the aiGenerateTasksFromNote function.
 * - AiGenerateTasksFromNoteOutput - The return type for the aiGenerateTasksFromNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiGenerateTasksFromNoteInputSchema = z.object({
  noteContent: z
    .string()
    .describe('The content of the note from which tasks will be generated.'),
});
export type AiGenerateTasksFromNoteInput = z.infer<typeof AiGenerateTasksFromNoteInputSchema>;

const AiGenerateTasksFromNoteOutputSchema = z.object({
  tasks: z
    .array(z.string())
    .describe('A list of tasks generated from the note content.'),
});
export type AiGenerateTasksFromNoteOutput = z.infer<typeof AiGenerateTasksFromNoteOutputSchema>;

export async function aiGenerateTasksFromNote(input: AiGenerateTasksFromNoteInput): Promise<AiGenerateTasksFromNoteOutput> {
  return aiGenerateTasksFromNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGenerateTasksFromNotePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: AiGenerateTasksFromNoteInputSchema},
  output: {schema: AiGenerateTasksFromNoteOutputSchema},
  prompt: `You are a task creation AI assistant. Analyze the following note and generate a list of tasks based on action items identified in the text.

Note Content: {{{noteContent}}}

Tasks:`, 
});

const aiGenerateTasksFromNoteFlow = ai.defineFlow(
  {
    name: 'aiGenerateTasksFromNoteFlow',
    inputSchema: AiGenerateTasksFromNoteInputSchema,
    outputSchema: AiGenerateTasksFromNoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
