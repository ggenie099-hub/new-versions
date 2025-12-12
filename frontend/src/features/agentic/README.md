# Agentic Trading System Interface (Frontend)

This module provides a canvas-based workflow builder for trading strategies with:

- Collapsible dark sidebar (300px default) with sections for Market Watch, Indicators, Strategy Templates, and Account Management.
- Node-based canvas with drag-and-drop and D3 SVG connections.
- Core node types: Market Data, Indicator, Order Execution, Risk Management, AI.
- Node configuration panel with validation and live preview placeholder.
- Multi-canvas support via tabs.
- Real-time data harness using existing `wsManager` (WebSocket), with REST fallback guidance.
- IndexedDB persistence stubs for workflows.

## Getting Started

- Navigate to `/dashboard/agentic`.
- Drag nodes from the top palette onto the canvas.
- Hold `Shift` and click a source node, then click a target node to create a connection.
- Click a node to configure it in the right panel.

## Future Work

- Integrate TFJS/Pyodide models in `ai` nodes.
- Backtesting engine (walk-forward, Monte Carlo) and metrics.
- Exchange adapters (REST/WebSocket) and unified order management.
- Sentry integration and comprehensive logging.
- Collaborative editing and version control.