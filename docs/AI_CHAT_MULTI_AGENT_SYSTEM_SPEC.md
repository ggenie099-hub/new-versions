# AI Chat Multi-Agent System - Complete Technical Specification

## Document Version: 1.0
## Date: December 2025

---

# SECTION 1: SYSTEM ARCHITECTURE OVERVIEW

## 1.1 High-Level Architecture

The system consists of five primary layers:

**Layer 1 - Presentation Layer (Next.js Frontend)**
- Claude-style three-panel chat interface
- Real-time WebSocket communication
- Agent selector with dynamic prompt cards
- Artifact viewer panel
- Model picker dropdown

**Layer 2 - API Gateway Layer (FastAPI)**
- Authentication middleware
- Rate limiting
- Request routing
- WebSocket manager
- Session management

**Layer 3 - Agent Orchestration Layer**
- Agent Manager (central coordinator)
- Agent Registry (stores agent definitions)
- Agent Router (routes messages to correct agent)
- Inter-Agent Communication Bus
- Prompt Card Manager

**Layer 4 - Intelligence Layer**
- Multi-Model Adapter (OpenAI, Claude, Mistral, Llama)
- Memory Manager (short-term + long-term)
- Context Builder
- Response Streamer
- Artifact Generator

**Layer 5 - Data Layer**
- PostgreSQL (users, chats, agents, artifacts)
- Redis (sessions, cache, real-time data)
- Vector Database (memory embeddings)
- File Storage (PDF, Excel artifacts)


## 1.2 UI Layout Specification (Claude-Style)

```
+------------------+------------------------+------------------+
|                  |                        |                  |
|  LEFT SIDEBAR    |    CENTER PANEL        |  RIGHT SIDEBAR   |
|  (280px-400px)   |    (flexible)          |  (300px-700px)   |
|                  |                        |                  |
|  - Chat History  |  - Conversation Area   |  - Artifacts     |
|  - Projects      |  - Message Bubbles     |  - PDF Reports   |
|  - Saved Agents  |  - Streaming Response  |  - Excel Files   |
|  - Folders       |                        |  - Charts        |
|                  |  +------------------+  |  - Tables        |
|                  |  | Agent Selector   |  |                  |
|                  |  | Model Picker     |  |                  |
|                  |  +------------------+  |                  |
|                  |  | Message Input    |  |                  |
|                  |  +------------------+  |                  |
|                  |  | PROMPT CARDS     |  |                  |
|                  |  | [Card1] [Card2]  |  |                  |
|                  |  | [Card3] [Card4]  |  |                  |
|                  |  +------------------+  |                  |
+------------------+------------------------+------------------+
```

**Resizable Panels:**
- Left sidebar: 280px min, 400px max, drag to resize
- Right sidebar: 300px min, 700px max, drag to resize
- Center panel: fills remaining space
- All panels collapsible via toggle buttons

---

# SECTION 2: SHORTCUT PROMPT CARDS SYSTEM

## 2.1 Prompt Card Data Structure

Each prompt card contains:
- Card ID (unique identifier)
- Card Title (short display text, max 50 chars)
- Card Description (tooltip text, max 150 chars)
- Full Prompt Text (actual prompt sent to agent)
- Card Icon (optional emoji or icon name)
- Card Category (quick-action, analysis, strategy, etc.)
- Agent ID (which agent this card belongs to)
- Visibility (global, agent-specific, user-specific)
- Priority (display order, 1-100)
- Is Active (boolean)

## 2.2 Prompt Card Sources (Priority Order)

When user selects an agent, cards load from these sources in order:

1. **User Custom Cards** (highest priority)
   - Cards created by user for this specific agent
   - Stored in user_prompt_cards table
   - User can create, edit, delete

2. **Agent Default Cards**
   - Preset cards defined for each agent
   - Stored in agent_prompt_cards table
   - Admin can modify

3. **Global Default Cards** (lowest priority)
   - Cards that appear for all agents
   - Stored in global_prompt_cards table
   - Admin manages

## 2.3 Card Display Rules

- Maximum 8 cards displayed at once
- Cards arranged in 2 rows of 4
- If more than 8 cards, show "More" button
- Cards animate in when agent changes (fade + slide)
- Clicking card fills input box with prompt text
- Long-press or right-click shows card options (edit, delete, copy)

## 2.4 Dynamic Card Loading Flow

```
User selects Agent X from dropdown
        ↓
Frontend sends: GET /api/agents/{agent_id}/prompt-cards
        ↓
Backend queries:
  1. user_prompt_cards WHERE user_id = current AND agent_id = X
  2. agent_prompt_cards WHERE agent_id = X AND is_active = true
  3. global_prompt_cards WHERE is_active = true
        ↓
Backend merges, deduplicates, sorts by priority
        ↓
Returns max 20 cards (frontend shows 8, rest in overflow)
        ↓
Frontend animates card transition (300ms fade)
```


---

# SECTION 3: TRADING AGENTS SPECIFICATION

## 3.1 Agent Definition Structure

Each agent is defined with:

**Identity:**
- Agent ID (unique, e.g., "forex_expert")
- Display Name (e.g., "Forex Trading Expert")
- Description (what this agent does)
- Avatar Icon (emoji or image URL)
- Category (trading, analysis, strategy, custom)

**Personality:**
- System Prompt (defines agent behavior)
- Tone (professional, casual, technical)
- Response Style (concise, detailed, step-by-step)
- Language Preference (English, Hindi, etc.)

**Capabilities:**
- Data Sources (which feeds it can access)
- Artifact Types (what outputs it can generate)
- Tools (functions it can call)
- Inter-Agent Calls (which agents it can invoke)

**Configuration:**
- Default Model (which LLM to use)
- Temperature (0.0 - 1.0)
- Max Tokens (response length limit)
- Memory Enabled (boolean)
- Streaming Enabled (boolean)

