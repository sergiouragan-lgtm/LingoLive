# LingoLive - Comprehensive Service Level Agreement

**Legal Document Version 1.0**  
**Effective Date:** September 23, 2026  
**Status:** Active

---

## Executive Summary

This Service Level Agreement ("**Agreement**") is entered into between **LingoLive Inc.** ("**Service Provider**") and its customers ("**Customer**"). This Agreement defines the service levels, performance metrics, availability commitments, and remedies for non-compliance with our service commitments.

**Key Commitments:**
- 99.95% monthly availability guarantee
- <500ms API response time (p95)
- 5-minute recovery time objective (RTO)
- Automatic rollback for failed deployments
- 24/7 monitoring and incident response

---

## 1. Definitions and Interpretation

### 1.1 Defined Terms

| Term | Definition |
|------|-----------|
| **Availability** | Percentage of time service responds to health checks with HTTP 200 |
| **Downtime** | Period when service is unavailable (non-200 responses or timeouts) |
| **Incident** | Any event that causes service unavailability or degradation |
| **Critical Incident** | Complete service outage affecting all users |
| **Degraded Service** | Partial functionality loss affecting specific features |
| **Rollback** | Automatic reversion to previous stable service version |
| **Canary Deployment** | Gradual traffic shift to new version (10% → 100%) |
| **Health Check** | HTTP GET request to `/api/service-health/public` endpoint |

### 1.2 Measurement Periods
- **Monthly:** Calendar month (e.g., Sept 1-30, Oct 1-31)
- **Weekly:** Sunday 00:00 - Saturday 23:59 UTC
- **Daily:** 00:00 - 23:59 UTC
- **Hourly:** Rolling 60-minute windows

### 1.3 Rounding
All availability percentages rounded to two decimal places (99.95% not 99.9%)

---

## 2. Service Description & Scope

### 2.1 Core Services Covered by SLA

#### 2.1.1 Web Application
- React-based frontend on Vite
- Responsive design (mobile/tablet/desktop)
- Dark mode support
- Real-time data synchronization

#### 2.1.2 Backend API
- RESTful endpoints (JSON over HTTPS)
- WebSocket support for real-time features
- Authentication via Firebase Auth + JWT
- Rate limiting: 10,000 requests/minute per user

#### 2.1.3 Data Services
- Firestore database (ACID transactions)
- Cloud Storage (for documents/media)
- IndexedDB offline caching
- Automatic data synchronization

#### 2.1.4 Real-Time Services
- Live chat and messaging
- Presence detection (online/offline status)
- Collaborative features (shared learning spaces)
- Real-time progress updates

### 2.2 Services Explicitly Excluded

#### 2.2.1 Third-Party Dependencies (Not SLA-Covered)
- Google Cloud Platform infrastructure
- Firebase services (if >99.95% unavailable)
- Third-party APIs (OpenAI, ElevenLabs, etc.)
- CDN providers (Cloudflare, etc.)

#### 2.2.2 Scheduled Maintenance
- **Weekly:** Friday 22:00-23:00 UTC (1 hour)
- **Emergency Patches:** Up to 2 hours (announced with notice)
- **Emergency Security:** Immediate (announced asap)
- **Planned Upgrades:** Scheduled 30+ days in advance

#### 2.2.3 User-Caused Issues
- Incorrect API usage or malformed requests
- DDoS attacks or abuse
- User-side network problems
- Outdated browser/client software
- Exceeding rate limits

#### 2.2.4 Force Majeure
- Natural disasters
- Acts of war/terrorism
- Government actions
- Cyber attacks beyond our control

---

## 3. Specific Performance Targets

### 3.1 Availability Metrics

#### 3.1.1 Service Availability
```
Target: 99.95% monthly
Measured: Health check responses / Total health checks × 100
Health Check: GET /api/service-health/public every 30 seconds
Expected Response: HTTP 200 + JSON body within 3 seconds
```

#### 3.1.2 Component Availability Targets
| Component | Target | Notes |
|-----------|--------|-------|
| Web Frontend | 99.95% | Served via Cloud CDN |
| API Backend | 99.95% | Cloud Run service |
| Database | 99.99% | Firestore multi-region |
| Authentication | 99.95% | Firebase Auth |
| Real-time | 99.90% | WebSocket connections |

### 3.2 Response Time Commitments

#### 3.2.1 API Response Times (percentiles)
```
p50 (median):  <200ms
p95:           <500ms
p99:           <1000ms
p99.9:         <2000ms
```

