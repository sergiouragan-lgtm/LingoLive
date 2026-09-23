# LingoLive Service Level Agreement (SLA)

**Effective Date:** 2026-09-23  
**Last Updated:** 2026-09-23  
**Version:** 1.0

---

## 1. Service Overview

LingoLive is an AI-powered language learning platform providing:
- Interactive language learning modules
- AI tutoring and pronunciation guidance
- Live classes and peer learning
- E-book curation and reading
- Real-time chat and collaboration features
- Mobile-first responsive experience

**Service Scope:** Cloud-hosted web application on Google Cloud Run with Firebase backend

---

## 2. Service Availability Commitment

### 2.1 Uptime SLA
**99.95% Monthly Availability**

- **Definition:** Percentage of time service is available and responding to requests
- **Measurement:** HTTP 200 responses to health check endpoint (`/api/service-health/public`)
- **Calculation:** (Total minutes in month - Downtime minutes) / Total minutes in month × 100

### 2.2 Downtime Allowance
| Availability | Maximum Monthly Downtime |
|--------------|--------------------------|
| 99.95%       | ~21.6 minutes            |
| 99.90%       | ~43.2 minutes            |
| 99.50%       | ~216 minutes (~3.6 hrs)  |

---

## 3. Service Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time** | <500ms (p95) | Measured at API gateway |
| **Health Check Response** | <3 seconds | `GET /api/service-health/public` |
| **Page Load Time** | <2 seconds (p95) | Frontend Vite app |
| **Database Query Latency** | <100ms (p95) | Firestore queries |
| **Authentication Latency** | <500ms | Firebase Auth + custom JWT |

---

## 4. Recovery Objectives

| Objective | Target | Notes |
|-----------|--------|-------|
| **RTO** (Recovery Time Objective) | 5 minutes | Time to restore service after failure |
| **RPO** (Recovery Point Objective) | <1 minute | Maximum acceptable data loss |
| **MTTR** (Mean Time To Repair) | 10 minutes | Average time to fix critical issues |
| **MTBF** (Mean Time Between Failures) | >720 hours (30 days) | Target reliability |

---

## 5. Availability Scope

### 5.1 Included Services
- ✅ Web application frontend (React/Vite)
- ✅ REST API endpoints
- ✅ WebSocket real-time connections
- ✅ Firebase Firestore database
- ✅ Firebase Authentication
- ✅ Cloud Storage
- ✅ Static assets delivery

### 5.2 Excluded from SLA
- ❌ **Scheduled Maintenance Windows:** 
  - Friday 22:00-23:00 UTC (1 hour/week)
  - Emergency patches (announced with 2-hour notice)
- ❌ **Third-party Services:**
  - Google Cloud infrastructure outages
  - Firebase service disruptions
  - Internet connectivity issues at user location
- ❌ **User-Caused Issues:**
  - Incorrect API usage
  - Network congestion at user's ISP
  - Browser/client compatibility issues

---

## 6. Monitoring & Alerting

### 6.1 Health Checks
```
Endpoint: GET /api/service-health/public
Interval: Every 30 seconds
Timeout: 10 seconds
Success Threshold: HTTP 200 response
```

### 6.2 Metrics Tracked
- Availability %
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Failed requests count
- Recovery time from failures
- Uptime per service component

### 6.3 Alert Thresholds
| Alert | Threshold | Action |
|-------|-----------|--------|
| High Error Rate | >1% 5xx errors (5 min avg) | Page on-call engineer |
| Slow Response | p95 >1000ms (5 min avg) | Investigate performance |
| Health Check Failure | 3 consecutive failures | Trigger auto-scaling/rollback |
| Canary Unhealthy | Health check timeout >3s | Automatic rollback initiated |

---

## 7. Deployment & Change Management

### 7.1 Deployment Windows
- **Canary Deployment:** 20-minute observation window
- **Traffic Promotion:** 10% → 100% (if health checks pass)
- **Automatic Rollback:** If health check fails after 20 min
- **Rollback Recovery:** <5 minutes to stable state

### 7.2 Change Control
- Code changes tested via Quality Gate (Phases 1-2)
- Docker image built and scanned (Phase 2)
- Canary validated (Phase 4)
- Production deployment only if all checks pass

