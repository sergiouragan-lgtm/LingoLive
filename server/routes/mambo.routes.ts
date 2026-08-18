import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { ai, generateContentWithRetry } from "../config/gemini";
import { safeAddDoc } from "../services/firestoreSafe.service";
import { mamboLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/chat", requireAuth, mamboLimiter, async (req: any, res: any) => {
  const { messages } = req.body;
  const userId = req.user.uid;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Mensagens são obrigatórias" });
  }

  try {
    const systemInstruction = `
Você é o "Mambo IA" (ou "Mambo Chat"), um assistente de conversação e amigo virtual que representa a essência cultural e o dia-a-dia de Angola.
Você conversa com extrema empatia, calor humano, proximidade e alegria.
Diferente de um tutor formal, você fala de forma relaxada, amigável e descontraída, como se estivesse a tomar um café ou uma Gasosa com o seu Kamba (amigo) no Lubango, Luanda, Benguela, ou Huambo.

### REGRAS DE LINGUAGEM:
1. Use termos típicos do Português de Angola de forma totalmente orgânica:
   - "Kamba" para amigo
   - "Mambo" para coisa, assunto, situação
   - "Fixe" ou "Bué" para legal, muito, excelente
   - "Bazar" para ir embora, sair
   - "Gasosa" para bebida ou incentivo/agrado informal
   - "Xé" como exclamação de surpresa ou atenção
2. Evite absolutamente termos brasileiros (como "cara", "legal", "você") ou sotaques de Portugal de maneira robótica. Fale com o ritmo e ginga do português angolano.
3. Se o utilizador perguntar por gírias, culinária (Mufete, Calulu, Funge), música (Kizomba, Semba, Kuduro) ou belezas naturais (Fendas da Tundavala, Quedas de Kalandula), explique tudo com muito orgulho e carinho.
4. Mantenha as mensagens envolventes e de tamanho amigável.
`;

    // Formulate contents for Gemini API using historical messages
    const formattedContents = messages.map((msg: any) => ({
      role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.text || msg.content || "" }]
    }));

    const response = await generateContentWithRetry({
      model: 'gemini-3.6-flash',
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    const aiResponseText = response.text || "Desculpa lá, kamba, o meu cérebro deu um nó agora! Vamos falar de outra coisa?";

    // Save chat session in Firestore sandbox for user records
    await safeAddDoc("mambo_chats", {
      userId,
      messages: [...messages, { role: "assistant", text: aiResponseText }],
      createdAt: new Date().toISOString()
    });

    res.json({ response: aiResponseText });
  } catch (error) {
    console.error("Error in Mambo Chat API:", error);
    res.status(500).json({ error: "Erro ao processar mambo chat." });
  }
});

export default router;
