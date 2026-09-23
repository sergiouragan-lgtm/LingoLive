# Phase 1: Internal Beta Plan (4 weeks)

**Duration**: Week 3-6 (after spike approval)  
**Status**: 📋 QUEUED (pending spike Phase 0 approval)  
**Approval Gate**: Spike Phase 0 decision = 🟢 GO

---

## 1. Internal Beta Overview

### Objective
Validate ChatGPT Live-1 provider in production-like environment with real users before full rollout.

### Success Criteria
- ✅ A/B test shows GPT Live-1 ≥ parity with current provider
- ✅ Real-world latency < 400ms P95 (acceptable)
- ✅ User engagement metrics stable or improved
- ✅ No critical bugs or API errors
- ✅ Cost analysis complete
- ✅ WER validated on 3+ dialects

### Timeline
```
Week 3-4: Beta Setup & Rollout
Week 4-5: Data Collection & Monitoring
Week 5-6: Analysis & Go/No-Go Decision
```

---

## 2. Beta User Selection

### Target Users: 50-100 LingoLive users

#### Selection Criteria

**Primary Pool**: Active users, 4+ weeks usage
- Consistent engagement (3+ sessions/week)
- Multiple language learning tracks
- Willingness to participate in beta

**Segmentation for A/B Test**:
- **Group A (50 users)**: Current provider (control)
- **Group B (50 users)**: GPT Live-1 (test)

#### Recruitment Method

```
1. Email invitation to power users (Week 2)
   Subject: "Exclusive Beta: New Voice Technology"
   
2. In-app notification pop-up (Week 3)
   "Help us test next-gen voice conversation"
   
3. Incentive: +100 streak points for participation
   
4. Rollout: Gradual, 50% at a time (mitigation)
```

#### User Distribution by Dialect

| Dialect | Group A | Group B | Total |
|---------|---------|---------|-------|
| PT-BR | 20 | 20 | 40 |
| ES-ES | 15 | 15 | 30 |
| ES-MX | 10 | 10 | 20 |
| Other | 5 | 5 | 10 |
| **Total** | **50** | **50** | **100** |

---

## 3. Beta Rollout Strategy

### Phase 1a: Soft Launch (Week 3)

```
Monday: Deploy to staging with 10% GPT Live-1 traffic
  ↓ Monitor for 24 hours
Wednesday: Expand to 25% traffic
  ↓ Monitor for 24 hours
Friday: Full rollout to internal beta group (50 users)
```

### Phase 1b: Monitoring (Week 4-5)

**Real-time metrics tracked**:
- Session duration
- Error rates
- API latency (P50, P95, P99)
- User engagement (clicks, features used)
- Cost per session
- WER on transcriptions

**Alerting thresholds**:
- ❌ STOP if: Latency > 600ms P95
- ❌ STOP if: Error rate > 10%
- ❌ STOP if: Session duration < baseline -20%
- ⚠️ WARN if: Cost > 3x baseline

---

## 4. A/B Test Design

### Test Structure

```
Hypothesis: GPT Live-1 voice conversations are at least 
as engaging and effective as current provider

Control (Group A): WhisperService (current)
Treatment (Group B): GPTLiveAdapter (spike)

Duration: 2 weeks (continuous)
Sample: 50 users per group
Randomization: User ID modulo 2
```

### Metrics Captured

#### Primary Metrics
| Metric | Current | GPT Live Target | Success |
|--------|---------|-----------------|---------|
| Session Duration | 15 min avg | ≥ 15 min | If ≥ baseline |
| Return Rate | 40% day 1 → day 2 | ≥ 40% | If ≥ baseline |
| Pronunciation Accuracy | <3% WER | <5% | If < 12% |
| Error Rate | <1% | <1% | If < 5% |

#### Secondary Metrics
| Metric | Purpose |
|--------|---------|
| Feature adoption | Full vs lite usage |
| Help requests | Support burden |
| Feedback score | NPS/CSAT |
| Cost per session | Económics |

### Statistical Significance

**Sample size**: 50 per group adequate for:
- 30% effect detection (power 0.8)
- 95% confidence level
- 2-week collection window

**Analysis timeline**: End of Week 5

---

## 5. Metrics Collection