**Prompt Cards:**
- List of default prompt cards for this agent

## 3.2 Pre-Built Trading Agents

### Agent 1: Forex Trading Expert
- **Role:** Analyze forex pairs, provide entry/exit signals
- **Data Sources:** Forex feeds, economic calendar, news
- **Personality:** Professional, data-driven, risk-aware
- **Artifacts:** Trade signals PDF, currency analysis report
- **Default Prompt Cards:**
  1. "Analyze EUR/USD for today's trading session"
  2. "What are the key support/resistance levels for GBP/JPY?"
  3. "Generate a forex trading plan for this week"
  4. "Explain the impact of upcoming Fed decision on USD pairs"

### Agent 2: Crypto Trading Expert
- **Role:** Analyze crypto markets, DeFi, on-chain data
- **Data Sources:** Crypto feeds, on-chain metrics, social sentiment
- **Personality:** Tech-savvy, trend-focused, volatility-aware
- **Artifacts:** Crypto analysis report, portfolio allocation
- **Default Prompt Cards:**
  1. "Analyze BTC/USD current market structure"
  2. "What altcoins are showing bullish divergence?"
  3. "Explain the current DeFi yield opportunities"
  4. "Generate a crypto portfolio rebalancing plan"

### Agent 3: Options Trading Analyst
- **Role:** Options strategies, Greeks analysis, chain analysis
- **Data Sources:** Options chain data, IV data, earnings calendar
- **Personality:** Mathematical, probability-focused, strategy-oriented
- **Artifacts:** Options strategy PDF, Greeks table, P&L chart
- **Default Prompt Cards:**
  1. "Analyze NIFTY options chain for expiry"
  2. "Suggest an iron condor strategy for BANKNIFTY"
  3. "Calculate max profit/loss for this spread"
  4. "What's the implied volatility telling us?"

### Agent 4: Technical Analysis Agent
- **Role:** Chart patterns, indicators, price action
- **Data Sources:** OHLCV data, indicator calculations
- **Personality:** Visual, pattern-focused, objective
- **Artifacts:** Technical analysis report, annotated charts
- **Default Prompt Cards:**
  1. "Identify chart patterns on RELIANCE daily"
  2. "What do RSI and MACD indicate for TATASTEEL?"
  3. "Find stocks with bullish engulfing patterns"
  4. "Explain the current market structure"

### Agent 5: Fundamental Analysis Agent
- **Role:** Company financials, valuations, sector analysis
- **Data Sources:** Financial statements, ratios, news
- **Personality:** Value-focused, long-term, research-oriented
- **Artifacts:** Company analysis PDF, valuation model
- **Default Prompt Cards:**
  1. "Analyze HDFC Bank's quarterly results"
  2. "Compare PE ratios of IT sector stocks"
  3. "What's the intrinsic value of Infosys?"
  4. "Identify undervalued stocks in pharma sector"

### Agent 6: News & Sentiment Agent
- **Role:** Market news, sentiment analysis, event impact
- **Data Sources:** News feeds, social media, sentiment APIs
- **Personality:** Current, alert, context-aware
- **Artifacts:** News summary, sentiment report
- **Default Prompt Cards:**
  1. "What's moving the market today?"
  2. "Summarize news affecting banking stocks"
  3. "What's the social sentiment on ADANI stocks?"
  4. "Alert me on any breaking market news"

### Agent 7: Risk Management Agent
- **Role:** Position sizing, risk assessment, portfolio risk
- **Data Sources:** Portfolio data, correlation matrices
- **Personality:** Conservative, protective, analytical
- **Artifacts:** Risk report, position sizing calculator
- **Default Prompt Cards:**
  1. "Calculate position size for 2% risk"
  2. "Analyze my portfolio's risk exposure"
  3. "What's the optimal stop-loss for this trade?"
  4. "Generate a risk management plan"

### Agent 8: Strategy Builder Agent
- **Role:** Create and optimize trading strategies
- **Data Sources:** Historical data, backtest results
- **Personality:** Creative, systematic, optimization-focused
- **Artifacts:** Strategy document, Pine Script code
- **Default Prompt Cards:**
  1. "Create a Pine Script v6 EMA crossover indicator"
  2. "Design a mean reversion strategy for NIFTY"
  3. "Optimize my existing strategy parameters"
  4. "Convert this v5 Pine Script to v6"

### Agent 9: Backtesting Summary Agent
- **Role:** Interpret backtest results, suggest improvements
- **Data Sources:** Backtest engine output
- **Personality:** Analytical, improvement-focused
- **Artifacts:** Backtest report, performance comparison
- **Default Prompt Cards:**
  1. "Explain my backtest results"
  2. "Why is my strategy's Sharpe ratio low?"
  3. "Compare these two strategy backtests"
  4. "Suggest improvements based on drawdown analysis"


---

# SECTION 4: USER-CREATED CUSTOM AGENTS

## 4.1 Custom Agent Creation Flow

User creates custom agent from Dashboard → My Agents → Create New:

**Step 1: Basic Info**
- Agent Name (required)
- Description (required)
- Avatar (select from icons or upload)
- Category (select or create)

**Step 2: Personality Configuration**
- Base Template (start from existing agent or blank)
- System Prompt (textarea with suggestions)
- Tone Selection (dropdown: professional, casual, technical, friendly)
- Response Style (dropdown: concise, detailed, step-by-step)

**Step 3: Capabilities**
- Data Sources (checkboxes: forex, crypto, options, news, etc.)
- Artifact Types (checkboxes: PDF, Excel, charts, tables)
- Enable Memory (toggle)
- Enable Inter-Agent Calls (toggle + select which agents)

**Step 4: Model Settings**
- Default Model (dropdown from available models)
- Temperature Slider (0.0 - 1.0)
- Max Response Length (dropdown: short, medium, long)

