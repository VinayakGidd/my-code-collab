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









import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// --- CONFIGURATION ---
const openai = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY, 
});

// Store chat history per room in memory
const roomChats: Record<string, any[]> = {};

router.post('/ask', async (req, res) => {
    const { message, roomId } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });
    
    // Fallback if roomId is missing
    const currentRoomId = roomId || 'default';

    console.log(`🟢 Received message for Room ${currentRoomId}:`, message);

    try {
        // Initialize history for this room if missing
        if (!roomChats[currentRoomId]) {
            roomChats[currentRoomId] = [
                { role: "system", content: "You are a helpful AI coding assistant. Answer purely technical questions." }
            ];
        }

        // Add User Message
        roomChats[currentRoomId].push({ role: "user", content: message });

        const completion = await openai.chat.completions.create({
            messages: roomChats[currentRoomId],
            // ✅ UPDATED MODEL: Replaced deprecated 'llama3-70b-8192' with 'llama-3.3-70b-versatile'
            model: "llama-3.3-70b-versatile", 
            max_tokens: 1000,
            temperature: 0.7,
            stream: true,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let aiResponse = "";

        for await (const chunk of completion) {
            if (chunk.choices && chunk.choices.length > 0) {
                const delta = chunk.choices[0].delta;
                if (delta?.content) {
                    aiResponse += delta.content;
                    res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
                }
            }
        }

        res.end();

        // Save AI Response to History
        roomChats[currentRoomId].push({ role: "assistant", content: aiResponse });

        // Trim History
        if (roomChats[currentRoomId].length > 20) {
            roomChats[currentRoomId] = [
                roomChats[currentRoomId][0], 
                ...roomChats[currentRoomId].slice(-19)
            ];
        }

    } catch (error: any) {
        console.error("❌ API Error:", error);
        
        if (!res.headersSent) {
            res.status(500).json({ 
                error: "AI service unavailable", 
                details: error.message 
            });
        }
    }
});

export default router;



