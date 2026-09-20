# STEP 2: LiveKit WebRTC Integration — Live Classes

**Status**: ✅ Implementado | **Timeline**: 3-4 dias | **Ready for Staging**: Sim

---

## Overview

LiveKit integração implementada para **live video/audio classes** em tempo real:
- ✅ Token generation (WebRTC access)
- ✅ Room creation & management  
- ✅ Participant tracking
- ✅ Multi-language support
- ✅ Recording-ready architecture
- ✅ Health checks & monitoring

---

## Architecture

```
┌─────────────────┐
│   Frontend      │
│ React + Vite    │
└────────┬────────┘
         │
    POST /api/livekit/token
    (Request access)
         │
┌────────▼────────┐
│   Backend       │
│   Express       │
└────────┬────────┘
         │
    LiveKitService.generateToken()
         │
┌────────▼────────────────┐
│   LiveKit Cloud         │
│   WebRTC Infrastructure │
└─────────────────────────┘
```

---

## Files Created

```
server/services/livekit.service.ts       (180 linhas)
server/routes/livekit.routes.ts          (150 linhas)
server/routes/__tests__/livekit.routes.test.ts (250 linhas)
```

**Total**: 580 linhas de código

---

## Part 1: LiveKit Cloud Setup

### 1.1 - Create Account

1. Go to https://livekit.io
2. Sign up for free tier (up to 5 concurrent participants)
3. Create project "LingoLive"
4. Get credentials:
   - `LIVEKIT_URL`: wss://your-project.livekit.cloud
   - `LIVEKIT_API_KEY`: xxxxx
   - `LIVEKIT_API_SECRET`: xxxxx

### 1.2 - Configure Environment

```bash
# .env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxx
LIVEKIT_API_SECRET=SECxxxx
```

### 1.3 - Test Connection

```bash
# Health check endpoint
curl https://localhost:3000/api/livekit/health

# Response (if configured):
# {"healthy":true}
```

---

## Part 2: Backend API Endpoints

### POST /api/livekit/token
**Generate token to join a class**

```bash
curl -X POST https://localhost:3000/api/livekit/token \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "class-portuguese-101",
    "isInstructor": false
  }'

# Response:
{
  "token": "eyJhbGc...",
  "url": "wss://...?token=eyJhbGc...",
  "roomName": "class-portuguese-101",
  "expiresAt": "2026-09-20T08:00:00Z"
}
```

### POST /api/livekit/room/create
**Create a new live class room**

```bash
curl -X POST https://localhost:3000/api/livekit/room/create \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "roomName": "class-portuguese-101",
    "language": "portuguese",
    "level": "intermediate",
    "instructorName": "Prof. João",
    "maxParticipants": 30
  }'

# Response:
{
  "success": true,
  "roomName": "class-portuguese-101",
  "instructorId": "user-123"
}
```

### GET /api/livekit/room/:roomName
**Get room info & participant list**

```bash
curl https://localhost:3000/api/livekit/room/class-portuguese-101

# Response:
{
  "roomName": "class-portuguese-101",
  "instructorId": "user-123",
  "instructorName": "Prof. João",
  "language": "portuguese",
  "level": "intermediate",
  "maxParticipants": 30,
  "participantCount": 5,
  "status": "active",
  "startTime": "2026-09-20T07:00:00Z",
  "participants": [...]
}
```

### GET /api/livekit/rooms
**List all active classes**

```bash
curl https://localhost:3000/api/livekit/rooms

# Response:
{
  "rooms": [
    {
      "roomName": "class-portuguese-101",
      "participantCount": 5,
      "instructorName": "Prof. João",
      ...
    },
    {
      "roomName": "class-spanish-201",
      "participantCount": 3,
      "instructorName": "Prof. Maria",
      ...
    }
  ],
  "count": 2
}
```

### POST /api/livekit/room/:roomName/end
**End a live class (instructor only)**

```bash
curl -X POST https://localhost:3000/api/livekit/room/:roomName/end \
  -H "Authorization: Bearer $FIREBASE_TOKEN"

# Response:
{
  "success": true,
  "roomName": "class-portuguese-101"
}
```

### DELETE /api/livekit/room/:roomName/participant/:participantId
**Remove participant (instructor only)**

```bash
curl -X DELETE https://localhost:3000/api/livekit/room/class-portuguese-101/participant/user-456 \
  -H "Authorization: Bearer $FIREBASE_TOKEN"

# Response:
{
  "success": true
}
```

