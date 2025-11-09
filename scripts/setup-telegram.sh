#!/bin/bash

# DarkWave Telegram Bot Setup Script
# This script sets up the Telegram webhook for the bot

echo "🤖 DarkWave Telegram Bot Setup"
echo "================================"
echo ""

# Check if token exists
if [ -z "$TELEGRAM_BOT_TOKEN" ] && [ -z "$TELEGRAM_TOKEN_NEW" ]; then
  echo "❌ ERROR: No Telegram bot token found"
  echo ""
  echo "Please set one of these environment variables:"
  echo "  - TELEGRAM_BOT_TOKEN"
  echo "  - TELEGRAM_TOKEN_NEW"
  echo ""
  exit 1
fi

TOKEN="${TELEGRAM_TOKEN_NEW:-$TELEGRAM_BOT_TOKEN}"
echo "✅ Bot token found: ${TOKEN:0:10}...${TOKEN: -5}"
echo ""

# Get the webhook URL
if [ -n "$REPL_SLUG" ] && [ -n "$REPL_OWNER" ]; then
  WEBHOOK_URL="https://${REPL_SLUG}.${REPL_OWNER}.repl.co/api/webhooks/telegram"
else
  echo "⚠️  Cannot detect Replit URL. Using placeholder..."
  WEBHOOK_URL="https://YOUR-REPL-URL.repl.co/api/webhooks/telegram"
fi

echo "📍 Webhook URL: $WEBHOOK_URL"
echo ""

# Check current webhook
echo "🔍 Checking current webhook status..."
CURRENT=$(curl -s "https://api.telegram.org/bot${TOKEN}/getWebhookInfo")
echo "$CURRENT" | jq . 2>/dev/null || echo "$CURRENT"
echo ""

# Set webhook
echo "🔧 Setting webhook..."
RESULT=$(curl -s -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\"}")

echo "$RESULT" | jq . 2>/dev/null || echo "$RESULT"
echo ""

# Verify
echo "✅ Verifying webhook..."
curl -s "https://api.telegram.org/bot${TOKEN}/getWebhookInfo" | jq . 2>/dev/null
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "Test your bot by sending a message in Telegram:"
echo "  • /start"
echo "  • help"  
echo "  • BTC"
echo "  • scan"
echo ""
echo "If the bot doesn't respond, check:"
echo "  1. The 'Start application' workflow is running"
echo "  2. The webhook URL is correct (check REPL_SLUG)"
echo "  3. The bot token is correct"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
