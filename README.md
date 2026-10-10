# TFocus AI Orchestrator & Multimodal Vision Core

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org)
[![Anthropic Claude](https://img.shields.io/badge/Vision%20Engine-Claude%20Multimodal-blue.svg)](https://anthropic.com)
[![PostgreSQL pgvector](https://img.shields.io/badge/Vector%20DB-pgvector%20HNSW-indigo.svg)](https://github.com/pgvector/pgvector)

Vertical AI operating layer and orchestration engine designed specifically for creative photography studios. Built and validated at **TFocus Studio (Hue, Vietnam)**.

---

## Architecture Overview

```text
Client Reference Photo (Unstructured)
             │
             ▼
   Claude Multimodal Vision
   (Extracts 5-Layer BOM: Wardrobe, Props, Accessories, Florals, Lighting)
             │
             ▼
    Vector Similarity Match
   (Matches against physical studio inventory via pgvector HNSW)
             │
             ▼
  22-State Finite State Machine (`src/domain/state.mjs`)
  + Deterministic Pricing Engine (`src/modules/pricing.mjs`)
  [AUTO / ASSIST / HUMAN Governance — 0% Financial Hallucination]
             │
             ▼
  Studio Operator Confirmation -> Calendar Slot Hold -> Deposit Verification
```

---

## Core Capabilities

- **22 Discrete States:** Full customer journey lifecycle from lead discovery to final booking and shoot reminder (`src/domain/state.mjs`).
- **3 Operational Safety Modes:** `AUTO` (standard catalogs), `ASSIST` (AI decomposes references for human review), `HUMAN` (receipts, conflicts, disputes).
- **Deterministic Pricing Engine:** Complete mathematical isolation preventing LLMs from fabricating rates or inventory (`src/modules/pricing.mjs`).
- **Concept Catalog & Inventory Taxonomy:** Standardized props, garments, and styling sets (`data/concepts/catalog.json`).
- **30-Minute Slot Hold:** Conflict-free booking reservation protocol (`src/modules/booking.mjs`).
- **Human Escalation Guardrails:** Realtime detection of emotional distress, payment errors, and edge cases (`src/modules/handoff.mjs`).

---

## Quickstart

### Prerequisites
- Node.js >= 20.0.0

### Run Tests
```bash
npm test
```

Expected output:
```text
Running TFocus AI Lifecycle Unit Tests...
✓ 22 Discrete States Verified
✓ Deterministic Pricing & Safety Mode Verified: 970.000đ (ASSIST)
All tests passed successfully!
✔ tests/lifecycle.test.mjs
✔ hỏi giá chưa có concept phải hỏi thể loại, không quote
✔ birthday gửi gallery và concept code
✔ chọn concept lấy giá từ catalog và lưu quote
✔ external quote bị chặn khi còn unresolved
✔ payment evidence không tự verified và booking cần manual confirmation
✔ human signal chuyển conversation sang HUMAN
ℹ tests 7 | pass 7 | fail 0
```

### Start API Server
```bash
node src/api/server.mjs
```
Default API port: `http://127.0.0.1:4100`.

---

## Persistence & Production Profile

- Schema migration: `migrations/001_tfocus_core.sql`
- Durable store: PostgreSQL connection with fallback in-memory JSONL audit logs.
- Docker services: `docker-compose.yml` (API, worker, PostgreSQL, Redis).

---

## License

MIT License. See [LICENSE](LICENSE) for details.
