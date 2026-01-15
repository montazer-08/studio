'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing files, extracting text, and summarizing key points.
 *
 * - aiFileAnalysis - A function that handles the file analysis process.
 * - AIFileAnalysisInput - The input type for the aiFileAnalysis function.
 * - AIFileAnalysisOutput - The return type for the aiFileAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIFileAnalysisInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      'A file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type AIFileAnalysisInput = z.infer<typeof AIFileAnalysisInputSchema>;

const AIFileAnalysisOutputSchema = z.object({
    summary: z.string().describe("A concise 3-4 sentence summary of the document's main purpose and key takeaways."),
    actionItems: z.array(z.string()).describe("A list of clear, actionable tasks or to-do items suggested by the document."),
    risks: z.array(z.string()).describe("A list of potential risks, warnings, or areas of concern highlighted in the document."),
    keyInsights: z.array(z.string()).describe("A list of the most important insights, conclusions, or critical pieces of information from the document.")
});
export type AIFileAnalysisOutput = z.infer<typeof AIFileAnalysisOutputSchema>;


export async function aiFileAnalysis(input: AIFileAnalysisInput): Promise<AIFileAnalysisOutput> {
  return aiFileAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiFileAnalysisPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: AIFileAnalysisInputSchema},
  output: {schema: AIFileAnalysisOutputSchema},
  prompt: `You are an expert analyst with X-Ray vision for documents. Your job is to perform a deep analysis of the provided file content.

Analyze the file and extract the following information:
1.  **Summary**: Provide a concise 3-4 sentence summary of the document's main purpose and key takeaways.
2.  **Action Items**: Identify and list any clear, actionable tasks or to-do items suggested by the document. If there are none, return an empty array.
3.  **Risks**: Identify and list any potential risks, warnings, or areas of concern highlighted in the document. If there are none, return an empty array.
4.  **Key Insights**: Identify and list the most important insights, conclusions, or critical pieces of information from the document.

Here is the file:
{{media url=fileDataUri}}
`,
});

const aiFileAnalysisFlow = ai.defineFlow(
  {
    name: 'aiFileAnalysisFlow',
    inputSchema: AIFileAnalysisInputSchema,
    outputSchema: AIFileAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
