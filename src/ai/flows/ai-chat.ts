'use server';
/**
 * @fileOverview A general purpose AI chat flow that supports streaming and model selection.
 *
 * - aiChat - A function that handles the chat process.
 * - AiChatInput - The input type for the aiChat function.
 * - AiChatOutput - The return type for the aiChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ModelReference } from '@genkit-ai/google-genai';
import { AI_PERSONALITIES } from '@/ai/personalities';


const AiChatInputSchema = z.object({
  query: z.string().describe("The user's query."),
  overclock: z.boolean().optional().describe("Whether to use the more powerful AI model."),
  personality: z.enum(Object.keys(AI_PERSONALITIES) as [keyof typeof AI_PERSONALITIES, ...(keyof typeof AI_PERSONALITIES)[]]).optional().describe('The selected AI personality.'),
  futureYouMode: z.boolean().optional().describe('Whether to activate the Future You personality.')
});
export type AiChatInput = z.infer<typeof AiChatInputSchema>;

// The output is a stream of strings
export type AiChatOutput = ReadableStream<string>;

export async function aiChat(input: AiChatInput, options?: { signal: AbortSignal }): Promise<{response: AiChatOutput}> {
  
  const model: ModelReference<'googleai'> = input.overclock 
    ? 'googleai/gemini-2.5-flash' // The "Super" version as requested
    : 'googleai/gemini-1.5-pro'; // The "Normal" powerful version
    
  let systemPrompt = AI_PERSONALITIES.default;
  if (input.futureYouMode) {
      systemPrompt = AI_PERSONALITIES.futureYou;
  } else if (input.personality) {
      systemPrompt = AI_PERSONALITIES[input.personality];
  }


  const {stream, response} = await ai.generateStream({
    model,
    prompt: `${systemPrompt}

Query: {{{query}}}
`,
    input: input,
    ...(options?.signal && { signal: options.signal }),
  });

  const outputStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(chunk.text);
      }
      controller.close();
    },
    cancel(reason) {
      console.log('Stream canceled:', reason);
    },
  });

  return { response: outputStream };
}
