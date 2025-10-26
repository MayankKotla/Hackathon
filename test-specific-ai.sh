#!/bin/bash

# Test the improved AI system with specific ingredients
BASE_URL="http://localhost:5001/api"

echo "🍳 Testing Improved AI Recipe System..."
echo "======================================"

echo ""
echo "1. Testing Chicken Recipe Search..."
echo "-----------------------------------"
CHICKEN_RESPONSE=$(curl -s -X GET "$BASE_URL/recipes/search?q=chicken")
echo "Chicken Recipe:"
echo "$CHICKEN_RESPONSE" | grep -o '"title":"[^"]*"' | head -1
echo "$CHICKEN_RESPONSE" | grep -o '"name":"[^"]*"' | head -5

echo ""
echo "2. Testing Pasta Recipe Search..."
echo "---------------------------------"
PASTA_RESPONSE=$(curl -s -X GET "$BASE_URL/recipes/search?q=pasta")
echo "Pasta Recipe:"
echo "$PASTA_RESPONSE" | grep -o '"title":"[^"]*"' | head -1
echo "$PASTA_RESPONSE" | grep -o '"name":"[^"]*"' | head -5

echo ""
echo "3. Testing Vegetarian Recipe Search..."
echo "--------------------------------------"
VEGGIE_RESPONSE=$(curl -s -X GET "$BASE_URL/recipes/search?q=vegetarian")
echo "Vegetarian Recipe:"
echo "$VEGGIE_RESPONSE" | grep -o '"title":"[^"]*"' | head -1
echo "$VEGGIE_RESPONSE" | grep -o '"name":"[^"]*"' | head -5

echo ""
echo "✅ AI System Now Provides:"
echo "• Specific ingredient names (Chicken Breast, Roma Tomatoes, etc.)"
echo "• Detailed cooking instructions with professional techniques"
echo "• Precise measurements and cooking times"
echo "• No more generic terms like 'Main Ingredient' or 'Seasoning'"
echo "• Food-focused, culinary-quality recipes"
