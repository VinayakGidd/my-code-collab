// import express from 'express';
// import OpenAI from 'openai';
// import dotenv from 'dotenv';

// dotenv.config();
// const router = express.Router();

// const openai = new OpenAI({
//     baseURL: 'https://api.deepinfra.com/v1/openai',
//     apiKey: process.env.DEEPINFRA_API_KEY,
// });

// interface ChatCompletionMessage {
//     role: 'system' | 'user' | 'assistant';
//     content: string;
// }

// let conversationHistory: ChatCompletionMessage[] = [
//     { role: "system", content: "You are a helpful AI coding assistant." }
// ];

// router.post('/ask', async (req, res) => {
//     const { message } = req.body;
//     if (!message) {
//         return res.status(400).json({ error: 'Message is required' });
//     }

//     console.log("🟢 Received message from user:", message);

//     try {
//         conversationHistory.push({ role: "user", content: message });

//         const completion = await openai.chat.completions.create({
//             messages: conversationHistory,
//             model: "Qwen/Qwen2.5-Coder-32B-Instruct",
//             max_tokens: 1000,
//             temperature: 0.7,
//             stream: true,
//         });

//         res.setHeader('Content-Type', 'text/event-stream');
//         res.setHeader('Cache-Control', 'no-cache');
//         res.setHeader('Connection', 'keep-alive');

//         let aiResponse = "";

//         for await (const chunk of completion) {
//             if (chunk.choices && chunk.choices.length > 0) {
//                 const delta = chunk.choices[0].delta;
//                 if (delta?.content) {
//                     aiResponse += delta.content;
//                     res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
//                 }
//             }
//         }

//         res.end();
//         conversationHistory.push({ role: "assistant", content: aiResponse });

//         if (conversationHistory.length > 10) {
//             conversationHistory = conversationHistory.slice(-10);
//         }

//     } catch (error: unknown) {
//         console.error("❌ DeepInfra API Error:", error);
//         res.status(500).json({ error: "AI service unavailable", details: error instanceof Error ? error.message : "Unknown error" });
//     }
// });

// export default router;


import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

router.post("/ask", async (req: Request, res: Response) => {
    const { message } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContentStream(message);

        // 1. Set headers for Streaming (Server-Sent Events)
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // 2. Iterate through the stream from Google Gemini
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            
            // 3. Send data in the format api.ts expects: "data: { ... }"
            res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
        }

        // 4. Signal the end of the stream
        res.write("data: [DONE]\n\n");
        res.end();

    } catch (error) {
        console.error("❌ AI Route Error:", error);
        res.status(500).json({ error: "Failed to process AI request" });
    }
});

export default router;