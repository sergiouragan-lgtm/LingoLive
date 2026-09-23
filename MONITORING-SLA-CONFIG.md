# LingoLive SLA Monitoring Configuration

**Internal Monitoring & Alerting Configuration**  
**Document Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-09-23

---

## Overview

This document defines the monitoring configuration, alert thresholds, and dashboards that track LingoLive's compliance with SLA commitments defined in `SERVICE-LEVEL-AGREEMENT.md`.

---

## 1. Health Check Configuration

### 1.1 Primary Health Check

```yaml
Name: Service Health Check (Public)
Endpoint: GET /api/service-health/public
Interval: 30 seconds
Timeout: 10 seconds
Locations:
  - us-central1 (US Central)
  - eu-west1 (Europe West)
  - asia-east1 (Asia East)
  - us-west1 (US West)
Success Criteria:
  - HTTP Status: 200
  - Response Time: < 3 seconds
  - Valid JSON body with "status": "healthy"
Failure Action: 
  - Alert after 3 consecutive failures
  - Trigger incident page after 5 minutes
```

### 1.2 Canary Health Check

```yaml
Name: Canary Deployment Health
Endpoint: /api/service-health/public (on canary URL)
Interval: Every minute (during deployment)
Timeout: 3 seconds
Observation Window: 20 minutes
Success Criteria:
  - HTTP 200 response
  - Response time < 3 seconds
Failure Action:
  - Automatic rollback to stable version
  - Alert engineering team
```

### 1.3 Database Health Check

```yaml
Name: Firestore Connection Test
Interval: 1 minute
Timeout: 5 seconds
Test:
  - Read from system collection
  - Verify replication latency
Success Criteria:
  - Read latency < 100ms (p95)
  - Replication delay < 1 second
Failure Action:
  - Alert: Database degradation
  - Severity: P1 (if latency > 500ms)
```

### 1.4 Authentication Health Check

```yaml
Name: Firebase Auth Test
Interval: 2 minutes
Timeout: 5 seconds
Test:
  - Create temporary user token
  - Verify token validation
  - Measure total auth latency
Success Criteria:
  - Auth latency < 500ms
  - Token validation < 100ms
Failure Action:
  - Alert: Auth service degradation
  - Severity: P1 (blocking)
```

---

## 2. Monitoring Metrics & Thresholds

### 2.1 API Response Time Metrics

```yaml
Metric: api.response_time
Unit: milliseconds
Percentiles:
  p50:
    Target: < 200ms
    Warning: > 250ms
    Critical: > 500ms
  p95:
    Target: < 500ms
    Warning: > 750ms
    Critical: > 1000ms
  p99:
    Target: < 1000ms
    Warning: > 1500ms
    Critical: > 2000ms

Collection: Every 5 seconds
Aggregation: 5-minute windows
Display: Real-time dashboard + historical trending
```

### 2.2 Error Rate Metrics

```yaml
Metric: api.error_rate
Unit: percentage
Categories:
  - 4xx_rate (client errors)
  - 5xx_rate (server errors)
  - timeout_rate (no response)

Thresholds:
  4xx_rate:
    Target: < 0.5%
    Warning: > 0.5%
    Critical: > 1%
  
  5xx_rate:
    Target: < 0.1%
    Warning: > 0.1%
    Critical: > 0.5%
  
  timeout_rate:
    Target: < 0.01%
    Warning: > 0.05%
    Critical: > 0.1%

Collection: Every 10 seconds
Aggregation: 1-minute + 5-minute windows
```

### 2.3 Availability Metrics

```yaml
Metric: service.availability_percentage
Unit: percentage
Target: 99.95%

Calculation:
  (Total Requests - Failed Requests) / Total Requests × 100

Failed Request Definition:
  - HTTP 5xx response
  - Timeout (> 10 seconds)
  - No response received

Windows:
  - 5-minute: Real-time detection
  - 1-hour: Trend analysis
  - Daily: Summary reporting
  - Monthly: SLA calculation
```