---

## 8. High Availability Architecture

### 8.1 Infrastructure
- **Cloud Run:** Google Cloud managed container platform
  - Auto-scaling: 1-100 replicas
  - Load balancing: Geographic distribution
  - Health probes: Every 5 seconds
- **Database:** Firebase Firestore
  - Multi-region replication
  - Automatic failover
  - ACID transactions
- **Authentication:** Firebase Auth
  - Token refresh < 500ms
  - Session persistence via IndexedDB

### 8.2 Resilience Patterns
- Circuit breaker for external APIs
- Graceful degradation for non-critical features
- Exponential backoff for retries
- Request rate limiting (10k/min per user)
- DDoS protection via Cloud Armor

### 8.3 Backup & Disaster Recovery
- Firestore automated backups (daily)
- Point-in-time recovery (35-day retention)
- Geographic redundancy (multi-region)
- Fire drill testing (quarterly)

---

## 9. Support & Communication

### 9.1 Support Levels
| Severity | Response Time | Resolution Target |
|----------|---------------|-------------------|
| Critical (Complete outage) | 15 minutes | 1 hour |
| High (Degraded service) | 1 hour | 4 hours |
| Medium (Non-critical issue) | 4 hours | 24 hours |
| Low (Enhancement request) | 24 hours | 1 week |

### 9.2 Incident Communication
- **Status Page:** Real-time updates at status.lingolive.io
- **Email Notifications:** For major incidents
- **Slack Integration:** Real-time alerts to team
- **Post-Incident Reports:** Within 24 hours of resolution

---

## 10. SLA Credits & Remedies

### 10.1 Service Credits
If monthly availability falls below 99.95%, customers receive credits:

| Availability | Service Credit |
|--------------|----------------|
| 99.90% - 99.94% | 10% monthly fee |
| 99.50% - 99.89% | 25% monthly fee |
| 99.00% - 99.49% | 50% monthly fee |
| <99.00% | 100% monthly fee |

### 10.2 Credit Request Process
1. Customer submits request within 30 days of incident
2. We verify SLA breach using monitoring data
3. Credit issued as account credit (no cash refunds)
4. Credit applied to next billing cycle

---

## 11. Performance Monitoring Dashboard

### 11.1 Public Dashboard
Available at: `https://status.lingolive.io`

**Displays:**
- Current uptime %
- Service status (All Green/Partial/Down)
- Last 7 days uptime history
- Active incidents
- Scheduled maintenance

### 11.2 Internal Metrics
Tracked continuously:
- API latency percentiles
- Error rate by endpoint
- Database performance
- Authentication success rate
- Feature-specific metrics

---

## 12. Review & Updates

### 12.1 SLA Review Schedule
- **Quarterly Reviews:** Q1, Q2, Q3, Q4
- **Annual Audit:** End of fiscal year
- **Update Notification:** 30 days notice before changes

### 12.2 Performance Trends
- Monitor actual vs. target metrics
- Identify capacity bottlenecks
- Plan infrastructure improvements
- Update targets based on growth

---

## 13. Compliance & Certifications

### 13.1 Standards Met
- ✅ GDPR compliant
- ✅ ISO 27001 (information security)
- ✅ SOC 2 Type II (in progress)
- ✅ HIPAA compatible (data handling)

### 13.2 Security Commitments
- End-to-end encryption (TLS 1.3)
- Regular security audits
- Penetration testing (quarterly)
- Vulnerability disclosure program

---

## 14. Contact & Support

**For SLA Questions:**
- Email: sla@lingolive.io
- Support Portal: https://support.lingolive.io
- Status Page: https://status.lingolive.io
- Incident Hotline: +1-XXX-XXX-XXXX (24/7)

**Escalation:**
- Level 1: Support Team (1 hour response)
- Level 2: Engineering Lead (2 hour response)
- Level 3: VP Engineering (4 hour response)

---

## 15. Acknowledgment

By using LingoLive services, you acknowledge and agree to this SLA.

**Questions?** Contact our SLA team at sla@lingolive.io

---

**Document Control**
- Version: 1.0
- Status: Active
- Owner: VP Engineering
- Next Review: 2026-12-23
