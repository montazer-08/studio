import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: 'AIzaSyBHwIPCsAyZ5OkFm3LEP_fwIyqmkqfCHAU', // !! تحذير: هذه الطريقة غير آمنة !!
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
