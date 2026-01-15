import { NextResponse } from "next/server";
import { ai } from "@/src/ai/genkit";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const result = await ai.generate({
      model: "gemini-1.5-pro",
      prompt,
    });

    return NextResponse.json({
      text: result.text(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