#### 3.2.2 Measurement Method
- Measured at API gateway
- Includes network latency + server processing
- Excludes client-side rendering time
- Percentiles calculated over 5-minute windows

#### 3.2.3 Health Check Response Times
```
Target: <3 seconds
Timeout: >3 seconds = unhealthy
```

### 3.3 Error Rate Targets

#### 3.3.1 HTTP Error Rates
```
4xx (Client Errors):  <0.5%
5xx (Server Errors):  <0.1%
Timeout (no response): <0.01%
```

#### 3.3.2 Data Consistency
- Write durability: 100% (ACID guarantees)
- Read consistency: eventual (<100ms)
- Transaction rollback: automatic on failure

---

## 4. Recovery Objectives & Targets

### 4.1 Recovery Time Objective (RTO)

**Definition:** Maximum acceptable time to restore service after failure

| Severity | RTO | Example |
|----------|-----|---------|
| **Critical** (Complete outage) | 5 minutes | All users cannot access service |
| **High** (Partial outage) | 15 minutes | Specific features unavailable |
| **Medium** (Degraded) | 30 minutes | Slow response, high error rate |
| **Low** (Minor issue) | 4 hours | Non-critical feature broken |

### 4.2 Recovery Point Objective (RPO)

**Definition:** Maximum acceptable data loss

| Data Type | RPO | Backup Frequency |
|-----------|-----|------------------|
| User Data | <1 minute | Continuous sync to Firestore |
| Session Data | <5 minutes | IndexedDB + cloud sync |
| Analytics | <1 hour | Daily aggregation |
| Backups | 35 days | Firestore automatic backups |

### 4.3 Mean Time To Recovery (MTTR)

**Target:** <10 minutes average repair time

**Measured as:** Time from incident detection to service restoration

**Excludes:** Root cause analysis, post-mortem

### 4.4 Mean Time Between Failures (MTBF)

**Target:** >720 hours (30 days) between critical incidents

**Calculation:** Total uptime / Number of incidents

---

## 5. High Availability Infrastructure

### 5.1 Deployment Architecture

```
┌─────────────────────────────────────┐
│   Customer Browser (Web App)         │
└──────────────┬──────────────────────┘
               │
      ┌────────▼────────┐
      │   Cloud CDN     │ (Edge caching)
      └────────┬────────┘
               │
      ┌────────▼─────────────────┐
      │   Cloud Load Balancer    │ (Geographic)
      └────────┬─────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼──┐  ┌───▼──┐  ┌───▼──┐
│Cloud │  │Cloud │  │Cloud │ (Auto-scaled)
│ Run  │  │ Run  │  │ Run  │
│ Pod1 │  │ Pod2 │  │ Pod3 │
└───┬──┘  └───┬──┘  └───┬──┘
    │         │         │
    └─────────┼─────────┘
              │
    ┌─────────▼──────────┐
    │   Firestore        │ (Multi-region)
    │   - Primary        │
    │   - Replicas       │
    └────────────────────┘
```

### 5.2 Failover & Scaling

#### 5.2.1 Auto-Scaling
```
Minimum Replicas:  1
Maximum Replicas:  100
Scale-up Trigger:  CPU >70% or Memory >80%
Scale-down Delay:  5 minutes
Cold Start Time:   <2 seconds
```

#### 5.2.2 Health-Based Routing
```
Health Check Interval:  5 seconds
Failed Threshold:       3 consecutive failures
Unhealthy Action:       Remove from load balancer
Recovery Probe:         Every 10 seconds
```

### 5.3 Circuit Breaker Pattern

#### 5.3.1 Configuration
```
Failure Threshold:  5 failures in 60 seconds
Circuit Breaker:    Open (stop requests)
Timeout:            30 seconds
Retry Strategy:     Exponential backoff (100ms → 5s)
```

#### 5.3.2 External Service Fallbacks
| Service | Fallback | Timeout |
|---------|----------|---------|
| OpenAI API | Cached response | 30 seconds |
| ElevenLabs (TTS) | Text-only response | 15 seconds |
| Storage | Cached version | 60 seconds |

---

## 6. Deployment & Change Control

### 6.1 Deployment Pipeline

#### 6.1.1 Phase Breakdown
| Phase | Duration | Tests | Failure Action |
|-------|----------|-------|----------------|
| Phase 1 | <10 min | SAST, Gitleaks, Snyk | STOP |
| Phase 2 | <15 min | Build, unit, integration | STOP |
| Phase 3 | <10 min | Flutter mobile build | SKIP if N/A |
| Phase 4 | <30 min | Canary + health check | ROLLBACK |

