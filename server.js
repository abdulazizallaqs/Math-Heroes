import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('.')); // Serve static files from current directory

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

// POST endpoint to generate question
app.post("/api/generate-question", async (req, res) => {
    try {
        const { level = 1, theme = "fun", type = "addition" } = req.body;
        console.log(`Received request: Level ${level}, Theme ${theme}, Type ${type}`);

        let aiData = null;

        // Priority 1: Semantic Router (or just if/else for now) -> Try OpenAI if key exists
        if (OPENAI_KEY) {
            aiData = await callOpenAI(level, theme, type);
        } else if (GOOGLE_KEY) {
            aiData = await callGemini(level, theme, type);
        } else {
            console.log("No API keys found. Returning fallback signal.");
            return res.json({ ok: false, error: "No API keys configured" });
        }

        if (aiData) {
            res.json({ ok: true, ai: aiData });
        } else {
            res.status(500).json({ ok: false, error: "Failed to generate AI response" });
        }

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

async function callOpenAI(level, theme, type) {
    const systemPrompt = `You are a math question generator for kids (ages 6-10).
    Output ONLY valid JSON with no markdown formatting.
    JSON Schema:
    {
        "question": "string",
        "answer": number,
        "choices": [number, number, number, number],
        "hint": "string"
    }
    Constraints:
    - Type: ${type}
    - Difficulty Level: ${level} (1=easy, 5=hard)
    - Theme: ${theme}
    - Ensure choices include the correct answer and 3 distinct distractors.
    `;

    const userPrompt = `Generate one ${type} question. Level ${level}. Theme: ${theme}.`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // or gpt-3.5-turbo
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        if (!data.choices || !data.choices[0]) throw new Error("Invalid OpenAI response");

        const content = data.choices[0].message.content;
        // Strip markdown code blocks if present
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanContent);
    } catch (e) {
        console.error("OpenAI Call Failed:", e);
        return null;
    }
}

async function callGemini(level, theme, type) {
    // Basic Gemini implementation
    const prompt = `
    You are a math question generator for kids.
    Generate one ${type} question for level ${level} with theme "${theme}".
    Output ONLY valid JSON.
    {
        "question": "string",
        "answer": number,
        "choices": [number, number, number, number],
        "hint": "string"
    }
    `;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_KEY}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (!data.candidates || !data.candidates[0]) throw new Error("Invalid Gemini response");

        const content = data.candidates[0].content.parts[0].text;
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanContent);
    } catch (e) {
        console.error("Gemini Call Failed:", e);
        return null;
    }
}

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
