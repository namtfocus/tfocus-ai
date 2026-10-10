CREATE TABLE IF NOT EXISTS tfocus_conversations (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  state TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'ASSIST',
  category_id TEXT,
  concept_code TEXT,
  quote_id TEXT,
  booking_hold_id TEXT,
  booking_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tfocus_quotes (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES tfocus_conversations(id),
  quote_type TEXT NOT NULL,
  concept_code TEXT,
  base_price BIGINT NOT NULL DEFAULT 0,
  add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
  promotions JSONB NOT NULL DEFAULT '[]'::jsonb,
  discount BIGINT NOT NULL DEFAULT 0,
  final_price BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tfocus_booking_holds (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES tfocus_conversations(id),
  customer_id TEXT,
  quote_id TEXT,
  slot TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'HELD',
  expires_at TIMESTAMPTZ NOT NULL,
  payment JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tfocus_active_slot_unique
  ON tfocus_booking_holds(slot) WHERE status = 'HELD';

CREATE TABLE IF NOT EXISTS tfocus_bookings (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  hold_id TEXT NOT NULL REFERENCES tfocus_booking_holds(id),
  customer JSONB NOT NULL,
  concept JSONB NOT NULL,
  slot TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'BOOKED',
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tfocus_audit_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  conversation_id TEXT,
  entity_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tfocus_audit_conversation_idx ON tfocus_audit_events(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tfocus_holds_expiry_idx ON tfocus_booking_holds(status, expires_at);