### Automatic Collection (Real-time)

```typescript
// PracticeRoom automatically collects:
- Session start/end times
- Audio samples processed
- Latency per sample (P50, P95, P99)
- Transcription accuracy (vs actual)
- User feedback (mood, difficulty)
- Error events with stack traces

// SpikeMetricsCollector tracks:
- Dialect used
- Proficiency level
- Session type (free conversation, scenario, etc.)
- Cost estimation per session
```

### Manual Collection (End of week)

```
1. NPS survey (simple 1-10 scale)
2. Feature usage logs
3. Support ticket analysis
4. Cost reconciliation with OpenAI
5. WER validation (sample 100+ transcriptions)
```

### Export Format

```json
{
  "week": 1,
  "period": "2026-09-30 to 2026-10-06",
  "groupA": {
    "sessions": 150,
    "avgLatencyMs": 152,
    "p95LatencyMs": 165,
    "errorRate": 0.008,
    "avgSessionMinutes": 15.3,
    "returnRate": 0.42
  },
  "groupB": {
    "sessions": 148,
    "avgLatencyMs": 245,
    "p95LatencyMs": 310,
    "errorRate": 0.012,
    "avgSessionMinutes": 14.8,
    "returnRate": 0.38
  }
}
```

---

## 6. Contingency & Rollback

### Red Flags (Automatic Rollback)

| Event | Threshold | Action |
|-------|-----------|--------|
| API errors | >10% | Disable GPT Live immediately |
| Latency spike | P95 > 700ms | Switch to current provider |
| User churn | >30% drop vs baseline | Pause and investigate |
| Cost overrun | >5x baseline | Disable until negotiated |

### Rollback Procedure

**Manual rollback** (in case of red flag):

```bash
# 1. Disable GPT Live feature flag
VOICE_PROVIDER=current
# Redeploy

# 2. Notify all beta users
"We've paused the beta to improve performance"

# 3. Analyze logs
# Why did it fail? What changed?

# 4. Plan fix
# Update adapter? Renegotiate rates? Different strategy?

# 5. Restart after fix (if applicable)
```

---

## 7. Decision Gate (Week 6)

### Go Criteria (Proceed to Gradual Rollout)

✅ **ALL must be true**:

1. **Latency**: P95 < 400ms across all dialects
2. **WER**: < 8% on primary dialects (PT-BR, ES-ES, ES-MX)
3. **Engagement**: Session duration ≥ 95% of control group
4. **Reliability**: Error rate < 5% (vs current <1% is ideal)
5. **User feedback**: NPS ≥ 6/10 (vs current)
6. **Cost**: Negotiated rate ≤ $0.00020/min (2.3x acceptable)
7. **No red flags**: No API blocking issues

### No-Go Criteria (Defer or Pivot)

❌ **ANY of these trigger No-Go**:

1. Latency P95 > 500ms
2. WER > 12%
3. Session duration < 85% of control group
4. Error rate > 15%
5. 3+ user support escalations about quality
6. Cost cannot be negotiated below 3x current
7. API rate limiting or quota issues

### Borderline Cases (Conditional Go)

🟡 **Conditional approval** with constraints:

- Latency 400-500ms: OK if cost < 2x
- WER 8-10%: OK if limited to power users
- Cost 2.5-3x: OK if engagement metrics strong
- Error rate 5-10%: OK if fallback working perfectly

---

## 8. Phase 1 Success Metrics

| Outcome | Metric | Target |
|---------|--------|--------|
| **User Satisfaction** | NPS score | ≥ 6/10 |
| **Performance** | Latency P95 | < 400ms |
| **Quality** | WER | < 8% |
| **Reliability** | Uptime | > 99% |
| **Engagement** | Session duration | ≥ 95% baseline |
| **Economics** | Cost/min | ≤ $0.00020 |
| **Adoption** | Beta completion | > 80% |

---

## 9. Phase 2: Gradual Rollout (If approved)

### If Phase 1 succeeds: 4-week gradual rollout

```
Week 7:   5% of user base → GPT Live-1
Week 8:  25% of user base
Week 9:  50% of user base
Week 10: 100% of user base
```

