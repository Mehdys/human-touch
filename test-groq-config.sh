#!/bin/bash
# Quick test to verify Groq API integration is working

set -e

SUPABASE_URL="https://ejhqzvmlurlvkypmmjyl.supabase.co"
PROJECT_REF="ejhqzvmlurlvkypmmjyl"

echo "🔍 Testing Groq API Integration"
echo "================================"
echo ""

# Test 1: Check if secret is set
echo "1️⃣ Checking Supabase secrets..."
supabase secrets list --project-ref $PROJECT_REF | grep -q "GROQ_API_KEY" && \
  echo "✅ GROQ_API_KEY is set in Supabase" || \
  echo "❌ GROQ_API_KEY not found in Supabase"
echo ""

# Test 2: Check Edge Functions are deployed
echo "2️⃣ Checking deployed functions..."
echo "Checking suggest-slots..."
curl -s "$SUPABASE_URL/functions/v1/suggest-slots" \
  -H "Content-Type: application/json" \
  -d '{}' | grep -q "error" && \
  echo "✅ suggest-slots is deployed (returned error as expected without auth)" || \
  echo "⚠️ suggest-slots response unclear"

echo "Checking suggest-catchup..."
curl -s "$SUPABASE_URL/functions/v1/suggest-catchup" \
  -H "Content-Type: application/json" \
  -d '{}' | grep -q "error" && \
  echo "✅ suggest-catchup is deployed (returned error as expected without auth)" || \
  echo "⚠️ suggest-catchup response unclear"
echo ""

# Test 3: Check local .env file
echo "3️⃣ Checking local .env configuration..."
if grep -q "GROQ_API_KEY" .env; then
  echo "✅ GROQ_API_KEY found in local .env"
else
  echo "❌ GROQ_API_KEY not in local .env"
fi
echo ""

echo "================================"
echo "✅ Configuration check complete!"
echo ""
echo "Next steps:"
echo "  1. Open your app at http://localhost:8081/"
echo "  2. Click on a contact to plan a catchup"
echo "  3. Verify AI suggestions appear"
echo ""
echo "Or run the full test:"
echo "  ./test-api-direct.sh"