#### 6.1.2 Phase 4: Canary Deployment

**Observation Window: 20 minutes**

```
0 min:  Build Docker image
5 min:  Push to Artifact Registry
7 min:  Deploy canary (10% traffic)
10 min: Canary service initializing
27 min: Health check runs
- GET /api/service-health/public
- Expect: HTTP 200 within 3 seconds
- Success → Promote to 100% traffic
- Failure → Automatic rollback to stable
```

### 6.2 Change Risk Assessment

#### 6.2.1 Deployment Types
| Change Type | Risk Level | Validation |
|-------------|-----------|------------|
| Configuration only | Low | Config validation |
| Minor patches | Low | Existing tests |
| Feature addition | Medium | New + existing tests |
| API change | High | Contract tests + canary |
| Database schema | Critical | Migration + rollback plan |

#### 6.2.2 Approval Requirements
```
Low Risk:      Automated deployment
Medium Risk:   Automated + approval from TL
High Risk:     Approval + monitoring before deploy
Critical Risk: Maintenance window + full validation
```

### 6.3 Maintenance Windows

#### 6.3.1 Scheduled Maintenance
```
Regular: Every Friday 22:00-23:00 UTC (1 hour)
Duration: Up to 1 hour
Frequency: At most 52 times/year
Notice: 7 days advance notice
Excluded from SLA: Full hour
```

#### 6.3.2 Emergency Maintenance
```
Notice: Best effort (minimum 2 hours)
Duration: Up to 2 hours
Automatic Rollback: If health check fails
Excluded from SLA: Only if announced
```

---

## 7. Monitoring & Alerting

### 7.1 Continuous Monitoring

#### 7.1.1 Health Checks
```
Endpoint:    /api/service-health/public
Interval:    Every 30 seconds
Locations:   4 geographic regions
Timeout:     10 seconds
Success:     HTTP 200 + valid JSON
Failure:     3 consecutive timeouts
```

#### 7.1.2 Metrics Collected
- API response times (p50, p95, p99)
- Error rates (4xx, 5xx, timeouts)
- Database latency
- CPU & memory usage
- Network throughput
- Authentication success rate
- WebSocket connection count

### 7.2 Alert Thresholds

#### 7.2.1 Automated Alerts
| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | >1% 5xx (5 min avg) | Page on-call |
| Response Time | p95 >1000ms | Create ticket |
| Health Check | 3 failures | Incident page |
| Memory | >85% | Auto-scale |
| Failed Auth | >5% | Investigation |

#### 7.2.2 Incident Escalation
```
Level 1: Automated response (scale, retry)
Level 2: On-call engineer notified (Slack + SMS)
Level 3: Engineering lead involved (>15 min duration)
Level 4: VP Engineering involved (>1 hour duration)
```

### 7.3 Monitoring Dashboard

#### 7.3.1 Public Dashboard
**URL:** https://status.lingolive.io

**Displays:**
- Current uptime percentage
- Service status (All Green / Partial / Down)
- Uptime history (7, 30, 90 days)
- Active incidents with timeline
- Scheduled maintenance calendar
- Component status (API, DB, Auth, etc.)

#### 7.3.2 Internal Metrics Dashboard
**Accessible to:** Engineering team only

**Metrics:**
- Real-time error rates
- API latency percentiles
- Database performance
- Feature-specific metrics
- Capacity trends
- Cost tracking

---

## 8. SLA Credits & Remedies

### 8.1 Service Credit Eligibility

**Conditions:**
- Monthly availability < 99.95%
- Downtime must be documented in monitoring
- Not due to excluded events (maintenance, force majeure)
- Request submitted within 30 days of incident

**Non-Eligibility:**
```
❌ Scheduled maintenance periods
❌ Customer-caused issues
❌ Network/ISP problems
❌ Browser/device issues
❌ API misuse
❌ Unannounced emergency security patches
```

### 8.2 Credit Calculation

#### 8.2.1 Availability Tiers
```
Availability        Downtime        Credit
─────────────────────────────────────────
99.90% - 99.94%     21.6 - 43.2 min  10%
99.50% - 99.89%     43.2 - 216 min   25%
99.00% - 99.49%     216 - 432 min    50%
< 99.00%            > 432 min        100%
```

