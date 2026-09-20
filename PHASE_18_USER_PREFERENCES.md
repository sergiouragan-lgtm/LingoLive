# Phase 18: User Preferences & Notification Settings

## Overview

Implemented comprehensive user preference management system for fine-grained control over notification delivery, frequency, channels, and quiet hours. Enables users to customize their notification experience while respecting delivery preferences, rate limits, and do-not-disturb settings.

## Key Features

### 1. User Preferences Service

**UserPreferencesService** (`server/services/userPreferences.service.ts`)
- Complete lifecycle management of user notification preferences
- Per-channel control: in-app, push, email
- Per-type preferences: search alerts, trending topics, job completion/failure, achievements, milestones, messages, system alerts
- Each type configurable with: enabled flag, channel list, frequency (instant/hourly/daily/weekly/never)
- Global settings: master unsubscribe, do-not-disturb, quiet hours
- Rate limiting: configurable per-hour and per-day limits
- Delivery decision engine with comprehensive checks
- Notification delivery logging with reasons for blocking

### 2. Preference Types

```typescript
NotificationPreferences {
  // Channel preferences
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  
  // Per-type preferences
  searchAlerts: {
    enabled: boolean;
    channels: NotificationChannel[];
    frequency: NotificationFrequency;
  };
  // ... 7 more types
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;    // "HH:MM" format
  quietHoursEnd: string;      // "HH:MM" format
  quietHoursTimezone: string;
  
  // Rate limiting
  maxNotificationsPerDay: number;
  maxNotificationsPerHour: number;
  
  // Categories
  enabledCategories: string[];
  
  // Advanced
  unsubscribeAll: boolean;    // Master switch
  doNotDisturb: boolean;      // Temporary DND
}
```

### 3. Delivery Decision Engine

Comprehensive validation before notification delivery:
1. Master switch check (unsubscribeAll)
2. Channel enabled check
3. Type-specific preference check
4. Channel in type's channel list
5. Quiet hours check (push/email only during quiet hours)
6. Hourly rate limit check
7. Daily rate limit check

Returns: `{ shouldDeliver: boolean, reason?: string }`

### 4. REST API Endpoints

#### Core Preference Management
- `GET /api/user-preferences` — Get current preferences (auto-create defaults)
- `PUT /api/user-preferences` — Update multiple preferences at once
- `POST /api/user-preferences/reset` — Reset to default preferences

#### Per-Type Configuration
- `PUT /api/user-preferences/notification-type/{type}` — Update specific notification type preferences
  - Types: search_alert, trending_topic, job_complete, job_failed, achievement, milestone, message, system_alert

#### Channel Management
- `PUT /api/user-preferences/channel/{channel}` — Enable/disable channel
  - Channels: in_app, push, email

#### Quiet Hours
- `POST /api/user-preferences/quiet-hours` — Configure quiet hours with timezone support
  - Wraps around midnight automatically
  - Example: 22:00 to 08:00 = no push/email notifications between 10 PM and 8 AM

#### Do Not Disturb
- `POST /api/user-preferences/do-not-disturb` — Enable/disable temporary do-not-disturb mode

#### Analytics
- `GET /api/user-preferences/delivery-history` — Get delivery history with reasons (limit: 100-1000)
- `GET /api/user-preferences/stats` — Get notification statistics and analytics

### 5. Default Preferences

All new users get sensible defaults:

```typescript
{
  // Channels: all enabled
  inAppEnabled: true,
  pushEnabled: true,
  emailEnabled: false,  // Opt-in
  
  // Types: Instant in-app + push (except trending = daily digest)
  searchAlerts: { enabled: true, channels: [IN_APP, PUSH], frequency: INSTANT },
  trendingTopics: { enabled: true, channels: [IN_APP], frequency: DAILY },
  jobComplete: { enabled: true, channels: [IN_APP, PUSH], frequency: INSTANT },
  jobFailed: { enabled: true, channels: [IN_APP, PUSH], frequency: INSTANT },
  achievements: { enabled: true, channels: [IN_APP, PUSH], frequency: INSTANT },
  milestones: { enabled: true, channels: [IN_APP, PUSH], frequency: INSTANT },
  messages: { enabled: true, channels: [IN_APP, PUSH], frequency: INSTANT },
  systemAlerts: { enabled: true, channels: [IN_APP], frequency: INSTANT },
  
  // Quiet hours: 10 PM to 8 AM (UTC)
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  quietHoursTimezone: "UTC",
  
  // Rate limits: Permissive defaults
  maxNotificationsPerDay: 100,
  maxNotificationsPerHour: 20,
  
  // Categories: Learning-focused
  enabledCategories: ["learning", "social", "system"],
  
  // Advanced: All enabled by default
  unsubscribeAll: false,
  doNotDisturb: false,
}
```

## Integration with Phase 17

The delivery decision engine is called during notification creation:

```typescript
// Before broadcasting, check preferences
const { shouldDeliver, reason } = await userPreferencesService
  .shouldDeliverNotification(userId, notificationType, channel);

if (shouldDeliver) {
  notificationsGateway.broadcastToUser(userId, notification);
} else {
  // Log the blocked delivery for analytics
  await userPreferencesService.logDeliveryAttempt(
    userId, 
    notificationId, 
    channel, 
    false, 
    reason
  );
}
```

## File Structure