**Step 5: Prompt Cards**
- Add custom prompt cards (title + full prompt)
- Reorder cards via drag-drop
- Import cards from other agents (optional)
- Minimum 2 cards, maximum 20 cards

**Step 6: Test & Save**
- Test chat with agent before saving
- Save creates entry in user_custom_agents table
- Agent appears in user's agent dropdown immediately

## 4.2 Custom Agent Storage

**Table: user_custom_agents**
- id (primary key)
- user_id (foreign key)
- agent_name
- description
- avatar_url
- category
- system_prompt
- tone
- response_style
- data_sources (JSON array)
- artifact_types (JSON array)
- memory_enabled
- inter_agent_enabled
- allowed_agents (JSON array)
- default_model
- temperature
- max_tokens
- is_active
- created_at
- updated_at

**Table: user_agent_prompt_cards**
- id (primary key)
- user_id (foreign key)
- agent_id (foreign key to user_custom_agents)
- card_title
- card_description
- full_prompt
- card_icon
- priority
- is_active
- created_at

## 4.3 Custom Agent Prompt Card Sync

When user selects their custom agent in chat:
1. Frontend detects agent_type = "custom"
2. Sends GET /api/users/me/agents/{agent_id}/prompt-cards
3. Backend fetches from user_agent_prompt_cards
4. Returns cards sorted by priority
5. Frontend displays cards (same UI as built-in agents)

---

# SECTION 5: FASTAPI BACKEND AGENT MANAGER

## 5.1 Agent Manager Architecture

The Agent Manager is the central coordinator with these components:

**Component 1: Agent Registry**
- Stores all agent definitions (built-in + custom)
- Provides agent lookup by ID
- Validates agent configurations
- Caches frequently accessed agents

**Component 2: Agent Router**
- Receives incoming chat messages
- Determines target agent
- Routes message to correct handler
- Manages conversation context

**Component 3: Model Adapter**
- Abstracts LLM provider differences
- Handles API key management
- Implements retry logic
- Streams responses

**Component 4: Memory Manager**
- Manages short-term (conversation) memory
- Manages long-term (user preference) memory
- Handles memory retrieval and storage
- Implements memory summarization

**Component 5: Artifact Generator**
- Creates PDF reports
- Creates Excel files
- Generates charts/images
- Stores artifacts in file storage

## 5.2 Message Routing Flow

```
User sends message
        ↓
WebSocket receives message
        ↓
Agent Router extracts:
  - user_id
  - conversation_id
  - agent_id
  - model_id
  - message_content
        ↓
Agent Router validates:
  - User has access to agent
  - User has access to model
  - Rate limit not exceeded
        ↓
Agent Router loads:
  - Agent configuration
  - Conversation history
  - User memory (if enabled)
  - Agent memory (if enabled)
        ↓
Context Builder creates prompt:
  - System prompt (from agent)
  - Memory context (if any)
  - Conversation history
  - Current message
  - Available tools
        ↓
Model Adapter sends to LLM:
  - Select correct provider
  - Apply model settings
  - Stream response
        ↓
Response Processor:
  - Parse response
  - Extract tool calls
  - Generate artifacts
  - Update memory
        ↓
WebSocket streams response to frontend
```

## 5.3 Inter-Agent Communication

When Agent A needs to call Agent B:

```
Agent A processing message
        ↓
Agent A decides to invoke Agent B
        ↓
Agent A sends internal request:
  {
    "source_agent": "technical_analysis",
    "target_agent": "risk_management",
    "context": "Market structure analysis complete",
    "request": "Calculate position size for this setup",
    "data": { ... analysis results ... }
  }
        ↓
Agent Router validates:
  - Source agent can call target agent
  - Target agent is available
        ↓
Agent B processes request
        ↓
Agent B returns response to Agent A
        ↓
Agent A incorporates response
        ↓
Agent A sends final response to user
```

**Inter-Agent Rules:**
- Maximum chain depth: 3 (A → B → C, no further)
- Timeout per agent: 30 seconds
- Total chain timeout: 90 seconds
- User sees "Consulting Risk Agent..." status
- All inter-agent calls logged for debugging


---

# SECTION 6: MULTI-MODEL SELECTION SYSTEM

## 6.1 Supported Models

**OpenAI Models:**
- GPT-4.1 (latest, most capable)
- GPT-4o (optimized, faster)
- GPT-4o-mini (cost-effective)
- GPT-5 (when available)

**Anthropic Models:**
- Claude 3.5 Sonnet (balanced)
- Claude 3 Opus (most capable)
- Claude 3 Haiku (fastest)

**Mistral Models:**
- Mistral Large (most capable)
- Mistral Medium (balanced)
- Mistral Small (fastest)

**Open Source Models:**
- Llama 3.1 70B (via API)
- Llama 3.1 8B (via API)

## 6.2 Model Selection UI

**Location:** Bottom of chat panel, left of input box

**Display:**
- Dropdown showing current model name
- Model icon (provider logo)
- Click to expand full list

**Dropdown Contents:**
- Models grouped by provider
- Each model shows: name, speed indicator, capability indicator
- Disabled models show "Unavailable" with reason
- User's default model highlighted

## 6.3 Model Selection Flow

```
User clicks model dropdown
        ↓
Frontend shows available models
        ↓
User selects new model
        ↓
Frontend sends: POST /api/chat/model
  { "conversation_id": "xxx", "model_id": "gpt-4.1" }
        ↓
Backend validates:
  - Model exists
  - User tier has access to model
  - API key configured for provider
        ↓
Backend updates conversation.current_model
        ↓
Frontend updates UI
        ↓
Next message uses new model
```

## 6.4 Model Access Control

**Free Tier Users:**
- GPT-4o-mini
- Claude 3 Haiku
- Mistral Small
- Llama 3.1 8B

**Pro Tier Users:**
- All Free tier models
- GPT-4o
- Claude 3.5 Sonnet
- Mistral Medium
- Llama 3.1 70B