### Rollout Gates
- **Week 7→8**: Latency stable, cost tracking
- **Week 8→9**: Engagement metrics holding
- **Week 9→10**: No new issues, ready for full launch

### Full Production Launch (Week 11)
- Remove feature flag
- Default all users to GPT Live-1
- Maintain current provider as fallback

---

## 10. Communication Plan

### Beta Users

```
Week 3 (Launch):
  Email: "You're invited to our beta!"
  In-app: "New voice conversation technology"
  
Week 4 (Mid-beta):
  Email: "How's the beta? Share feedback"
  Survey: 1-question NPS poll
  
Week 6 (End):
  Email: Decision result
  Next steps based on outcome
```

### Internal Team

```
Daily standup: Latency, errors, cost tracking
Weekly report: Metrics summary + decisions
Decision meeting (Week 6): All stakeholders
```

### Public (if approved)

```
Blog post: "Introducing enhanced voice conversations"
Feature announcement: LinkedIn, Twitter
Release notes: Detailed technical improvements
```

---

## 11. Budget & Resources

### Infrastructure Cost

| Item | Current | GPT Live Beta | Increase |
|------|---------|---------------|----------|
| Whisper API | $200/month | $0 | |
| OpenAI Live | $0 | $150/month* | +$150 |
| Monitoring | $50/month | $50/month | |
| **Total** | **$250** | **$200** | **-$50** |

*Estimated for 50-100 users, 100+ hours/week

### Human Resources

| Role | Time | Week 3-6 |
|------|------|----------|
| Data analyst | 50% | Metrics tracking |
| DevOps | 20% | Infrastructure |
| Eng manager | 100% | Decision making |
| Product | 30% | User communication |

---

## 12. Success Outcomes

### Scenario 1: 🟢 GO (Expected 70% probability)

```
→ Proceed to Phase 2: Gradual Rollout
→ Full production launch Week 11
→ Competitive advantage: Better voice, same cost
→ Customer retention +5-10% expected
```

### Scenario 2: 🟡 CONDITIONAL (20% probability)

```
→ Address specific concerns (cost, latency, WER)
→ Negotiate with OpenAI on rates
→ Run 2-week extended beta with fixes
→ Decide again in Week 8
```

### Scenario 3: 🔴 NO-GO (10% probability)

```
→ Pause GPT Live-1 rollout
→ Analyze failure root cause
→ Options:
   a) Improve adapter & retry in Q4
   b) Negotiate lower cost, retry
   c) Explore alternative providers (Gemini, Claude)
   d) Continue with current provider
```

---

## 13. Post-Beta Review (Week 6)

### Decision Meeting Agenda

1. **Metrics Review** (30 min)
   - A/B test results
   - Statistical significance
   - Cost analysis

2. **Stakeholder Input** (20 min)
   - Product: User feedback themes
   - Eng: Technical stability assessment
   - Finance: Cost-benefit analysis

3. **Decision** (10 min)
   - Go/No-Go vote
   - Approval for Phase 2

### Deliverables

- ✅ Beta metrics report (all data)
- ✅ A/B test analysis (statistical)
- ✅ Cost reconciliation (actual vs estimated)
- ✅ User feedback synthesis (themes)
- ✅ Go/No-Go recommendation (with rationale)

---

## 14. Risk Management

### Key Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Latency > 500ms | 15% | User churn | Fallback provider |
| Cost overrun | 25% | Budget impact | Rate negotiation |
| WER > 12% | 10% | Quality concerns | Limited rollout |
| API outages | 5% | Service disruption | Current provider fallback |
| Negative feedback | 20% | Reputation | Bug fixes, communication |

---

## Approval Checklist

**Before Phase 1 can start**:

- [ ] Spike Phase 0 approval (Go decision)
- [ ] 50-100 beta users recruited
- [ ] Staging environment deployed
- [ ] Metrics collection infrastructure ready
- [ ] Rollback procedure documented & tested
- [ ] Communication templates prepared
- [ ] Cost budget approved by Finance
- [ ] Support team briefed

---

**Phase 1 Status**: 📋 READY (pending Spike Phase 0 approval)

**Next milestone**: Week 6 Go/No-Go decision

---

*Internal Beta Plan — ChatGPT Live-1 Integration*  
*LingoLive — September 2026*
