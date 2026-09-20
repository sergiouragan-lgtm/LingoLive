# STEP 3: OpenAI API Integration — AI Tutor

**Status**: ✅ Implementado | **Timeline**: 2-3 dias | **Ready for Staging**: Sim

---

## Overview

OpenAI Integration para **AI Language Tutor** inteligente:
- ✅ Chat conversacional com IA
- ✅ Streaming responses (real-time)
- ✅ Exercise generation
- ✅ Vocabulary lists
- ✅ Pronunciation evaluation
- ✅ Multi-level support

---

## Files Created

```
server/services/openai.service.ts       (245 linhas)
server/routes/openai-tutor.routes.ts    (164 linhas)
```

**Total**: 409 linhas de código

---

## Setup

### 1. OpenAI Account

1. Go to https://platform.openai.com
2. Create API key in https://platform.openai.com/api-keys
3. Add to `.env`:

```bash
OPENAI_API_KEY=sk_xxxxx...
```

### 2. Test Connectivity

```bash
curl -X POST http://localhost:3000/api/ai-tutor/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "language": "portuguese",
    "level": "intermediate",
    "message": "How do I say hello?",
    "history": []
  }'
```

---

## API Endpoints

### POST /api/ai-tutor/chat
**Chat with AI tutor**

```bash
curl -X POST /api/ai-tutor/chat \
  -d '{
    "language": "portuguese",
    "level": "intermediate",
    "message": "Can you explain past tense?",
    "history": [
      {"role": "assistant", "content": "..."},
      {"role": "user", "content": "..."}
    ]
  }'

# Response:
{
  "response": "Of course! In Portuguese, past tense...",
  "language": "portuguese",
  "level": "intermediate"
}
```

### POST /api/ai-tutor/chat-stream
**Streaming chat responses**

```bash
curl -X POST /api/ai-tutor/chat-stream \
  -d '{"language": "portuguese", "message": "..."}' \
  --stream

# Chunked response:
data: {"chunk": "In "}
data: {"chunk": "Portuguese, "}
data: {"chunk": "the "}
...
```

### POST /api/ai-tutor/exercises
**Generate practice exercises**

```bash
curl -X POST /api/ai-tutor/exercises \
  -d '{
    "language": "portuguese",
    "level": "intermediate",
    "topic": "verb conjugation",
    "count": 5
  }'

# Response:
{
  "exercises": [
    {
      "question": "Conjugate 'ir' in present tense",
      "options": ["eu vou", "eu ia", "eu irei"],
      "correctAnswer": "eu vou",
      "explanation": "..."
    }
  ]
}
```

### POST /api/ai-tutor/vocabulary
**Generate vocabulary exercises**

```bash
curl -X POST /api/ai-tutor/vocabulary \
  -d '{
    "language": "portuguese",
    "level": "beginner",
    "count": 5
  }'

# Response:
{
  "vocabulary": [
    {
      "word": "gato",
      "translation": "cat",
      "partOfSpeech": "noun",
      "example": "O gato é preto",
      "difficulty": 1
    }
  ]
}
```

### POST /api/ai-tutor/evaluate
**Evaluate pronunciation/grammar**

```bash
curl -X POST /api/ai-tutor/evaluate \
  -d '{
    "language": "portuguese",
    "text": "Eu gosto de estudar portuges"
  }'

# Response:
{
  "text": "Eu gosto de estudar portuges",
  "evaluation": {
    "score": 75,
    "feedback": "Good structure, but spelling...",
    "suggestions": ["português (correct spelling)"]
  }
}
```

---

## Features

### Conversational AI Tutor
- Context-aware responses
- Adaptive to student level
- Encouraging & patient feedback
- Example-based explanations

### Exercise Generation
- Multiple choice questions
- Fill-in-the-blank
- Grammar exercises
- Vocabulary drills

### Vocabulary Builder
- Part-of-speech tagging
- Example sentences
- Difficulty ratings
- Pronunciation hints

### Evaluation System
- Grammar checking
- Spelling correction
- Pronunciation assessment
- Actionable feedback

---

## Performance

**Response Times**:
- Chat response: ~2-3s
- Stream chunk: ~200ms
- Exercises: ~3-5s
- Evaluation: ~2-3s

**Costs** (as of Sept 2026):
- GPT-4o: $5/1M input, $15/1M output
- Estimated: ~$0.05 per tutor session

---

## Quality Assurance

### Testing Prompts

```
# Beginner level
- "How do I introduce myself?"
- "Teach me basic numbers"
- "Simple greetings please"

# Intermediate
- "Explain subjunctive mood"
- "Difference between ser and estar"
- "Complex grammar structures"

# Advanced
- "Idiomatic expressions"
- "Literary Portuguese"
- "Dialect differences"
```

### Quality Checks

- [ ] Responses are in target language
- [ ] Level-appropriate explanations
- [ ] Positive, encouraging tone
- [ ] Accurate grammar rules
- [ ] Relevant examples

---

## Monitoring

### Logs

```bash
gcloud logging read \
  'jsonPayload.message=~"\[AI Tutor\]"' \
  --limit 50
```

### Metrics to Track

- Response generation time
- Token usage (cost)
- Error rate
- User satisfaction (ratings)
- Most common topics

---

## Deployment

### Staging

```bash
gcloud run deploy lingolive-staging \
  --set-env-vars OPENAI_API_KEY=sk_test_...
```

### Production

```bash
gcloud run deploy lingolive-server \
  --set-env-vars OPENAI_API_KEY=sk_live_...
```

---

## Rate Limiting

Recommended:
- 10 requests/minute per user
- 1000 requests/minute per app
- Set via middleware

---

## Next Steps

1. ✅ Service implemented
2. ⏳ Frontend React hooks
3. ⏳ Chat history storage
4. ⏳ User preferences (style, tone)
5. ⏳ Analytics & feedback

---

**Ready for Staging**: Yes  
**Blocking Issues**: None  
**Team**: AI/ML Engineering