### 2.4 Infrastructure Metrics

```yaml
Metric: gcp.cloud_run
  cpu_utilization:
    Target: < 60%
    Warning: > 70%
    Critical: > 85%
    Scale-up Trigger: > 70%
  
  memory_utilization:
    Target: < 70%
    Warning: > 80%
    Critical: > 90%
    Scale-up Trigger: > 80%
  
  instance_count:
    Minimum: 1
    Maximum: 100
    Current: Auto-scaled

Metric: firestore.database
  read_latency_p95:
    Target: < 50ms
    Warning: > 100ms
    Critical: > 500ms
  
  write_latency_p95:
    Target: < 100ms
    Warning: > 250ms
    Critical: > 500ms
  
  replication_lag:
    Target: < 100ms
    Warning: > 500ms
    Critical: > 2000ms
```

---

## 3. Alert Rules & Thresholds

### 3.1 Critical Alerts (P0)

```yaml
Alert: api_response_time_critical
Condition: p95 response time > 1000ms for 5 minutes
Severity: P0
Action: Page on-call engineer immediately
Channel: Slack #incidents + SMS
Notification: "🚨 API response time CRITICAL: p95 > 1000ms"

Alert: error_rate_critical
Condition: 5xx error rate > 0.5% for 2 minutes
Severity: P0
Action: Page on-call engineer
Channel: Slack #incidents + SMS
Notification: "🚨 Server error rate CRITICAL: > 0.5%"

Alert: health_check_failing
Condition: 5 consecutive health check failures
Severity: P0
Action: Page on-call engineer + trigger incident
Channel: Slack #incidents + SMS + email
Notification: "🚨 Health check FAILING - possible outage"

Alert: database_unavailable
Condition: Firestore connection timeout > 30 seconds
Severity: P0
Action: Page on-call engineer
Channel: Slack #incidents + SMS
Notification: "🚨 Database CONNECTION FAILED"
```

### 3.2 High Alerts (P1)

```yaml
Alert: response_time_high
Condition: p95 response time > 750ms for 10 minutes
Severity: P1
Action: Create ticket + notify team
Channel: Slack #alerts + email
Notification: "⚠️ API response time HIGH: p95 > 750ms"
Escalate: If continues > 30 minutes

Alert: error_rate_high
Condition: 5xx error rate > 0.1% for 5 minutes
Severity: P1
Action: Create ticket + investigate
Channel: Slack #alerts + email
Notification: "⚠️ Server error rate elevated: > 0.1%"

Alert: high_resource_usage
Condition: CPU > 85% OR Memory > 90% for 5 minutes
Severity: P1
Action: Auto-scale + notify
Channel: Slack #alerts
Notification: "⚠️ Resource usage HIGH - scaling up"

Alert: auth_service_degraded
Condition: Auth response time > 500ms for 10 minutes
Severity: P1
Action: Investigate Firebase Auth
Channel: Slack #alerts
Notification: "⚠️ Authentication latency elevated"
```

### 3.3 Medium Alerts (P2)

```yaml
Alert: response_time_warning
Condition: p95 response time > 500ms for 15 minutes
Severity: P2
Action: Create task for investigation
Channel: Slack #monitoring
Notification: "ℹ️ API response time warning: > 500ms"

Alert: error_rate_warning
Condition: 4xx error rate > 0.5% for 10 minutes
Severity: P2
Action: Monitor + investigate
Channel: Slack #monitoring
Notification: "ℹ️ Client error rate elevated: > 0.5%"

Alert: database_latency_high
Condition: Firestore read latency p95 > 100ms
Severity: P2
Action: Monitor trending
Channel: Slack #monitoring
Notification: "ℹ️ Database latency warning"
```

### 3.4 Low Alerts (P3)

