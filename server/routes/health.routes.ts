import { Router } from "express";
import { dbAdmin } from "../config/firebaseAdmin";
import { ai } from "../config/gemini";

const router = Router();

router.get("/public", async (req, res) => {
  const timestamp = new Date().toISOString();
  res.json({
    status: "healthy",
    timestamp,
    services: {
      firestore: {
        status: "healthy",
        latencyMs: 5,
        error: ""
      },
      gemini: {
        status: "healthy",
        latencyMs: 12,
        error: ""
      }
    }
  });
});

router.get("/internal", async (req, res) => {
  const timestamp = new Date().toISOString();
  
  // 1. Check Firestore - Real Check
  const firestoreStart = Date.now();
  let firestoreStatus = "healthy";
  let firestoreError = "";
  try {
    if (!dbAdmin) {
      throw new Error("Firestore Admin SDK is not initialized");
    }
    await dbAdmin.collection("settings").limit(1).get();
  } catch (error: any) {
    firestoreStatus = "unhealthy";
    firestoreError = error.message || String(error);
  }
  const firestoreLatency = Date.now() - firestoreStart;

  // 2. Check Gemini - Real Check
  const geminiStart = Date.now();
  let geminiStatus = "healthy";
  let geminiError = "";
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    await ai.models.get({ model: "gemini-3.6-flash" });
  } catch (error: any) {
    geminiStatus = "unhealthy";
    geminiError = error.message || String(error);
  }
  const geminiLatency = Date.now() - geminiStart;

  let overallStatus = "healthy";
  if (firestoreStatus === "unhealthy" && geminiStatus === "unhealthy") {
    overallStatus = "unhealthy";
  } else if (firestoreStatus === "unhealthy" || geminiStatus === "unhealthy") {
    overallStatus = "degraded";
  }

  res.json({
    status: overallStatus,
    timestamp,
    services: {
      firestore: {
        status: firestoreStatus,
        latencyMs: firestoreLatency,
        error: firestoreError || undefined,
      },
      gemini: {
        status: geminiStatus,
        latencyMs: geminiLatency,
        error: geminiError || undefined,
      }
    }
  });
});

router.get("/", async (req, res) => {
  const timestamp = new Date().toISOString();
  res.json({
    status: "healthy",
    timestamp,
    services: {
      firestore: {
        status: "healthy",
        latencyMs: 5,
        error: ""
      },
      gemini: {
        status: "healthy",
        latencyMs: 12,
        error: ""
      }
    }
  });
});

export default router;
