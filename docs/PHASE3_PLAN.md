# 🚀 Phase 3: Execution Engine Enhancement & Scheduler

**Date**: November 7, 2025  
**Status**: Starting Now  
**Estimated Time**: 2-3 hours

---

## 🎯 Goals

1. **Advanced Scheduler** - Cron-based workflow scheduling
2. **Trigger System** - Price alerts, indicator signals
3. **Real-time Monitoring** - WebSocket execution logs
4. **Background Jobs** - Queue system for workflows
5. **Retry Mechanism** - Auto-retry failed executions

---

## 📋 What We'll Build

### 3.1 Scheduler System

**File**: `backend/app/agentic/engine/scheduler.py`

**Features:**
- Cron-based scheduling (daily, hourly, custom)
- Price-based triggers (when price hits X)
- Indicator-based triggers (when RSI < 30)
- Time-based triggers (every 5 minutes)
- Background task queue

**Example:**
```python
# Schedule workflow to run every day at 9 AM
scheduler.add_job(
    workflow_id=123,
    trigger_type='cron',
    cron_expression='0 9 * * *'
)

# Trigger when EURUSD price > 1.10
scheduler.add_job(
    workflow_id=124,
    trigger_type='price',
    symbol='EURUSD',
    condition='price > 1.10'
)
```

---

### 3.2 Trigger Nodes

**File**: `backend/app/agentic/nodes/triggers.py`

**New Nodes:**
1. **Schedule Trigger** - Run on cron schedule
2. **Price Trigger** - Run when price condition met
3. **Indicator Trigger** - Run when indicator signal
4. **Time Trigger** - Run every X minutes
5. **Webhook Trigger** - Run on external webhook

---

### 3.3 Real-time Monitoring

**File**: `backend/app/agentic/routers/monitoring.py`

**Features:**
- WebSocket connection for live logs
- Real-time execution progress
- Node-by-node status updates
- Performance metrics
- Error notifications

**Frontend Component:**
- Live execution viewer
- Progress bars for each node
- Real-time logs
- Execution timeline

---

### 3.4 Background Job Queue

**File**: `backend/app/agentic/engine/job_queue.py`

**Features:**
- Redis-based queue (or in-memory)
- Job priority levels
- Retry mechanism (3 attempts)
- Job status tracking
- Concurrent execution

---

### 3.5 Enhanced Executor

**Update**: `backend/app/agentic/engine/executor.py`

**Improvements:**
- Parallel node execution (where possible)
- Better error handling
- Execution timeout
- Resource limits
- Execution history

---

## 🗄️ Database Changes

### New Tables:

```sql
-- Scheduled jobs table
CREATE TABLE scheduled_jobs (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id),
    user_id INTEGER REFERENCES users(id),
    trigger_type VARCHAR(50),  -- cron, price, indicator, time
    trigger_config JSONB,       -- Trigger configuration
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Job queue table
CREATE TABLE job_queue (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id),
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(50),         -- pending, running, completed, failed
    priority INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Execution metrics table
CREATE TABLE execution_metrics (
    id SERIAL PRIMARY KEY,
    execution_id INTEGER REFERENCES workflow_executions(id),
    total_nodes INTEGER,
    successful_nodes INTEGER,
    failed_nodes INTEGER,
    total_time_ms INTEGER,
    avg_node_time_ms INTEGER,
    memory_used_mb DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📡 New API Endpoints

### Scheduler Endpoints:

```typescript
// Create scheduled job
POST /api/agentic/scheduler/jobs
Body: {
  workflow_id: number,
  trigger_type: 'cron' | 'price' | 'indicator' | 'time',
  trigger_config: {
    cron_expression?: string,
    symbol?: string,
    condition?: string,
    interval_minutes?: number
  }
}

// Get all scheduled jobs
GET /api/agentic/scheduler/jobs

// Get job by ID
GET /api/agentic/scheduler/jobs/:id

// Update job
PUT /api/agentic/scheduler/jobs/:id

// Delete job
DELETE /api/agentic/scheduler/jobs/:id

// Pause/Resume job
POST /api/agentic/scheduler/jobs/:id/toggle

// Get job execution history
GET /api/agentic/scheduler/jobs/:id/history
```

### Monitoring Endpoints:

```typescript
// WebSocket for real-time logs
WS /api/agentic/monitoring/executions/:id

// Get execution metrics
GET /api/agentic/monitoring/executions/:id/metrics

// Get active executions
GET /api/agentic/monitoring/active

// Get execution timeline
GET /api/agentic/monitoring/executions/:id/timeline
```

### Job Queue Endpoints:

```typescript
// Get queue status
GET /api/agentic/queue/status

// Get pending jobs
GET /api/agentic/queue/pending

// Cancel job
POST /api/agentic/queue/jobs/:id/cancel

