'use server';
/**
 * @fileOverview An AI agent that generates a personalized motivational message based on user's tasks.
 *
 * - aiGenerateMotivation - A function that handles the motivation generation process.
 * - AiGenerateMotivationInput - The input type for the function.
 * - AiGenerateMotivationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  name: z.string(),
  status: z.enum(['To Do', 'In Progress', 'Done']),
  priority: z.enum(['Low', 'Medium', 'High']),
  dueDate: z.string().optional(),
});

const AiGenerateMotivationInputSchema = z.object({
  tasks: z.array(TaskSchema).describe("The user's list of tasks."),
});
export type AiGenerateMotivationInput = z.infer<typeof AiGenerateMotivationInputSchema>;

const AiGenerateMotivationOutputSchema = z.object({
  message: z
    .string()
    .describe('A short, powerful, and personalized motivational message for the user.'),
});
export type AiGenerateMotivationOutput = z.infer<typeof AiGenerateMotivationOutputSchema>;


export async function aiGenerateMotivation(
  input: AiGenerateMotivationInput
): Promise<AiGenerateMotivationOutput> {
  return aiGenerateMotivationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGenerateMotivationPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: AiGenerateMotivationInputSchema},
  output: {schema: AiGenerateMotivationOutputSchema},
  prompt: `You are a world-class motivational coach. Your job is to provide a short, powerful, and personalized motivational message to the user based on their current task list.

Focus on their accomplishments (completed tasks) and the important work ahead. Be inspiring and concise.

Analyze the following tasks:
{{#each tasks}}
- {{name}} (Status: {{status}}, Priority: {{priority}})
{{/each}}

Generate a motivational message.`,
});

const aiGenerateMotivationFlow = ai.defineFlow(
  {
    name: 'aiGenerateMotivationFlow',
    inputSchema: AiGenerateMotivationInputSchema,
    outputSchema: AiGenerateMotivationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
