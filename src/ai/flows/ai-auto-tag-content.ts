'use server';
/**
 * @fileOverview AI-powered content auto-tagging flow.
 *
 * - aiAutoTagContent - A function that automatically tags content.
 * - AiAutoTagContentInput - The input type for the aiAutoTagContent function.
 * - AiAutoTagContentOutput - The return type for the aiAutoTagContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAutoTagContentInputSchema = z.object({
  content: z.string().describe('The content to be tagged.'),
  contentType: z
    .enum(['task', 'note', 'file'])
    .describe('The type of content being tagged.'),
});
export type AiAutoTagContentInput = z.infer<typeof AiAutoTagContentInputSchema>;

const AiAutoTagContentOutputSchema = z.object({
  tags: z.array(z.string()).describe('The AI-suggested tags for the content.'),
});
export type AiAutoTagContentOutput = z.infer<typeof AiAutoTagContentOutputSchema>;

export async function aiAutoTagContent(input: AiAutoTagContentInput): Promise<AiAutoTagContentOutput> {
  return aiAutoTagContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAutoTagContentPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: AiAutoTagContentInputSchema},
  output: {schema: AiAutoTagContentOutputSchema},
  prompt: `You are an AI assistant helping users organize their content by suggesting relevant tags.

  Analyze the following content and suggest a list of tags that would be helpful for categorization and retrieval.
  The tags should be relevant to the content and reflect the main topics discussed.

  Content Type: {{{contentType}}}
  Content: {{{content}}}

  Respond with a JSON array of strings representing the tags.
  Example: ["tag1", "tag2", "tag3"]
  `,
});

const aiAutoTagContentFlow = ai.defineFlow(
  {
    name: 'aiAutoTagContentFlow',
    inputSchema: AiAutoTagContentInputSchema,
    outputSchema: AiAutoTagContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
