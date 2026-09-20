import { Router } from "express";
import { LiveKitService } from "../services/livekit.service";
import { requireAuth } from "../middleware/requireAuth";
import { dbAdmin } from "../config/firebaseAdmin";

const router = Router();

/**
 * POST /api/livekit/token
 * Generate token to join a live class
 */
router.post("/token", requireAuth, async (req: any, res: any) => {
  try {
    const { roomName, isInstructor } = req.body;
    const userId = req.user.uid;
    const userName = req.user.displayName || "Student";

    if (!roomName) {
      return res.status(400).json({ error: "roomName required" });
    }

    const tokenData = LiveKitService.generateToken(
      userId,
      userName,
      roomName,
      isInstructor || false,
      3600
    );

    res.json(tokenData);
  } catch (error: any) {
    console.error("[LiveKit Routes] Token generation failed:", error.message);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

/**
 * POST /api/livekit/room/create
 * Create a new live class room
 */
router.post("/room/create", requireAuth, async (req: any, res: any) => {
  try {
    const { roomName, maxParticipants, language, level, instructorName } = req.body;
    const userId = req.user.uid;

    if (!roomName) {
      return res.status(400).json({ error: "roomName required" });
    }

    const metadata = JSON.stringify({
      instructorId: userId,
      instructorName: instructorName || req.user.displayName,
      language: language || "portuguese",
      level: level || "beginner",
      createdAt: new Date().toISOString(),
    });

    const result = await LiveKitService.createRoom(roomName, {
      maxParticipants: maxParticipants || 50,
      metadata,
    });

    res.json({
      success: true,
      roomName: result.roomName,
      instructorId: userId,
    });
  } catch (error: any) {
    console.error("[LiveKit Routes] Room creation failed:", error.message);
    res.status(500).json({ error: "Failed to create room" });
  }
});

/**
 * GET /api/livekit/room/:roomName
 * Get room information
 */
router.get("/room/:roomName", async (req: any, res: any) => {
  try {
    const { roomName } = req.params;

    const roomInfo = await LiveKitService.getRoomInfo(roomName);

    if (!roomInfo) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json(roomInfo);
  } catch (error: any) {
    console.error("[LiveKit Routes] Failed to get room info:", error.message);
    res.status(500).json({ error: "Failed to get room info" });
  }
});

/**
 * GET /api/livekit/rooms
 * List all active rooms
 */
router.get("/rooms", async (req: any, res: any) => {
  try {
    const rooms = await LiveKitService.listActiveRooms();
    res.json({ rooms, count: rooms.length });
  } catch (error: any) {
    console.error("[LiveKit Routes] Failed to list rooms:", error.message);
    res.status(500).json({ error: "Failed to list rooms" });
  }
});

/**
 * POST /api/livekit/room/:roomName/end
 * End a live class session
 */
router.post("/room/:roomName/end", requireAuth, async (req: any, res: any) => {
  try {
    const { roomName } = req.params;
    const userId = req.user.uid;

    const roomInfo = await LiveKitService.getRoomInfo(roomName);
    if (!roomInfo) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (roomInfo.instructorId !== userId) {
      return res.status(403).json({ error: "Only instructor can end session" });
    }

    const success = await LiveKitService.endSession(roomName);

    if (!success) {
      return res.status(500).json({ error: "Failed to end session" });
    }

    // TODO: Save session stats to Firestore
    res.json({ success: true, roomName });
  } catch (error: any) {
    console.error("[LiveKit Routes] Failed to end session:", error.message);
    res.status(500).json({ error: "Failed to end session" });
  }
});

/**
 * DELETE /api/livekit/room/:roomName/participant/:participantId
 * Remove a participant
 */
router.delete(
  "/room/:roomName/participant/:participantId",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const { roomName, participantId } = req.params;
      const userId = req.user.uid;

      const roomInfo = await LiveKitService.getRoomInfo(roomName);
      if (!roomInfo) {
        return res.status(404).json({ error: "Room not found" });
      }

      if (roomInfo.instructorId !== userId) {
        return res.status(403).json({ error: "Only instructor can remove participants" });
      }

      const success = await LiveKitService.removeParticipant(roomName, participantId);

      if (!success) {
        return res.status(500).json({ error: "Failed to remove participant" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("[LiveKit Routes] Failed to remove participant:", error.message);
      res.status(500).json({ error: "Failed to remove participant" });
    }
  }
);

/**
 * GET /api/livekit/health
 * Health check
 */
router.get("/health", async (req: any, res: any) => {
  const health = await LiveKitService.healthCheck();
  res.status(health.healthy ? 200 : 503).json(health);
});

export default router;
