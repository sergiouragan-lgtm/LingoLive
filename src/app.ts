
import express from "express";

const app = express();

// Rota para forçar o cliente a reiniciar a primeira janela de boas-vindas
app.get('/api/debug/reset-welcome', (req, res) => {
    console.log("[DEBUG] 🔄 Comando de reinício recebido. Forçando ecrã de boas-vindas.");
    
    // Instruímos o cliente (através da resposta) a resetar o fluxo
    res.status(200).json({
        action: "FORCE_RESET",
        targetStep: 0,
        message: "Reiniciando a primeira janela de boas-vindas do LingoLive."
    });
});

// Middlewares and routes will be imported here
export default app;
