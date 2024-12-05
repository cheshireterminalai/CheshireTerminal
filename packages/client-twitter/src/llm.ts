import fetch from "node-fetch";
import OpenAI from "openai";

import { ModelClass } from "@ai16z/eliza";

interface LMStudioResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export async function generateWithLMStudio(prompt: string, modelClass: ModelClass): Promise<string> {
    try {
        const response = await fetch("http://localhost:1234/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        const data = await response.json() as LMStudioResponse;
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Error generating with LM Studio:", error);
        throw error;
    }
}

export async function generateImage(prompt: string, openaiApiKey: string): Promise<string> {
    try {
        const openai = new OpenAI({ apiKey: openaiApiKey });
        
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        return response.data[0].url;
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
}

export async function generateImagePrompt(tweet: string, openaiApiKey: string): Promise<string> {
    try {
        const openai = new OpenAI({ apiKey: openaiApiKey });
        
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert at converting tweets into detailed image generation prompts. Create vivid, artistic prompts that capture the essence and emotion of the tweet while adding artistic style and detail."
                },
                {
                    role: "user",
                    content: `Convert this tweet into a detailed image generation prompt: "${tweet}"`
                }
            ],
            temperature: 0.7,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error generating image prompt:", error);
        throw error;
    }
}
