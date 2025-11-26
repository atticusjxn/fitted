-- Fitted Initial Schema Migration
-- Creates all tables required for production

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Merchants (Shopify stores using Fitted)
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT,
  scope TEXT,
  status VARCHAR(50) DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (types of installation services)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades (installers/tradies)
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  abn VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, suspended
  verified_status VARCHAR(50) DEFAULT 'unverified', -- unverified, pending, verified
  avatar_url TEXT,
  bio TEXT,
  stripe_customer_id VARCHAR(255),
  stripe_account_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade skills (what categories a trade can service)
CREATE TABLE trade_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  supported_complexities TEXT[], -- array of: simple, standard, complex, heavy
  min_team_size INTEGER DEFAULT 1,
  max_team_size INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trade_id, category_id)
);

-- Trade credentials (licenses, certifications)
CREATE TABLE trade_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  credential_type VARCHAR(100) NOT NULL,
  issuer VARCHAR(255),
  credential_id VARCHAR(255),
  expires_at DATE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service areas (postcodes a trade covers)
CREATE TABLE service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  postcode_start VARCHAR(10) NOT NULL,
  postcode_end VARCHAR(10) NOT NULL,
  surcharge_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade scheduling connections (calendar/booking integrations)
CREATE TABLE trade_scheduling_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- servicem8, calendly, manual
  booking_url TEXT,
  external_id VARCHAR(255),
  next_available_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trade_id)
);

-- ============================================
-- LEADS & MATCHING
-- ============================================

-- Leads (customer installation requests)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id),
  category_id UUID REFERENCES categories(id),
  shopify_order_id VARCHAR(255),
  shopify_customer_id VARCHAR(255),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  payload_json JSONB, -- full form submission data
  postcode VARCHAR(10),
  status VARCHAR(50) DEFAULT 'new', -- new, matched, scheduled, completed, cancelled
  source VARCHAR(50) DEFAULT 'checkout', -- checkout, manual, api
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match recommendations (trades suggested for a lead)
CREATE TABLE match_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  rationale JSONB,
  status VARCHAR(50) DEFAULT 'proposed', -- proposed, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers (assignment of trade to lead)
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assignee_type VARCHAR(50) NOT NULL, -- trade, team
  assignee_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'sent', -- sent, viewed, accepted, declined, expired
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead scheduling (booking status for matched leads)
CREATE TABLE lead_scheduling (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, link_sent, booked, completed, cancelled
  scheduling_url TEXT,
  scheduled_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT SETTINGS
-- ============================================

-- Product installation settings (per-product config)
CREATE TABLE product_installation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  product_gid VARCHAR(255) NOT NULL, -- Shopify product GID
  enabled BOOLEAN DEFAULT FALSE,
  override_category_id UUID REFERENCES categories(id),
  override_complexity VARCHAR(50), -- simple, standard, complex, heavy
  price_mode VARCHAR(50) DEFAULT 'fixed', -- fixed, percentage, quote
  price_cents INTEGER,
  source VARCHAR(50) DEFAULT 'auto', -- auto, merchant
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, product_gid)
);

-- Product classifications (AI-detected categories)
CREATE TABLE product_classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  product_gid VARCHAR(255) NOT NULL,
  detected_category_id UUID REFERENCES categories(id),
  detected_complexity VARCHAR(50),
  confidence DECIMAL(3,2),
  low_confidence BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, rejected
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, product_gid)
);

-- ============================================
-- BILLING & PAYMENTS
-- ============================================

-- Billing profiles (trade payment settings)
CREATE TABLE billing_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  default_payment_method_id VARCHAR(255),
  requires_auth BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trade_id)
);

-- Lead payments (payment records for leads)
CREATE TABLE lead_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  payment_intent_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, requires_action
  amount_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INSTALLER SIGNUPS (Landing page captures)
-- ============================================

CREATE TABLE installer_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  mobile VARCHAR(50),
  source VARCHAR(100) DEFAULT 'landing',
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, converted, rejected
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_leads_merchant_id ON leads(merchant_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_postcode ON leads(postcode);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_verified_status ON trades(verified_status);

CREATE INDEX idx_trade_skills_category ON trade_skills(category_id);
CREATE INDEX idx_trade_skills_trade ON trade_skills(trade_id);

CREATE INDEX idx_service_areas_trade ON service_areas(trade_id);
CREATE INDEX idx_service_areas_postcode ON service_areas(postcode_start, postcode_end);

CREATE INDEX idx_match_recommendations_lead ON match_recommendations(lead_id);
CREATE INDEX idx_match_recommendations_trade ON match_recommendations(trade_id);

CREATE INDEX idx_offers_lead ON offers(lead_id);
CREATE INDEX idx_offers_assignee ON offers(assignee_id);

CREATE INDEX idx_product_settings_merchant ON product_installation_settings(merchant_id);
CREATE INDEX idx_product_classifications_merchant ON product_classifications(merchant_id);

CREATE INDEX idx_installer_signups_status ON installer_signups(status);

-- ============================================
-- SEED DATA: Default categories
-- ============================================

INSERT INTO categories (id, name, slug, description) VALUES
  (uuid_generate_v4(), 'Lighting', 'lighting', 'Pendant lights, chandeliers, and light fixtures'),
  (uuid_generate_v4(), 'Ceiling Fans', 'ceiling-fans', 'Ceiling fan installation and replacement'),
  (uuid_generate_v4(), 'TV Mounting', 'tv-mounting', 'Wall-mounted TV installation'),
  (uuid_generate_v4(), 'Blinds & Curtains', 'blinds-curtains', 'Window treatment installation'),
  (uuid_generate_v4(), 'Mirrors', 'mirrors', 'Mirror hanging and installation'),
  (uuid_generate_v4(), 'Shelving', 'shelving', 'Shelf and storage installation'),
  (uuid_generate_v4(), 'Air Conditioning', 'air-conditioning', 'Split system and AC installation'),
  (uuid_generate_v4(), 'Plumbing Fixtures', 'plumbing-fixtures', 'Tap, sink, and fixture installation');
