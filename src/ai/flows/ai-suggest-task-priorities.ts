'use server';
/**
 * @fileOverview An AI agent to suggest task priorities based on deadlines, dependencies, and overall project goals.
 *
 * - suggestTaskPriorities - A function that suggests task priorities.
 * - SuggestTaskPrioritiesInput - The input type for the suggestTaskPriorities function.
 * - SuggestTaskPrioritiesOutput - The return type for the suggestTaskPriorities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskPrioritiesInputSchema = z.object({
  tasks: z
    .array(
      z.object({
        id: z.string().describe('The unique identifier of the task.'),
        title: z.string().describe('The title of the task.'),
        description: z.string().describe('A detailed description of the task.'),
        deadline: z.string().describe('The deadline for the task (ISO format).'),
        dependencies: z.array(z.string()).describe('A list of task IDs that this task depends on.'),
        isRecurring: z.boolean().describe('Whether the task is recurring or not'),
        status: z
          .enum(['Open', 'InProgress', 'Completed', 'Blocked'])
          .describe('The current status of the task'),
      })
    )
    .describe('A list of tasks to prioritize.'),
  projectGoals: z.string().describe('The overall goals of the project.'),
});

export type SuggestTaskPrioritiesInput = z.infer<typeof SuggestTaskPrioritiesInputSchema>;

const SuggestTaskPrioritiesOutputSchema = z.object({
  prioritizedTasks: z
    .array(
      z.object({
        taskId: z.string().describe('The ID of the task.'),
        priority: z
          .enum(['High', 'Medium', 'Low'])
          .describe('The suggested priority for the task.'),
        reason: z.string().describe('The reasoning behind the suggested priority.'),
      })
    )
    .describe('A list of tasks with suggested priorities and reasons.'),
});

export type SuggestTaskPrioritiesOutput = z.infer<typeof SuggestTaskPrioritiesOutputSchema>;

export async function suggestTaskPriorities(
  input: SuggestTaskPrioritiesInput
): Promise<SuggestTaskPrioritiesOutput> {
  return suggestTaskPrioritiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskPrioritiesPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: SuggestTaskPrioritiesInputSchema},
  output: {schema: SuggestTaskPrioritiesOutputSchema},
  prompt: `You are an AI assistant that helps users prioritize their tasks based on deadlines, dependencies, and overall project goals.

  Given the following project goals:
  {{projectGoals}}

  And the following tasks:
  {{#each tasks}}
  - Task ID: {{id}}
    Title: {{title}}
    Description: {{description}}
    Deadline: {{deadline}}
    Dependencies: {{dependencies}}
    Is Recurring: {{isRecurring}}
    Status: {{status}}
  {{/each}}

  Suggest a priority (High, Medium, or Low) for each task, and provide a reason for your suggestion. Consider deadlines, dependencies, and project goals when determining the priority.

  Format your response as a JSON object with a "prioritizedTasks" array. Each object in the array should have the following properties:
  - taskId: The ID of the task.
  - priority: The suggested priority for the task (High, Medium, or Low).
  - reason: The reasoning behind the suggested priority.
  `,
});

const suggestTaskPrioritiesFlow = ai.defineFlow(
  {
    name: 'suggestTaskPrioritiesFlow',
    inputSchema: SuggestTaskPrioritiesInputSchema,
    outputSchema: SuggestTaskPrioritiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
