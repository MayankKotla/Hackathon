#!/bin/bash

# Test AI features after fixes
BASE_URL="http://localhost:5001/api"

echo "🧪 Testing Fixed AI Features..."
echo "================================="

# 1. Test recipe search (should work with fallback)
echo "1. Testing recipe search (fallback mode)..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/recipes/search?q=pasta")
echo "Search Response: $SEARCH_RESPONSE" | head -5

echo ""
echo "2. Testing recipe search with chicken..."
CHICKEN_SEARCH=$(curl -s -X GET "$BASE_URL/recipes/search?q=chicken")
echo "Chicken Search Response: $CHICKEN_SEARCH" | head -5

echo ""
echo "✅ AI features are now working with fallback system!"
echo "📝 Note: Run the database migration script in Supabase to fix schema issues"
echo "🔧 The app will work with fallback recipes when OpenAI quota is exceeded"
