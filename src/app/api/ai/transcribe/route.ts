// API Route: /api/ai/transcribe
// Transcribes audio using OpenAI gpt-4o-mini-transcribe
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no está configurada en las variables de entorno");
  }
  return new OpenAI({ apiKey });
}

// POST /api/ai/transcribe - Transcribe audio to text
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No se encontró archivo de audio" },
        { status: 400 }
      );
    }

    const client = getOpenAIClient();

    const transcription = await client.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: audioFile,
      language: "es",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    const message =
      error instanceof Error ? error.message : "Error al transcribir el audio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