```
server/
├── services/
│   ├── userPreferences.service.ts           # Preference management
│   ├── notifications.service.ts             # (Phase 17)
│   └── queue.service.ts                     # (Phase 15)
└── routes/
    ├── userPreferences.routes.ts            # REST endpoints
    └── notifications.routes.ts              # (Phase 17)
```

## Database Schema

```firestore
user_preferences/
├── {userId}
│   ├── inAppEnabled: boolean
│   ├── pushEnabled: boolean
│   ├── emailEnabled: boolean
│   ├── searchAlerts: NotificationTypePreference
│   ├── trendingTopics: NotificationTypePreference
│   ├── ... (6 more types)
│   ├── quietHoursEnabled: boolean
│   ├── quietHoursStart: string
│   ├── quietHoursEnd: string
│   ├── quietHoursTimezone: string
│   ├── maxNotificationsPerDay: number
│   ├── maxNotificationsPerHour: number
│   ├── enabledCategories: string[]
│   ├── unsubscribeAll: boolean
│   ├── doNotDisturb: boolean
│   ├── createdAt: ISO8601
│   └── updatedAt: ISO8601

notification_delivery_logs/
├── {userId}/
    └── deliveries/
        ├── {logId}
        │   ├── userId: string
        │   ├── notificationId: string
        │   ├── channel: NotificationChannel
        │   ├── timestamp: ISO8601
        │   ├── delivered: boolean
        │   └── reason?: string
```

## Usage Examples

### Get Current Preferences
```bash
GET /api/user-preferences
```

### Update Multiple Preferences
```bash
PUT /api/user-preferences
{
  "pushEnabled": false,
  "maxNotificationsPerDay": 50,
  "doNotDisturb": false
}
```

### Disable Search Alert Notifications
```bash
PUT /api/user-preferences/notification-type/search_alert
{
  "enabled": false,
  "channels": [],
  "frequency": "never"
}
```

### Set Daily Digest Instead of Instant
```bash
PUT /api/user-preferences/notification-type/trending_topic
{
  "enabled": true,
  "channels": ["in_app", "email"],
  "frequency": "daily"
}
```

### Configure Quiet Hours (10 PM to 8 AM US Eastern)
```bash
POST /api/user-preferences/quiet-hours
{
  "start": "22:00",
  "end": "08:00",
  "timezone": "America/New_York",
  "enabled": true
}
```

### Enable Do Not Disturb for 2 Hours
```bash
POST /api/user-preferences/do-not-disturb
{
  "enabled": true
}
```

### Get Delivery Statistics
```bash
GET /api/user-preferences/stats
{
  "totalDelivered": 1542,
  "totalFailed": 23,
  "deliveryRate": 98.5,
  "preferredChannels": ["in_app", "push"],
  "mostActiveTime": "14:00"
}
```

### Get Recent Delivery History
```bash
GET /api/user-preferences/delivery-history?limit=50
```

### Reset to Defaults
```bash
POST /api/user-preferences/reset
```

## Performance Characteristics

| Operation | Complexity | Notes |
|---|---|---|
| Get preferences | O(1) | Single Firestore read |
| Update preferences | O(1) | Single Firestore write |
| Delivery decision | O(h) where h=history size | Checks past hour deliveries |
| Log delivery | O(1) | Single Firestore write |
| Get statistics | O(n) where n=all logs | Aggregates all delivery logs |

**Optimization strategies:**
- Cache preferences in memory with TTL
- Use Firestore indexes on (userId, timestamp) for delivery logs
- Batch delivery logs periodically
- Archive old logs to Cloud Storage (30+ days)

## Security & Privacy

1. **User Isolation**: Each user can only access/modify their own preferences
2. **Audit Trail**: All preference changes logged with timestamp
3. **Data Minimization**: Only required fields stored
4. **Consent**: Email notifications opt-in by default
5. **Right to Disconnect**: Master unsubscribe available at any time

## Monitoring & Analytics

**Metrics to track:**
- Preferences update frequency
- Most commonly disabled notification types
- Quiet hours usage patterns
- Do not disturb adoption rate
- Delivery rate by channel
- Failed delivery reasons distribution
- Rate limit hit frequency

**Dashboard metrics:**
- Users by preference combination
- Channel enablement rates
- Most active notification times
- Delivery success rate trends

## Future Enhancements

Potential extensions in subsequent phases:
- Notification templates per user
- Scheduled batch digests
- Smart quiet hours (calendar-aware)
- Machine learning-based optimal delivery times
- Preference presets (work profile, sleep profile)
- Notification grouping/batching
- Smart do-not-disturb (context-aware)
- Preference sync across devices
- A/B testing for preference suggestions
- Notification feedback loop (useful vs spam)

## Testing Recommendations

1. **Unit Tests**: Test delivery decision logic with various preference combinations
2. **Integration Tests**: Test preference CRUD with Firestore
3. **Rate Limiting Tests**: Verify hourly/daily limits work correctly
4. **Quiet Hours Tests**: Test edge cases (midnight wrap-around, timezones)
5. **Delivery Tests**: Verify notifications respect preferences
6. **Performance Tests**: Test with 100k+ users' preferences

---

**Status**: Phase 18 Complete ✅
- User preferences service fully implemented
- 10 REST API endpoints for preference management
- Delivery decision engine with 7-point validation
- Firestore persistence for preferences and delivery logs
- Default preferences for new users
- Comprehensive documentation and examples
- Integration ready with Phase 17 notifications
- Ready for frontend preference UI

