import { Router, type IRouter, type Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";

import {
  CreateGeminiConversationBody,
  GetGeminiConversationParams,
  DeleteGeminiConversationParams,
  ListGeminiMessagesParams,
  SendGeminiMessageParams,
  SendGeminiMessageBody,
  GenerateGeminiImageBody,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

function isZodError(err: unknown): err is { issues: unknown[] } {
  return typeof err === "object" && err !== null && "issues" in err && Array.isArray((err as { issues: unknown }).issues);
}

function handleRouteError(err: unknown, res: Response, log: (msg: string) => void, context: string) {
  if (isZodError(err)) {
    res.status(400).json({ error: "Invalid request body", details: err.issues });
    return;
  }
  log(`Failed to ${context}: ${String(err)}`);
  res.status(500).json({ error: "Internal server error" });
}

const router: IRouter = Router();

router.get("/conversations", async (req, res) => {
  try {
    const convList = await db
      .select()
      .from(conversations)
      .orderBy(conversations.createdAt);
    res.json(convList);
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "list conversations");
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const body = CreateGeminiConversationBody.parse(req.body);
    const [conversation] = await db
      .insert(conversations)
      .values({ title: body.title })
      .returning();
    res.status(201).json(conversation);
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "create conversation");
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const { id } = GetGeminiConversationParams.parse({ id: Number(req.params.id) });
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    res.json({ ...conversation, messages: msgs });
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "get conversation");
  }
});

router.delete("/conversations/:id", async (req, res) => {
  try {
    const { id } = DeleteGeminiConversationParams.parse({ id: Number(req.params.id) });
    const deleted = await db
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "delete conversation");
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = ListGeminiMessagesParams.parse({ id: Number(req.params.id) });
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "list messages");
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = SendGeminiMessageParams.parse({ id: Number(req.params.id) });
    const body = SendGeminiMessageBody.parse(req.body);

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content: body.content,
    });

    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: allMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: { maxOutputTokens: 8192 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "send message");
  }
});

router.post("/generate-image", async (req, res) => {
  try {
    const body = GenerateGeminiImageBody.parse(req.body);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: [{ role: "user", parts: [{ text: body.prompt }] }],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data);
    if (!imagePart?.inlineData) {
      res.status(500).json({ error: "No image generated" });
      return;
    }
    res.json({ b64_json: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType ?? "image/png" });
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "generate image");
  }
});

export default router;