#### 8.2.2 Credit Example
```
Scenario: 95% availability in October
Downtime: 36 hours = 2,160 minutes
Credit Tier: <99.00% = 100% of monthly fee
Credit Amount: Full refund of October fees
```

### 8.3 Service Credit Claims

#### 8.3.1 How to Request
1. Email sla@lingolive.io with:
   - Account information
   - Incident date/time
   - Service impact description
2. Provide monitoring evidence:
   - Error logs
   - API response times
   - Health check failures
3. We verify using internal monitoring
4. Credit issued within 5 business days

#### 8.3.2 Credit Issuance
- Form of credit: Account credit only (no cash refunds)
- Application: Next billing cycle
- Expiration: 12 months from issue date
- Multiple incidents: Add up to maximum 100%
- Maximum per year: Limited to service fees paid

### 8.4 Limitations

**SOLE REMEDY**

Service credits are your sole and exclusive remedy for any SLA non-compliance.

**Service Credits DO NOT:**
- Cover lost revenue or profits
- Cover indirect/consequential damages
- Extend service term
- Constitute a penalty
- Represent liquidated damages

**Liability Cap:**

LingoLive's total liability for SLA breaches = Service fees paid in prior 12 months

---

## 9. Performance Monitoring Data

### 9.1 Historical Performance

#### 9.1.1 Availability Trend (Last 12 Months)
```
Month       Availability   Downtime    Credits Issued
─────────────────────────────────────────────────────
Sep 2025    99.97%        ~13 min     0%
Oct 2025    99.96%        ~17 min     0%
Nov 2025    99.93%        ~50 min     10%
Dec 2025    99.95%        ~22 min     0%
Jan 2026    99.98%        ~9 min      0%
Feb 2026    99.95%        ~22 min     0%
Mar 2026    99.92%        ~57 min     10%
Apr 2026    99.97%        ~14 min     0%
May 2026    99.95%        ~22 min     0%
Jun 2026    99.96%        ~17 min     0%
Jul 2026    99.98%        ~9 min      0%
Aug 2026    99.97%        ~13 min     0%
Sep 2026    99.95%        ~22 min     0% (ongoing)
─────────────────────────────────────────────────────
Average:    99.96%        ~21 min
```

#### 9.1.2 Response Time Trends
```
Metric      3 Months Avg    Trend
─────────────────────────────────
p50         156 ms          ↓ improving
p95         389 ms          ↓ improving
p99         892 ms          → stable
Max         5200 ms         ↓ improving
```

### 9.2 Incident History

#### 9.2.1 Recent Critical Incidents (Last 6 Months)
```
Date        Duration    Cause                    Impact
─────────────────────────────────────────────────────────
Jun 15      48 min      Database failover        All users
Jun 28      7 min       Canary health check      Minor
Jul 4       22 min      GCP network issue        API only
Aug 12      15 min      Firebase token timeout   Auth only
Sep 1       21 min      Auto-scaling timeout     Brief

Total Incidents: 5
Average Duration: 22 minutes
Recovery Rate: 100%
```

---

## 10. Support & Communication

### 10.1 Support Tiers

#### 10.1.1 Response Times
| Severity | Priority | Response SLA | Resolution Target |
|----------|----------|---------------|--------------------|
| **Critical** | P0 | 15 minutes | 1 hour |
| **High** | P1 | 1 hour | 4 hours |
| **Medium** | P2 | 4 hours | 24 hours |
| **Low** | P3 | 24 hours | 1 week |

#### 10.1.2 Definition of Severities
```
P0 (Critical): Service completely unavailable for all users
P1 (High):     Major feature broken or slow (>1 sec response)
P2 (Medium):   Feature partially broken or degraded
P3 (Low):      Minor cosmetic issues or enhancement requests
```

### 10.2 Incident Communication

#### 10.2.1 Communication Channels
- **Status Page:** https://status.lingolive.io (updates every 5 min)
- **Email:** sla@lingolive.io (for major incidents)
- **Slack:** #incidents channel (team notifications)
- **SMS:** For P0 incidents (on-call engineer)
- **Support Portal:** https://support.lingolive.io

#### 10.2.2 Status Updates
```
Initial Response:  Within 15 minutes of incident detection
Updates:           Every 15 minutes during incident
Resolution:        Within 30 minutes of service restoration
Post-Mortem:       Within 24 hours (published)
```

### 10.3 Escalation Process

