'use server';
/**
 * @fileOverview AI agent to process natural language task inputs and suggest structured task data.
 *
 * - aiProcessTaskInput - A function that processes a task input string.
 * - AiProcessTaskInput - The input type for the function.
 * - AiProcessTaskOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiProcessTaskInputSchema = z.object({
  taskInput: z
    .string()
    .describe(
      'The natural language input from the user describing a task. This could be a simple title or a full sentence.'
    ),
});
export type AiProcessTaskInput = z.infer<typeof AiProcessTaskInputSchema>;

const AiProcessTaskOutputSchema = z.object({
  name: z.string().describe("The suggested title for the task. This should be a concise summary of the user's input."),
  description: z.string().optional().describe('A detailed description of the task, if details are provided in the input.'),
  priority: z.enum(['Low', 'Medium', 'High']).describe('The suggested priority for the task.'),
  status: z.enum(['To Do', 'In Progress', 'Done']).describe('The suggested status for the task. Default to "To Do".'),
  dueDate: z.string().optional().describe('The suggested due date in YYYY-MM-DD format if mentioned in the input.'),
});
export type AiProcessTaskOutput = z.infer<typeof AiProcessTaskOutputSchema>;


export async function aiProcessTaskInput(
  input: AiProcessTaskInput
): Promise<AiProcessTaskOutput> {
  return aiProcessTaskInputFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProcessTaskInputPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: AiProcessTaskInputSchema},
  output: {schema: AiProcessTaskOutputSchema},
  prompt: `You are an intelligent task creation assistant. Analyze the user's input and convert it into a structured task object.

  - The current date is: ${new Date().toLocaleDateString('en-CA')}
  - Prioritize based on keywords like "urgent", "asap", "tomorrow", "next week".
  - Default the status to "To Do" unless specified otherwise.
  - Extract any dates or deadlines.
  - Generate a clear, concise task name.
  - Generate a description if sufficient detail is provided.

  User Input: {{{taskInput}}}
  `,
});

const aiProcessTaskInputFlow = ai.defineFlow(
  {
    name: 'aiProcessTaskInputFlow',
    inputSchema: AiProcessTaskInputSchema,
    outputSchema: AiProcessTaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