**Enterprise Tier Users:**
- All models
- GPT-4.1 / GPT-5
- Claude 3 Opus
- Mistral Large
- Priority queue access

## 6.5 API Key Management (Admin)

Admin Panel → Settings → AI Models:

- Add/Edit API keys per provider
- Set default model per tier
- Enable/disable specific models
- Set rate limits per model
- View usage statistics
- Cost tracking per model

**Security:**
- API keys encrypted at rest
- Keys never sent to frontend
- Keys accessed only by backend
- Audit log for key access

---

# SECTION 7: PER-USER MEMORY SYSTEM

## 7.1 Memory Types

**Type 1: Conversation Memory (Short-term)**
- Stores current conversation context
- Cleared when conversation ends
- Maximum 50 messages retained
- Older messages summarized

**Type 2: User Preference Memory (Long-term)**
- Trading style (scalper, swing, position)
- Risk tolerance (conservative, moderate, aggressive)
- Preferred symbols (watchlist)
- Preferred indicators
- Preferred timeframes
- Language preference
- Past successful strategies

**Type 3: Interaction Memory (Long-term)**
- Key insights from past conversations
- User corrections and feedback
- Frequently asked questions
- Custom terminology user uses

## 7.2 Memory Storage

**Conversation Memory:**
- Stored in Redis (fast access)
- Key: conversation:{conversation_id}:messages
- TTL: 24 hours after last activity
- Backed up to PostgreSQL on conversation end

**User Preference Memory:**
- Stored in PostgreSQL (persistent)
- Table: user_memory_preferences
- Updated incrementally
- Versioned for rollback

**Interaction Memory:**
- Stored in Vector Database (Pinecone/Weaviate)
- Embedded using text-embedding-3-small
- Semantic search for retrieval
- Maximum 1000 memories per user

## 7.3 Memory Retrieval Flow

```
User sends message
        ↓
Memory Manager activates
        ↓
Step 1: Load conversation memory
  - Get last 20 messages from Redis
  - If > 20, include summary of older messages
        ↓
Step 2: Load user preferences
  - Query user_memory_preferences
  - Include: trading_style, risk_level, symbols, indicators
        ↓
Step 3: Semantic search interaction memory
  - Embed current message
  - Search vector DB for relevant past interactions
  - Return top 5 relevant memories
        ↓
Context Builder combines:
  - System prompt
  - User preferences (as context)
  - Relevant memories (as context)
  - Conversation history
  - Current message
        ↓
Send to LLM
```

## 7.4 Memory Update Flow

```
LLM generates response
        ↓
Memory Analyzer checks response for:
  - New user preferences mentioned
  - Corrections to previous understanding
  - Important insights to remember
        ↓
If preferences detected:
  - Update user_memory_preferences
  - Example: "I prefer 15-minute charts" → timeframe_preference = "15m"
        ↓
If important insight:
  - Create embedding
  - Store in vector DB
  - Tag with: agent_id, topic, timestamp
        ↓
Update conversation memory:
  - Append user message
  - Append assistant response
  - If > 50 messages, summarize oldest 10
```

## 7.5 Memory UI Controls

**In Chat Settings (gear icon):**
- Toggle: "Enable Memory" (on/off)
- Button: "Clear Conversation Memory"
- Button: "View My Preferences"
- Button: "Reset All Memory"

**In User Profile:**
- View all stored preferences
- Edit preferences manually
- Export memory data
- Delete specific memories


---

# SECTION 8: PER-AGENT MEMORY SYSTEM

## 8.1 Agent Memory Concept

Each agent maintains its own memory context separate from user memory:

**Agent Short-term Memory:**
- Current analysis state
- Intermediate calculations
- Data fetched in this session
- Pending actions

**Agent Long-term Memory (per user):**
- Past analyses for this user
- User's interaction patterns with this agent
- Successful recommendations
- User feedback on agent responses

## 8.2 Agent Memory Storage

**Table: agent_user_memory**
- id (primary key)
- agent_id
- user_id
- memory_type (analysis, feedback, pattern)
- memory_content (JSON)
- relevance_score (0.0 - 1.0)
- created_at
- last_accessed
- access_count

## 8.3 Agent Memory Examples

**Forex Agent Memory for User X:**
```
{
  "preferred_pairs": ["EUR/USD", "GBP/JPY"],
  "analysis_history": [
    { "date": "2025-12-10", "pair": "EUR/USD", "direction": "bullish", "outcome": "correct" },
    { "date": "2025-12-11", "pair": "GBP/JPY", "direction": "bearish", "outcome": "correct" }
  ],
  "user_feedback": [
    { "date": "2025-12-10", "feedback": "Great analysis, very detailed" }
  ],
  "interaction_patterns": {
    "prefers_detailed_analysis": true,
    "asks_about_fundamentals": true,
    "typical_timeframe": "4h"
  }
}
```

**Technical Analysis Agent Memory for User X:**
```
{
  "favorite_indicators": ["RSI", "MACD", "EMA"],
  "chart_preferences": {
    "timeframe": "1h",
    "style": "candlestick"
  },
  "past_pattern_requests": ["head_and_shoulders", "double_bottom"],
  "accuracy_tracking": {
    "patterns_identified": 15,
    "patterns_confirmed": 12,
    "accuracy": 0.80
  }
}
```

## 8.4 Agent Memory Retrieval

When agent processes a message:

```
Agent receives message
        ↓
Load agent memory for this user:
  SELECT * FROM agent_user_memory
  WHERE agent_id = X AND user_id = Y
  ORDER BY relevance_score DESC, last_accessed DESC
  LIMIT 10
        ↓
Include in agent context:
  "You have previously analyzed EUR/USD for this user.
   They prefer detailed analysis with fundamentals.
   Your last 5 analyses had 80% accuracy."
        ↓
Agent uses this context for personalized response
```

---

