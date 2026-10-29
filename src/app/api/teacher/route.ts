import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Chess Teacher, a friendly and clear chess coach.
- Answer the student's question about chess in plain language.
- Be practical and encouraging. Use short paragraphs.
- When helpful, give concrete examples (move notation like Nf3, e4, O-O is fine).
- If the question is vague, still give useful chess advice.
- Stay on chess topics. If asked something unrelated, briefly steer back to chess.
- Do not invent fake engine evaluations with precise centipawns unless the user provides a position; keep advice conceptual when no board is given.
- Keep answers under about 220 words unless the user asks for more detail.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    const context =
      typeof body?.context === "string" ? body.context.trim() : "";

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not set. Add it in Vercel → Project → Settings → Environment Variables, then redeploy.",
        },
        { status: 503 }
      );
    }

    const userText = context
      ? `Recent board / analysis context (optional):\n${context}\n\nStudent question: ${question}`
      : `Student question: ${question}`;

    // Default model (override with GEMINI_MODEL env if needed)
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userText }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg =
        data?.error?.message ||
        `Gemini request failed (${geminiRes.status})`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || "")
        .join("")
        .trim() || "";

    if (!answer) {
      return NextResponse.json(
        { error: "No response from the teacher model. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("teacher api error", err);
    return NextResponse.json(
      { error: "Something went wrong talking to the teacher." },
      { status: 500 }
    );
  }
}