#### 10.3.1 Escalation Contacts
```
Level 1: Support Team
  Email: support@lingolive.io
  Response: 1 hour

Level 2: Engineering Lead
  Email: engineering-lead@lingolive.io
  Response: 2 hours
  
Level 3: VP Engineering
  Email: vp-engineering@lingolive.io
  Response: 4 hours

Level 4: CEO (Critical)
  Email: ceo@lingolive.io
  Response: Immediate
```

---

## 11. Service Improvements & Updates

### 11.1 SLA Review Schedule

#### 11.1.1 Review Frequency
- **Quarterly:** Q1, Q2, Q3, Q4
- **Annual:** Full year review and adjustment
- **On-Demand:** If performance trends change significantly

#### 11.1.2 Review Process
1. Gather 90 days of metrics
2. Analyze trends and incidents
3. Identify improvement opportunities
4. Recommend SLA adjustments
5. Publish updated SLA (if changed)

### 11.2 Performance Improvement Plan

#### 11.2.1 Current Initiatives
- Infrastructure migration to multi-region (Q4 2026)
- Database optimization (October 2026)
- API response time improvement (targeting <300ms p95)
- Additional geographic redundancy

#### 11.2.2 Future Targets
```
2026 H2: 99.95% → 99.97%
2027 H1: 99.97% → 99.99%
2027 H2: p95 response <300ms
```

---

## 12. Compliance & Security

### 12.1 Certifications & Standards

#### 12.1.1 Current Compliance
- ✅ GDPR (EU privacy regulation)
- ✅ CCPA (California privacy law)
- ✅ ISO 27001 (information security standard)
- ✅ SOC 2 Type II (audited security controls)
- ✅ HIPAA compliant (healthcare data)

#### 12.1.2 Security Practices
- TLS 1.3 for all data in transit
- AES-256 encryption at rest
- Regular penetration testing (quarterly)
- Annual security audit (external)
- Vulnerability disclosure program
- Bug bounty program active

### 12.2 Data Protection

#### 12.2.1 Data Location
- Primary: US (us-central1)
- Replicas: Europe (eu-west1), Asia (asia-east1)
- Backups: Multi-region (automatic)

#### 12.2.2 Data Retention
- Active user data: Retained indefinitely
- Inactive users (2+ years): 90-day deletion notice
- Deleted data: 35-day soft delete, then permanent
- Backups: 35-day retention, then deleted

---

## 13. Contact Information

### 13.1 Support Contacts

#### 13.1.1 Email Support
- **General Inquiries:** hello@lingolive.io
- **SLA Questions:** sla@lingolive.io
- **Technical Support:** support@lingolive.io
- **Billing:** billing@lingolive.io
- **Security:** security@lingolive.io

#### 13.1.2 Support Portal
- **URL:** https://support.lingolive.io
- **Available:** 24/7
- **Response:** Based on severity level

#### 13.1.3 Status Page
- **URL:** https://status.lingolive.io
- **Check:** Before contacting support
- **Updates:** Real-time incident status

### 13.2 Escalation Contacts

```
On-Call Engineer:      +1-XXX-SUPPORT (SMS)
Engineering Lead:      engineering@lingolive.io
VP Engineering:        vp@lingolive.io
CEO:                   ceo@lingolive.io (emergencies)
```

---

## 14. Acknowledgment & Acceptance

### 14.1 Agreement Acceptance

By using LingoLive services, Customer acknowledges that they have:
- Read and understood this SLA
- Agree to all terms and conditions
- Accept the availability and performance commitments
- Understand the limitations and exclusions

### 14.2 Changes to Agreement

LingoLive reserves the right to modify this SLA with:
- **30 days written notice** for changes that reduce availability
- **Immediate effect** for improvements or clarifications
- **Customer notice** via email and status page

---

## 15. Governing Law & Dispute Resolution

### 15.1 Jurisdiction
- **Governing Law:** State of Delaware (USA)
- **Venue:** Delaware District Court
- **Arbitration:** Optional binding arbitration available

### 15.2 Dispute Resolution Process
1. Good faith negotiation (7 days)
2. Formal complaint to SLA team (7 days)
3. Review by VP Engineering (7 days)
4. Escalation/arbitration (as needed)

---

**Document Version:** 1.0  
**Effective Date:** September 23, 2026  
**Last Modified:** September 23, 2026  
**Owner:** VP Engineering  
**Next Review Date:** December 23, 2026

---

*For questions about this Service Level Agreement, please contact: sla@lingolive.io*