# SECTION 9: ARTIFACT GENERATION SYSTEM (Claude-Style)

## 9.1 Artifact Types

**Document Artifacts:**
- PDF Reports (strategy, analysis, backtest)
- Word Documents (research notes)
- Markdown Files (documentation)

**Data Artifacts:**
- Excel Spreadsheets (data tables, calculations)
- CSV Files (raw data export)
- JSON Files (structured data)

**Visual Artifacts:**
- Charts (candlestick, line, bar)
- Tables (formatted data display)
- Diagrams (flowcharts, decision trees)

**Code Artifacts:**
- Pine Script (TradingView indicators)
- Python Scripts (analysis tools)
- JSON Configs (strategy parameters)

## 9.2 Artifact Generation Flow

```
Agent generates response
        ↓
Response Analyzer detects artifact triggers:
  - "Here's a detailed report..."
  - "I've created a spreadsheet..."
  - "Here's the Pine Script code..."
  - Explicit tool call: generate_artifact()
        ↓
Artifact Generator activates:
  - Determine artifact type
  - Gather required data
  - Apply template (if applicable)
  - Generate artifact content
        ↓
Artifact Storage:
  - Generate unique artifact_id
  - Store file in object storage (S3/local)
  - Create database record
        ↓
Artifact Response:
  - Include artifact reference in response
  - Send artifact metadata to frontend
        ↓
Frontend displays:
  - Artifact card in right sidebar
  - Preview (if supported)
  - Download button
```

## 9.3 Artifact Database Schema

**Table: artifacts**
- id (UUID, primary key)
- user_id (foreign key)
- conversation_id (foreign key)
- agent_id
- artifact_type (pdf, excel, chart, code, etc.)
- artifact_name
- artifact_description
- file_path (storage location)
- file_size_bytes
- mime_type
- metadata (JSON - additional info)
- is_pinned (boolean)
- created_at
- expires_at (optional, for temp artifacts)

## 9.4 Artifact Templates

**PDF Report Template:**
- Header: Logo, Report Title, Date, Agent Name
- Executive Summary Section
- Detailed Analysis Section
- Charts/Graphs Section
- Recommendations Section
- Disclaimer Footer

**Excel Analysis Template:**
- Sheet 1: Summary Dashboard
- Sheet 2: Raw Data
- Sheet 3: Calculations
- Sheet 4: Charts
- Formatted headers, conditional formatting

**Pine Script Template:**
- Version declaration (v6)
- Input parameters section
- Indicator calculation section
- Plot section
- Alert conditions section
- Comments throughout

## 9.5 Artifact UI (Right Sidebar)

**Artifact Card Display:**
- Artifact icon (based on type)
- Artifact name
- Creation timestamp
- File size
- Preview button (for supported types)
- Download button
- Pin/Unpin button
- Delete button

**Artifact Preview:**
- PDF: Embedded PDF viewer
- Excel: Table preview (first 100 rows)
- Chart: Image display
- Code: Syntax-highlighted code block

**Artifact Actions:**
- Download: Direct file download
- Share: Generate shareable link (optional)
- Pin: Keep in sidebar across conversations
- Delete: Remove artifact


---

# SECTION 10: REAL-TIME MARKET DATA → AGENT → ARTIFACT CHAIN

## 10.1 Data Sources Integration

**Angel One Integration:**
- WebSocket connection for live quotes
- REST API for historical data
- Order book data
- Portfolio data
- Supported: NSE, BSE, MCX

**Forex Data Integration:**
- Real-time forex quotes (via provider API)
- Economic calendar events
- Currency strength data
- Supported: Major, Minor, Exotic pairs

**Crypto Data Integration:**
- Real-time crypto prices
- On-chain metrics (optional)
- Exchange order books
- Supported: BTC, ETH, major altcoins

**Options Data Integration:**
- Options chain data
- Greeks calculations
- IV data
- OI analysis

**News & Sentiment Integration:**
- Financial news feeds
- Social media sentiment
- Earnings announcements
- Economic indicators

## 10.2 Data Flow Architecture

```
External Data Sources
        ↓
Data Ingestion Service (FastAPI Background Tasks)
        ↓
Data Normalization Layer
  - Convert to standard format
  - Add timestamps
  - Validate data quality
        ↓
Redis Cache (hot data)
  - Latest quotes
  - Recent candles
  - Active alerts
        ↓
PostgreSQL (historical data)
  - OHLCV history
  - Trade history
  - Event logs
        ↓
Agent Data Access Layer
  - Agents query via internal API
  - Rate limited per agent
  - Cached responses
```

## 10.3 Agent Data Request Flow

```
User asks: "Analyze NIFTY current setup"
        ↓
Technical Analysis Agent activates
        ↓
Agent requests data:
  1. GET /internal/data/quotes/NIFTY
  2. GET /internal/data/candles/NIFTY?tf=1h&count=100
  3. GET /internal/data/indicators/NIFTY?indicators=RSI,MACD,EMA
        ↓
Data Layer responds with:
  - Current price: 24,500
  - Last 100 hourly candles
  - Calculated indicators
        ↓
Agent processes data:
  - Identifies patterns
  - Calculates levels
  - Generates analysis
        ↓
Agent creates artifact:
  - PDF report with charts
  - Key levels table
  - Trade setup recommendation
        ↓
Response sent to user with artifact
```

## 10.4 Real-Time Alert Flow

```
User sets alert: "Alert me when NIFTY crosses 24,600"
        ↓
Alert stored in database:
  - user_id
  - symbol: NIFTY
  - condition: price > 24600
  - agent_id: technical_analysis
        ↓
Alert Monitor Service (background)
  - Subscribes to NIFTY price updates
  - Checks condition on each tick
        ↓
Condition triggered (price = 24,601)
        ↓
Alert Service:
  1. Fetches current market context
  2. Invokes Technical Analysis Agent
  3. Agent generates quick analysis
        ↓
Notification sent:
  - WebSocket push to frontend
  - Optional: Email/SMS
  - Includes: Alert message + Agent analysis
        ↓
Frontend shows:
  - Toast notification
  - New message in chat
  - Optional artifact (quick chart)
```

