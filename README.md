# TFocus AI Orchestrator & Multimodal Vision RAG

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org)
[![Anthropic Claude](https://img.shields.io/badge/LLM-Claude%203.5%20Sonnet%20Vision-blue.svg)](https://anthropic.com)
[![PostgreSQL pgvector](https://img.shields.io/badge/Vector%20DB-pgvector%20HNSW-indigo.svg)](https://github.com/pgvector/pgvector)

Vertical AI orchestrator for photography studio operations:
- Zero-Shot Multimodal Vision RAG: Decomposing reference customer photography into 5 structured Bill Of Materials (BOM) layers.
- Physical Inventory Reconciliation: Matching against 241 props and 163 garments using Grounding DINO + DINOv2 768-dim embeddings.
- 22-State Finite State Machine: Enforcing strict financial safety guardrails (AUTO, ASSIST, HUMAN).

Production Architecture:
Client Reference -> ChatbotX -> TFocus Orchestrator -> Claude 3.5 Sonnet Vision & Grounding DINO 1.5 -> pgvector HNSW -> Deterministic pricing.mjs -> FSM (22 States).

Portal & Live Inspector: https://tfocus.com.vn/ai-research and https://tfocus.com.vn/open-source
