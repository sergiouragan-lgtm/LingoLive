# Long-Term Learning Memory Architecture

## 1. Memory Service
The central entry point for interacting with user learning data stored in Firestore.

## 2. Context Builder
Aggregates memory items into structured prompts for the LLM.

## 3. Summarization & Compression Engine
Uses Gemini to periodically compress conversation history into meaningful snapshots to optimize token usage and context relevance.

## 4. Privacy & Expiration
- **Privacy**: `privacyLevel` field on `UserMemory` dictates exposure.
- **Expiration**: Firestore TTL policies should be applied to granular history collections, while `UserMemory` snapshots are persisted until user deletion.