## 10.5 Live Trading Signal Flow

```
Strategy Agent monitoring market
        ↓
Signal condition detected:
  - EMA crossover on EUR/USD
  - RSI confirmation
  - Volume spike
        ↓
Agent generates signal:
  {
    "type": "BUY",
    "symbol": "EUR/USD",
    "entry": 1.0850,
    "stop_loss": 1.0820,
    "take_profit": 1.0910,
    "risk_reward": 2.0,
    "confidence": 0.75,
    "reasoning": "Bullish EMA crossover with RSI confirmation..."
  }
        ↓
Signal Processor:
  1. Validates signal parameters
  2. Checks user's risk settings
  3. Calculates position size
        ↓
User Notification:
  - Real-time push via WebSocket
  - Signal card in chat
  - Artifact: Signal report PDF
        ↓
User Action Required:
  - "Execute Trade" button (if auto-trade enabled)
  - Confirmation dialog
  - Trade executed only after explicit confirmation
```

---

# SECTION 11: ERROR HANDLING ARCHITECTURE

## 11.1 Error Categories

**Category 1: LLM Errors**
- API timeout
- Rate limit exceeded
- Invalid response format
- Content filter triggered
- Model unavailable

**Category 2: Data Errors**
- Data source unavailable
- Stale data detected
- Invalid symbol
- Market closed

**Category 3: User Errors**
- Invalid input
- Unauthorized action
- Quota exceeded
- Session expired

**Category 4: System Errors**
- Database connection failed
- Redis unavailable
- File storage error
- Memory limit exceeded

## 11.2 Error Handling Flow

```
Error occurs
        ↓
Error Classifier determines category
        ↓
Category-specific handler:

LLM Error:
  - Retry with exponential backoff (3 attempts)
  - If persistent, try fallback model
  - If all fail, return friendly error message

Data Error:
  - Check cache for recent data
  - If available, use with "data may be delayed" warning
  - If unavailable, inform user and suggest retry

User Error:
  - Return specific error message
  - Suggest correction
  - Log for analytics

System Error:
  - Log detailed error
  - Alert admin (if critical)
  - Return generic error to user
  - Attempt recovery
```

## 11.3 Retry Logic

**LLM Retry Strategy:**
- Attempt 1: Immediate retry
- Attempt 2: Wait 2 seconds, retry
- Attempt 3: Wait 5 seconds, retry with fallback model
- Attempt 4: Return error to user

**Data Retry Strategy:**
- Attempt 1: Immediate retry
- Attempt 2: Wait 1 second, retry
- Attempt 3: Use cached data if available
- Attempt 4: Return error with explanation

## 11.4 User-Facing Error Messages

**Friendly Error Templates:**

- LLM Timeout: "I'm taking longer than usual to think. Please wait a moment or try again."
- Rate Limit: "I'm handling many requests right now. Please try again in a few seconds."
- Data Unavailable: "I couldn't fetch the latest market data. Using recent data instead."
- Invalid Symbol: "I couldn't find that symbol. Did you mean [suggestion]?"
- System Error: "Something went wrong on my end. Our team has been notified."

## 11.5 Error Logging

**Log Structure:**
```
{
  "timestamp": "2025-12-12T10:30:00Z",
  "error_id": "err_abc123",
  "category": "llm_error",
  "error_type": "timeout",
  "user_id": "user_xyz",
  "agent_id": "forex_expert",
  "model_id": "gpt-4.1",
  "request_summary": "Analyze EUR/USD...",
  "error_message": "Request timed out after 30s",
  "retry_count": 3,
  "resolution": "fallback_model_used",
  "stack_trace": "..."
}
```

**Log Storage:**
- Real-time: Redis stream
- Persistent: PostgreSQL
- Analytics: Aggregated daily


---

# SECTION 12: SECURITY & MULTI-USER ISOLATION

## 12.1 Authentication & Authorization

**Authentication Flow:**
- JWT-based authentication
- Access token (15 min expiry)
- Refresh token (7 day expiry)
- Token stored in httpOnly cookie + localStorage backup

**Authorization Levels:**
- Guest: No access to chat
- Free User: Basic agents, limited models
- Pro User: All agents, more models, higher limits
- Enterprise: Full access, custom agents, priority
- Admin: Full system access

## 12.2 Data Isolation Rules

**Rule 1: Conversation Isolation**
- Every database query includes user_id filter
- Conversations table has user_id foreign key
- Index on (user_id, conversation_id) for fast lookup
- No cross-user conversation access possible

**Rule 2: Agent Isolation**
- Built-in agents: Shared, read-only
- Custom agents: user_id filtered
- Agent memory: Isolated per user
- No user can access another's custom agents

**Rule 3: Artifact Isolation**
- Artifacts stored with user_id
- File paths include user_id hash
- Signed URLs for artifact access (expire in 1 hour)
- No direct file path exposure

**Rule 4: Memory Isolation**
- User preferences: user_id filtered
- Conversation memory: conversation_id scoped
- Vector embeddings: user_id metadata filter
- No cross-user memory leakage

## 12.3 API Security

**Request Validation:**
- All requests require valid JWT
- Request body validation via Pydantic
- SQL injection prevention via ORM
- XSS prevention via output encoding

**Rate Limiting:**
- Per-user rate limits
- Per-endpoint rate limits
- Sliding window algorithm
- Redis-based tracking

**Rate Limits by Tier:**
```
Free User:
  - 50 messages/hour
  - 10 artifacts/day
  - 5 custom agents

Pro User:
  - 500 messages/hour
  - 100 artifacts/day
  - 20 custom agents

Enterprise:
  - 5000 messages/hour
  - Unlimited artifacts
  - Unlimited custom agents
```