### GET /api/livekit/health
**Health check**

```bash
curl https://localhost:3000/api/livekit/health

# Healthy:
{"healthy":true}

# Unhealthy:
{"healthy":false,"error":"LiveKit not configured"}
```

---

## Part 3: Frontend Integration

### 3.1 - Component Usage

```typescript
// src/components/live/LiveClassRoom.tsx

import { useEffect, useState } from 'react';
import { LiveKitClient } from 'livekit-client';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/firebase';

export function LiveClassRoom({ roomName, isInstructor }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateToken = async () => {
      try {
        const idToken = await getIdToken(auth.currentUser!);
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            roomName,
            isInstructor
          })
        });

        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        setError(err.message);
      }
    };

    generateToken();
  }, [roomName, isInstructor]);

  if (error) return <div className="error">{error}</div>;
  if (!token) return <div>Loading...</div>;

  return (
    <LiveKitClient
      url={`wss://your-livekit.cloud`}
      token={token}
      connect={true}
    >
      <div className="livekit-room">
        {/* LiveKit components go here */}
      </div>
    </LiveKitClient>
  );
}
```

### 3.2 - Dependencies

Already in package.json:
- ✅ `livekit-client`: ^2.20.0
- ✅ `livekit-server-sdk`: (add if needed)

```bash
npm install livekit-client
```

---

## Part 4: Testing Locally

### 4.1 - Start Server

```bash
npm run dev

# Should show:
# Server running on port 3000
# [LiveKit] ✅ Ready
```

### 4.2 - Test Endpoints

```bash
# Get Firebase token (from browser console)
const token = await firebase.auth().currentUser.getIdToken();

# Generate room token
curl -X POST http://localhost:3000/api/livekit/token \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"roomName":"test-class","isInstructor":true}'

# Create room
curl -X POST http://localhost:3000/api/livekit/room/create \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"roomName":"test-class","language":"portuguese"}'

# List rooms
curl http://localhost:3000/api/livekit/rooms

# Get room info
curl http://localhost:3000/api/livekit/room/test-class
```

### 4.3 - Test with LiveKit Inspect

LiveKit provides a web-based inspection tool:
1. Go to https://inspect.livekit.io
2. Enter your LIVEKIT_URL and API credentials
3. Create test rooms
4. Verify participant connections

---

## Part 5: Deployment Checklist

### Staging

```bash
# Build
npm run build

# Deploy
gcloud run deploy lingolive-staging \
  --set-env-vars \
    LIVEKIT_URL=wss://your-project.livekit.cloud \
    LIVEKIT_API_KEY=API... \
    LIVEKIT_API_SECRET=SEC...

# Test endpoint
curl https://lingolive-staging.run.app/api/livekit/health
```

### Production

Same as staging, but use production URLs.

---

## Part 6: Recording & Analytics

### 6.1 - Enable Recording

```typescript
// When creating room:
const metadata = {
  recordingEnabled: true,
  recordingPath: `gs://lingolive-recordings/class-portuguese-101/`,
  ...
};
```

### 6.2 - Save Recording URL

After session ends:
```typescript
await db.collection('liveClasses').doc(classId).update({
  recordingUrl: `gs://lingolive-recordings/...`
});
```

---

## Part 7: Monitoring

### Logs

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"' \
  'jsonPayload.message=~"\[LiveKit\]"'
```

### Metrics

- Room creation rate
- Active rooms
- Participant connections
- Token generation latency
- Error rates

---

## Troubleshooting

### Token Generation Fails

**Problem**: `LiveKit is not configured`  
**Solution**: Check env vars `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

### Cannot Connect to Room

**Problem**: WebRTC connection fails  
**Solution**: 
- Verify token is valid: check expiration
- Check browser firewall/proxy blocks WebRTC
- Try different browser/device

### Participants Cannot See Each Other

**Problem**: Video/audio not flowing  
**Solution**:
- Check permissions in token (canPublish, canSubscribe)
- Verify both users are in same room
- Check bandwidth (LiveKit needs 2.5 Mbps per participant)

---

## Next Steps

1. ✅ Backend service ready
2. ⏳ Frontend React components (in-progress)
3. ⏳ Recording integration (with Cloud Storage)
4. ⏳ Live chat integration (WebSocket)
5. ⏳ Session analytics & replay

---

**Status**: Ready for Staging  
**Responsible**: Backend Team  
**Slack**: #live-classes  
**Contact**: dev@lingolive.com
