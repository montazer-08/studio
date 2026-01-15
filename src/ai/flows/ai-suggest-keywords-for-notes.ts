'use server';
/**
 * @fileOverview An AI agent that suggests relevant keywords or tags for notes.
 *
 * - suggestKeywordsForNotes - A function that handles the keyword suggestion process.
 * - SuggestKeywordsForNotesInput - The input type for the suggestKeywordsForNotes function.
 * - SuggestKeywordsForNotesOutput - The return type for the suggestKeywordsForNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestKeywordsForNotesInputSchema = z.object({
  noteContent: z
    .string()
    .describe('The content of the note for which keywords are to be suggested.'),
});
export type SuggestKeywordsForNotesInput = z.infer<typeof SuggestKeywordsForNotesInputSchema>;

const SuggestKeywordsForNotesOutputSchema = z.object({
  keywords: z
    .array(z.string())
    .describe('An array of suggested keywords or tags for the note.'),
});
export type SuggestKeywordsForNotesOutput = z.infer<typeof SuggestKeywordsForNotesOutputSchema>;

export async function suggestKeywordsForNotes(input: SuggestKeywordsForNotesInput): Promise<SuggestKeywordsForNotesOutput> {
  return suggestKeywordsForNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestKeywordsForNotesPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: SuggestKeywordsForNotesInputSchema},
  output: {schema: SuggestKeywordsForNotesOutputSchema},
  prompt: `You are an AI assistant that suggests relevant keywords or tags for notes.

  Given the content of a note, suggest a list of keywords or tags that would be helpful for categorizing and searching for the note later.

  Note Content: {{{noteContent}}}

  Suggest keywords or tags:`,
});

const suggestKeywordsForNotesFlow = ai.defineFlow(
  {
    name: 'suggestKeywordsForNotesFlow',
    inputSchema: SuggestKeywordsForNotesInputSchema,
    outputSchema: SuggestKeywordsForNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