## 12.4 Data Encryption

**At Rest:**
- Database: AES-256 encryption
- File storage: Server-side encryption
- API keys: Encrypted with master key
- Sensitive fields: Column-level encryption

**In Transit:**
- HTTPS only (TLS 1.3)
- WebSocket over WSS
- Certificate pinning (mobile apps)

## 12.5 Audit Logging

**Logged Events:**
- User login/logout
- Conversation created/deleted
- Agent created/modified/deleted
- Artifact created/downloaded/deleted
- Model changed
- Settings modified
- Admin actions

**Audit Log Schema:**
```
{
  "event_id": "evt_abc123",
  "timestamp": "2025-12-12T10:30:00Z",
  "user_id": "user_xyz",
  "event_type": "conversation_created",
  "resource_type": "conversation",
  "resource_id": "conv_123",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "details": { ... }
}
```

## 12.6 Trade Safety Layer

**Safety Rules:**
- No automatic trade execution without explicit confirmation
- Confirmation dialog shows: Symbol, Direction, Size, Risk
- User must click "Confirm Trade" button
- 5-second countdown before execution (cancelable)
- All trade intents logged before execution

**Trade Confirmation Flow:**
```
Agent suggests trade
        ↓
Frontend shows confirmation modal:
  "Execute BUY 0.1 lot EUR/USD @ 1.0850?
   Stop Loss: 1.0820
   Take Profit: 1.0910
   Risk: $30 (2% of account)
   
   [Cancel] [Confirm in 5...4...3...2...1]"
        ↓
User clicks Confirm
        ↓
Backend validates:
  - User has trading enabled
  - Account has sufficient margin
  - Risk within user's limits
        ↓
Trade executed
        ↓
Confirmation shown to user
```

---

# SECTION 13: ADMIN PANEL SPECIFICATIONS

## 13.1 Admin Dashboard Sections

**Section 1: User Management**
- View all users
- Search/filter users
- Edit user tier
- Suspend/activate users
- View user activity

**Section 2: Agent Management**
- View all built-in agents
- Edit agent configurations
- Add/remove agent prompt cards
- Enable/disable agents
- View agent usage stats

**Section 3: Model Management**
- Configure API keys per provider
- Enable/disable models
- Set model access by tier
- View model usage/costs
- Set rate limits

**Section 4: Prompt Card Management**
- Manage global prompt cards
- Manage agent-specific cards
- Preview cards
- A/B test cards (optional)

**Section 5: Analytics**
- User engagement metrics
- Agent usage breakdown
- Model usage breakdown
- Error rates
- Cost tracking

**Section 6: System Settings**
- Rate limit configuration
- Memory settings
- Artifact storage settings
- Security settings

## 13.2 Admin Prompt Card Editor

**Card Editor Interface:**
- Card title input
- Card description input
- Full prompt textarea
- Icon selector
- Category dropdown
- Agent selector (or "Global")
- Priority slider (1-100)
- Active toggle
- Preview button
- Save/Cancel buttons

**Bulk Operations:**
- Import cards from CSV
- Export cards to CSV
- Bulk enable/disable
- Bulk delete


---

# SECTION 14: DATABASE SCHEMA SUMMARY

## 14.1 Core Tables

**users**
- id, email, password_hash, name, tier, is_active, created_at, updated_at

**conversations**
- id, user_id, title, agent_id, model_id, is_pinned, created_at, updated_at

**messages**
- id, conversation_id, role (user/assistant/system), content, metadata, created_at

**agents** (built-in)
- id, name, description, system_prompt, category, config, is_active

**user_custom_agents**
- id, user_id, name, description, system_prompt, config, is_active, created_at

## 14.2 Prompt Card Tables

**global_prompt_cards**
- id, title, description, full_prompt, icon, category, priority, is_active

**agent_prompt_cards**
- id, agent_id, title, description, full_prompt, icon, priority, is_active

**user_prompt_cards**
- id, user_id, agent_id, title, description, full_prompt, icon, priority, is_active

## 14.3 Memory Tables

**user_memory_preferences**
- id, user_id, preference_key, preference_value, updated_at

**agent_user_memory**
- id, agent_id, user_id, memory_type, memory_content, relevance_score, created_at

**conversation_memory** (Redis primarily, PostgreSQL backup)
- conversation_id, messages_json, summary, updated_at

## 14.4 Artifact Tables

**artifacts**
- id, user_id, conversation_id, agent_id, type, name, description, file_path, metadata, created_at

## 14.5 System Tables

**model_configs**
- id, provider, model_name, api_key_encrypted, is_active, tier_access, rate_limit

**audit_logs**
- id, user_id, event_type, resource_type, resource_id, details, ip_address, created_at

**alerts**
- id, user_id, symbol, condition, agent_id, is_active, triggered_at, created_at

---

# SECTION 15: API ENDPOINTS SUMMARY

## 15.1 Chat Endpoints

```
POST   /api/chat/conversations          Create new conversation
GET    /api/chat/conversations          List user's conversations
GET    /api/chat/conversations/{id}     Get conversation with messages
DELETE /api/chat/conversations/{id}     Delete conversation
PATCH  /api/chat/conversations/{id}     Update conversation (rename, pin)

POST   /api/chat/messages               Send message (returns stream)
GET    /api/chat/messages/{conv_id}     Get messages for conversation

POST   /api/chat/model                  Change model for conversation
```

## 15.2 Agent Endpoints

```
GET    /api/agents                      List all available agents
GET    /api/agents/{id}                 Get agent details
GET    /api/agents/{id}/prompt-cards    Get prompt cards for agent

POST   /api/users/me/agents             Create custom agent
GET    /api/users/me/agents             List user's custom agents
PATCH  /api/users/me/agents/{id}        Update custom agent
DELETE /api/users/me/agents/{id}        Delete custom agent

POST   /api/users/me/agents/{id}/cards  Add prompt card to custom agent
PATCH  /api/users/me/agents/{id}/cards/{card_id}  Update card
DELETE /api/users/me/agents/{id}/cards/{card_id}  Delete card
```