```yaml
Alert: performance_trend
Condition: Response time trending upward for 1 hour
Severity: P3
Action: Document trend
Channel: Slack #monitoring (digest)
Notification: "📊 Performance trend alert"
Frequency: Hourly digest

Alert: capacity_forecast
Condition: Usage trending above 80% of current capacity
Severity: P3
Action: Planning task created
Channel: Slack #monitoring
Notification: "📈 Capacity planning alert"
```

---

## 4. Alert Actions & Escalation

### 4.1 Automated Actions

```yaml
Trigger: Health check failure (3 consecutive)
Actions:
  1. Auto-scale up (if not already max)
  2. Clear CDN cache
  3. Create incident page entry
  4. Alert on-call engineer
  5. Log incident details

Trigger: CPU > 85%
Actions:
  1. Scale up replicas
  2. Alert monitoring team
  3. Monitor for further escalation

Trigger: Database latency > 1 second
Actions:
  1. Enable read replicas
  2. Clear query cache
  3. Alert DBA
  4. Monitor recovery

Trigger: Error rate > 1% for 1 minute
Actions:
  1. Trigger circuit breaker
  2. Page on-call engineer
  3. Begin incident investigation
```

### 4.2 Escalation Matrix

```
Level 1 (0-15 min): On-call Engineer
  - Receives immediate alert (Slack + SMS)
  - Acknowledges within 5 minutes
  - Begins investigation

Level 2 (15-30 min): Engineering Lead
  - Notified if issue not resolved
  - Provides technical guidance
  - May page additional engineers

Level 3 (30-60 min): VP Engineering
  - Escalated if still ongoing
  - Makes architectural decisions
  - Communicates with customer

Level 4 (>60 min): CEO/Exec Team
  - Involved in critical outages
  - Customer communication decisions
  - Post-incident leadership review
```

---

## 5. Monitoring Dashboards

### 5.1 Real-Time Operations Dashboard

**URL:** Internal only (cloudmonitoring.io)

**Widgets:**
```
Top Row (Status):
  - Service Status (Green/Yellow/Red)
  - Current Uptime %
  - Active Incidents Count
  - Response to Last Incident

Middle Row (Performance):
  - API Response Time (p50, p95, p99)
  - Error Rate by Type (4xx, 5xx, timeout)
  - Request Volume (req/sec)
  - Active Connections

Bottom Row (Infrastructure):
  - CPU Utilization (with warning zones)
  - Memory Utilization (with warning zones)
  - Instance Count (current/min/max)
  - Network Throughput

Refresh Rate: Every 5 seconds
Alert Integration: Live incident overlays
History: 24 hours default (adjustable)
```

### 5.2 Public Status Page Dashboard

**URL:** https://status.lingolive.io

**Displays:**
```
Header:
  - Overall Status (All Green / Partial / Down)
  - Current Uptime % (this month)
  - Last Updated (timestamps)

Current Status:
  - Web Application: Status + response time
  - API Backend: Status + request volume
  - Database: Status + read latency
  - Authentication: Status + auth latency
  - Real-time: Status + connection count

Incident Timeline:
  - Current incidents (if any)
  - Recent incidents (last 30 days)
  - Scheduled maintenance

Historical Uptime:
  - 7-day graph (hourly bars)
  - 30-day graph (daily bars)
  - 90-day summary table
  - Year-to-date summary

Components:
  - API (response time chart)
  - Database (latency chart)
  - Auth (success rate chart)

Notification Signup:
  - Email alerts for incidents
  - SMS for critical incidents
  - Webhook integration available
```

### 5.3 SLA Tracking Dashboard

**URL:** Internal - Finance Team

**Tracks:**
```
Current Month:
  - Uptime % (vs. 99.95% target)
  - Minutes of downtime (budget: 21.6)
  - Incidents count
  - Credits owed (if any)

Previous 12 Months:
  - Monthly uptime table
  - Trend chart (improving/degrading)
  - Credit history
  - Peak incidents month

SLA Compliance:
  - P0 incident response time (target: 15 min)
  - P1 resolution time (target: 4 hours)
  - Monthly average vs. quarterly trends

Recommendations:
  - Areas for improvement
  - Proposed infrastructure upgrades
  - Capacity planning notes
```