// Retry failed job
POST /api/agentic/queue/jobs/:id/retry
```

---

## 🎨 Frontend Components

### 3.1 Scheduler UI

**File**: `frontend/src/app/dashboard/agentic/scheduler/page.tsx`

**Features:**
- List all scheduled jobs
- Create new schedule
- Edit schedule
- Pause/Resume
- View execution history

---

### 3.2 Live Execution Monitor

**File**: `frontend/src/features/agentic/components/ExecutionMonitor.tsx`

**Features:**
- Real-time execution progress
- Node-by-node status
- Live logs
- Execution timeline
- Performance metrics

---

### 3.3 Job Queue Dashboard

**File**: `frontend/src/app/dashboard/agentic/queue/page.tsx`

**Features:**
- Pending jobs list
- Running jobs
- Completed jobs
- Failed jobs with retry option
- Queue statistics

---

## 🔄 Implementation Steps

### Step 1: Database Setup (30 mins)
1. Create Alembic migration
2. Add new tables
3. Test migration

### Step 2: Scheduler Backend (1 hour)
1. Create scheduler.py
2. Implement cron scheduling
3. Add trigger system
4. Test scheduling

### Step 3: Trigger Nodes (30 mins)
1. Create triggers.py
2. Implement trigger nodes
3. Register in executor
4. Test triggers

### Step 4: Job Queue (45 mins)
1. Create job_queue.py
2. Implement queue system
3. Add retry mechanism
4. Test queue

### Step 5: Monitoring (45 mins)
1. Create monitoring.py
2. Add WebSocket support
3. Implement metrics
4. Test real-time updates

### Step 6: Frontend (1 hour)
1. Create scheduler page
2. Create execution monitor
3. Create queue dashboard
4. Test UI

---

## 🧪 Testing Plan

### Unit Tests:
- Scheduler functions
- Trigger evaluation
- Queue operations
- Retry mechanism

### Integration Tests:
- Schedule workflow execution
- Trigger-based execution
- Queue processing
- WebSocket communication

### Manual Tests:
- Create scheduled job
- Wait for execution
- Monitor real-time
- Test retry on failure

---

## 📊 Success Metrics

| Feature | Target | Status |
|---------|--------|--------|
| Cron Scheduling | Working | 🔄 |
| Price Triggers | Working | 🔄 |
| Job Queue | Working | 🔄 |
| Real-time Monitoring | Working | 🔄 |
| Retry Mechanism | Working | 🔄 |
| Frontend UI | Complete | 🔄 |

---

## 🎯 Example Use Cases

### Use Case 1: Daily Strategy
```
Schedule: Every day at 9 AM
Workflow: RSI Oversold Strategy
Action: Check RSI, place trades if oversold
```

### Use Case 2: Price Alert
```
Trigger: EURUSD price > 1.10
Workflow: Send notification + Place order
Action: Execute when condition met
```

### Use Case 3: Indicator Signal
```
Trigger: RSI < 30 (oversold)
Workflow: Position sizing + Market order
Action: Auto-trade on signal
```

---

## 🔒 Safety Features

### Execution Limits:
- Max 10 concurrent executions per user
- Max 100 executions per day
- Timeout after 5 minutes
- Memory limit: 500MB per execution

### Error Handling:
- Auto-retry failed executions (3 attempts)
- Exponential backoff (1s, 5s, 15s)
- Error notifications
- Automatic job pause after 5 failures

### Monitoring:
- Track all executions
- Log all errors
- Alert on failures
- Performance metrics

---

## 📝 Configuration

### Scheduler Config:
```python
SCHEDULER_CONFIG = {
    'max_concurrent_jobs': 10,
    'check_interval_seconds': 60,
    'timezone': 'UTC',
    'enable_price_triggers': True,
    'enable_indicator_triggers': True,
}
```

### Queue Config:
```python
QUEUE_CONFIG = {
    'max_queue_size': 1000,
    'max_retries': 3,
    'retry_delay_seconds': [1, 5, 15],
    'job_timeout_seconds': 300,
}
```

---

## 🚀 Deployment Considerations

### Production Setup:
1. Use Redis for job queue (scalable)
2. Use Celery for background tasks (optional)
3. Monitor queue size
4. Set up alerts for failures
5. Regular cleanup of old jobs

### Performance:
- Queue processing: <100ms per job
- Trigger evaluation: <50ms
- WebSocket latency: <100ms
- Concurrent executions: 10+

---

## ✅ Deliverables

1. ✅ Scheduler system with cron support
2. ✅ Trigger nodes (5 types)
3. ✅ Job queue with retry
4. ✅ Real-time monitoring (WebSocket)
5. ✅ Frontend UI (3 pages)
6. ✅ Database migrations
7. ✅ API endpoints (15+)
8. ✅ Tests (unit + integration)
9. ✅ Documentation

---

## 🎉 After Phase 3

**You'll have:**
- Fully automated trading workflows
- Scheduled execution
- Real-time monitoring
- Robust error handling
- Production-ready system

**Next Phase 4:**
- Backtesting engine
- Historical data analysis
- Performance metrics
- Strategy optimization

---

**Ready to start Phase 3?** Let's build the scheduler! 🚀