## 15.3 Artifact Endpoints

```
GET    /api/artifacts                   List user's artifacts
GET    /api/artifacts/{id}              Get artifact metadata
GET    /api/artifacts/{id}/download     Download artifact file
DELETE /api/artifacts/{id}              Delete artifact
PATCH  /api/artifacts/{id}              Update artifact (pin/rename)
```

## 15.4 Memory Endpoints

```
GET    /api/users/me/memory             Get user's memory preferences
PATCH  /api/users/me/memory             Update memory preferences
DELETE /api/users/me/memory             Clear all memory
DELETE /api/users/me/memory/conversation/{id}  Clear conversation memory
```

## 15.5 Admin Endpoints

```
GET    /api/admin/users                 List all users
PATCH  /api/admin/users/{id}            Update user (tier, status)

GET    /api/admin/agents                List all agents
PATCH  /api/admin/agents/{id}           Update agent config

GET    /api/admin/prompt-cards          List all prompt cards
POST   /api/admin/prompt-cards          Create prompt card
PATCH  /api/admin/prompt-cards/{id}     Update prompt card
DELETE /api/admin/prompt-cards/{id}     Delete prompt card

GET    /api/admin/models                List model configs
PATCH  /api/admin/models/{id}           Update model config

GET    /api/admin/analytics             Get system analytics
```

## 15.6 WebSocket Endpoints

```
WS     /ws/chat/{conversation_id}       Real-time chat streaming
WS     /ws/alerts                       Real-time alert notifications
WS     /ws/market/{symbol}              Real-time market data (optional)
```

---

# SECTION 16: DEVELOPMENT ROADMAP

## Phase 1: Foundation (Week 1-2)

**Week 1:**
- Set up database schema (all tables)
- Create base API structure
- Implement authentication updates (if needed)
- Create Agent model and registry

**Week 2:**
- Implement conversation CRUD
- Implement message storage
- Create WebSocket infrastructure
- Basic chat flow (no agents yet)

## Phase 2: Agent System (Week 3-4)

**Week 3:**
- Implement Agent Manager
- Create all 9 built-in agents
- Implement agent routing
- Add system prompts for each agent

**Week 4:**
- Implement prompt card system
- Create default cards for each agent
- Add prompt card API endpoints
- Test agent switching with cards

## Phase 3: Multi-Model (Week 5)

**Week 5:**
- Implement Model Adapter
- Add OpenAI integration
- Add Claude integration
- Add Mistral integration
- Add Llama integration
- Implement model switching
- Add admin model management

## Phase 4: Memory System (Week 6-7)

**Week 6:**
- Implement conversation memory
- Implement user preference memory
- Add memory retrieval to context

**Week 7:**
- Implement vector database integration
- Add semantic memory search
- Implement agent-specific memory
- Add memory UI controls

## Phase 5: Artifacts (Week 8-9)

**Week 8:**
- Implement artifact storage
- Create PDF generator
- Create Excel generator
- Add artifact API endpoints

**Week 9:**
- Implement artifact UI (right sidebar)
- Add artifact preview
- Add artifact download
- Test all artifact types

## Phase 6: Frontend UI (Week 10-12)

**Week 10:**
- Update chat UI layout (three panels)
- Implement resizable sidebars
- Add agent selector dropdown
- Add model picker

**Week 11:**
- Implement prompt cards UI
- Add card animations
- Implement card click behavior
- Add "More cards" overflow

**Week 12:**
- Implement artifact panel
- Add streaming response display
- Polish animations
- Responsive design fixes

## Phase 7: Custom Agents (Week 13-14)

**Week 13:**
- Create custom agent builder UI
- Implement custom agent storage
- Add custom agent prompt cards

**Week 14:**
- Test custom agent flow
- Add custom agent to chat dropdown
- Implement agent sharing (optional)

## Phase 8: Real-Time Data (Week 15-16)

**Week 15:**
- Integrate market data feeds
- Implement data caching
- Add data access layer for agents

**Week 16:**
- Implement alert system
- Add real-time notifications
- Test data → agent → artifact flow

## Phase 9: Admin Panel (Week 17-18)

**Week 17:**
- Create admin dashboard
- Add user management
- Add agent management

**Week 18:**
- Add prompt card management
- Add model management
- Add analytics dashboard

## Phase 10: Testing & Polish (Week 19-20)

**Week 19:**
- End-to-end testing
- Performance optimization
- Security audit
- Bug fixes

**Week 20:**
- Documentation
- User guide
- Admin guide
- Deployment preparation

---

# SECTION 17: TECHNOLOGY STACK SUMMARY

## Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- React Query (data fetching)
- Recharts (charts)
- PDF.js (PDF preview)
- SheetJS (Excel preview)

## Backend
- FastAPI
- Python 3.11+
- SQLAlchemy (ORM)
- Pydantic (validation)
- WebSockets (real-time)
- Celery (background tasks)

## Database
- PostgreSQL (primary)
- Redis (cache, sessions, real-time)
- Pinecone/Weaviate (vector DB)

## AI/ML
- OpenAI API
- Anthropic API
- Mistral API
- Together AI (Llama)
- LangChain (optional, for complex chains)

## Storage
- AWS S3 / Local filesystem (artifacts)

## Deployment
- Docker
- Docker Compose
- Nginx (reverse proxy)
- SSL/TLS certificates

---

# END OF SPECIFICATION

This document provides the complete technical specification for implementing a Claude-style AI Chat Interface with Multi-Agent System for your trading SaaS application. Follow the development roadmap sequentially for best results.

Document prepared for: Trading Maven SaaS
Version: 1.0
Date: December 2025