---

## 6. Incident Response Integration

### 6.1 Incident Workflow

```
Alert Fires
    ↓
On-Call Receives Notification
    ↓
Acknowledge Alert (within 5 min)
    ↓
Investigate Root Cause
    ↓
Implement Fix
    ↓
Validate Service Recovery (health check pass)
    ↓
Update Incident Page
    ↓
Post-Mortem (within 24 hours)
    ↓
Root Cause Analysis
    ↓
Preventive Action Items
```

### 6.2 Metrics Captured During Incidents

For every incident, automatically capture:
```
incident_id: Unique identifier
start_time: When issue detected
end_time: When resolved
duration: Total downtime minutes
affected_services: [list]
impact:
  - Users affected: count
  - Requests failed: count
  - Error rate: percentage
root_cause: description
fix_applied: description
resolution_time: minutes to fix
response_time: minutes to respond
customer_impact_hours: customer × hours affected
contributing_factors: [list]
```

---

## 7. Performance Reporting

### 7.1 Daily Report

**Sent:** 06:00 UTC to team@lingolive.io

```
Today's Summary (Sep 23, 2026):
Uptime: 99.98% (1 minute downtime)
Incidents: 0 (critical), 1 (medium)
Avg Response Time: 234ms (p95)
Error Rate: 0.02%
Peak Traffic: 1,200 req/sec at 14:00 UTC

Noteworthy:
- Database latency spike at 14:00 (resolved in 2 min)
- All health checks passing
- CPU scaling normal (peaked at 72%)

Actions Taken:
- None (all automatic)

Forecast:
- Scheduled maintenance: Friday 22:00 UTC (1 hour)
- Expected: No issues
```

### 7.2 Weekly Report

**Sent:** Every Monday to team@lingolive.io

```
Week of Sep 16-22, 2026:
Uptime: 99.96% (avg)
Total Downtime: 58 minutes across 3 incidents
Incidents:
  - Sep 18: Database connection (resolved 5 min)
  - Sep 19: Cache miss cascade (resolved 12 min)
  - Sep 21: Health check timeout (resolved 8 min)

Performance:
- Avg Response Time: p95 = 412ms (trending ↓)
- Error Rate: 0.08% (within SLA)
- Peak Traffic: 2,100 req/sec

Trends:
- Response time improving (412ms → 380ms)
- Error rate stable
- Capacity utilization: 65% (healthy)

Upcoming:
- Scheduled maintenance: This Friday
- Database optimization: In progress
- No major deployments planned
```

### 7.3 Monthly SLA Report

**Sent:** 1st of next month to stakeholders

```
SEPTEMBER 2026 - SLA COMPLIANCE REPORT

Overall Uptime: 99.95% ✓ (MEETS SLA)
Target: 99.95%
Downtime Budget: 21.6 minutes
Actual Downtime: 21.6 minutes
Credits Issued: None (exactly at target)

By Component:
- API: 99.96% ✓
- Database: 99.99% ✓
- Auth: 99.97% ✓
- Web: 99.95% ✓

Incidents Summary:
- Critical (P0): 0
- High (P1): 2 (resolved avg 18 min)
- Medium (P2): 5 (resolved avg 45 min)
- Total: 7 incidents

Performance Metrics:
- API Response Time p95: 412ms (target: <500ms) ✓
- Error Rate: 0.08% (target: <0.1%) ✓
- Health Check Success: 99.99% ✓

Year-to-Date (Jan-Sep):
- Average Uptime: 99.96%
- Total Incidents: 34
- Credits Issued: 0
- Best Month: June 99.98%
- Worst Month: March 99.92%

Infrastructure:
- Max Instances: 47 (out of 100 capacity)
- Avg CPU: 58%
- Avg Memory: 64%
- Database Queries: 1.2M/day (avg)

Recommendations:
1. Database read replicas performing well
2. Consider increasing reserve capacity for Q4
3. Caching improvements decreased latency 15%
4. Plan API v2 migration for Q1 2027
```

---

## 8. SLA Compliance Calculation

### 8.1 Monthly Uptime Calculation

```
Formula:
Uptime % = (Total Minutes - Downtime Minutes) / Total Minutes × 100

Example (September 2026):
Total Minutes in September: 43,200 (30 days × 24 hours × 60 min)
Downtime Minutes: 21.6 (from incidents)
Uptime %: (43,200 - 21.6) / 43,200 × 100 = 99.95%

Downtime Only Counts:
- Actual service unavailability (5xx, timeouts)
- NOT scheduled maintenance
- NOT user error or network issues
```

### 8.2 Service Credit Determination

```
If Uptime < 99.95%:
  Calculate downtime minutes
  Match to credit tier:
    99.90-99.94%  = 10% monthly fee
    99.50-99.89%  = 25% monthly fee
    99.00-99.49%  = 50% monthly fee
    < 99.00%      = 100% monthly fee
  
  Issue credit to customer account within 5 business days
```

---

## 9. Data Retention & Privacy

### 9.1 Monitoring Data Retention

```
Real-Time Metrics: 24 hours
  - 5-second granularity
  - Location: Cloud Monitoring

Recent History: 30 days
  - 1-minute aggregates
  - Location: Cloud Monitoring + BigQuery

Historical: 12 months
  - Daily aggregates
  - Location: BigQuery
  - Access: Finance, Engineering leadership

Logs:
- Incident logs: 90 days detailed, 1 year summary
- Error logs: 30 days
- Audit logs: 365 days

Privacy:
- No PII in monitoring data
- No customer data in logs
- Encrypted in transit and at rest
- Access controlled by role
```

---

## 10. Dashboard & Tool Integration

### 10.1 Monitoring Tools Stack

```
Primary: Google Cloud Monitoring
  - Metrics collection
  - Alert rules
  - Real-time dashboards

Logging: Cloud Logging + BigQuery
  - Incident logs
  - Error tracking
  - Historical analysis

Status Page: Statuspage.io
  - Public facing
  - Customer notifications
  - Maintenance scheduling

On-Call: PagerDuty
  - On-call scheduling
  - Alert routing
  - Escalation policies

Incident Tracking: Jira
  - Incident creation
  - Root cause tracking
  - Resolution follow-up

Communication: Slack
  - Real-time alerts
  - Team notifications
  - Incident channels
```

### 10.2 Integration Points

```
Health Check Failure
  → Cloud Monitoring alert
  → PagerDuty page
  → Slack #incidents
  → Jira incident creation
  → Status page update

Error Rate Spike
  → Cloud Monitoring alert
  → Slack #alerts notification
  → Dashboard overlay
  → Automatic investigation

Deployment Canary
  → Health check every minute
  → Real-time canary dashboard
  → Slack #deployments updates
  → Automatic rollback if needed
```

---

## 11. Maintenance & Updates

### 11.1 Alert Rule Maintenance

```
Review Schedule: Quarterly
  - Verify alert thresholds still appropriate
  - Check for new failure modes
  - Update escalation rules
  - Add new metric alerts

Testing: Monthly
  - Page on-call with test alert
  - Verify notification channels work
  - Test escalation path
  - Update runbooks if needed

Tuning:
  - Remove noisy alerts (false positives)
  - Adjust thresholds based on trends
  - Add new alerts for new services
  - Deprecate old alerts
```

### 11.2 Dashboard Maintenance

```
Monthly Review:
  - Update with latest metrics
  - Add/remove widgets as needed
  - Verify all data sources working
  - Update documentation

Quarterly Redesign:
  - Analyze usage patterns
  - Improve key metric visibility
  - Simplify unnecessary details
  - Add new performance trends
```

---

**Configuration Version:** 1.0  
**Last Updated:** September 23, 2026  
**Owner:** VP Engineering  
**Next Review:** December 23, 2026

For questions: sla@lingolive.io
