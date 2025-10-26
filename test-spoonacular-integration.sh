#!/bin/bash

# Test the new Spoonacular API integration for global cuisine recipes
BASE_URL="http://localhost:5001/api"

echo "🌍 Testing Spoonacular API Integration for Global Cuisine..."
echo "=========================================================="

echo ""
echo "📋 Setup Instructions:"
echo "1. Get your free Spoonacular API key from: https://spoonacular.com/food-api"
echo "2. Add SPOONACULAR_API_KEY=your_key_here to server/.env"
echo "3. Restart the server: npm run dev"
echo ""

# Test 1: Italian Cuisine
echo "1. Testing Italian Cuisine Search..."
echo "------------------------------------"
ITALIAN_RESPONSE=$(curl -s -X GET "$BASE_URL/recipes/search?q=pasta%20carbonara")
echo "Italian Recipe:"
echo "$ITALIAN_RESPONSE" | grep -E '"title"|"cuisine"|"source"' | head -n 3
echo ""

# Test 2: Indian Cuisine
echo "2. Testing Indian Cuisine Search..."
echo "-----------------------------------"
INDIAN_RESPONSE=$(curl -s -X GET "$BASE_URL/recipes/search?q=chicken%20curry")
echo "Indian Recipe:"
echo "$INDIAN_RESPONSE" | grep -E '"title"|"cuisine"|"source"' | head -n 3
echo ""

# Test 3: Thai Cuisine
echo "3. Testing Thai Cuisine Search..."
echo "---------------------------------"
THAI_RESPONSE=$(curl -s -X GET "$BASE_URL/recipes/search?q=pad%20thai")
echo "Thai Recipe:"
echo "$THAI_RESPONSE" | grep -E '"title"|"cuisine"|"source"' | head -n 3
echo ""

# Test 4: Mexican Cuisine
echo "4. Testing Mexican Cuisine Search..."
echo "------------------------------------"
MEXICAN_RESPONSE=$(curl -s -X GET "$BASE_URL/recipes/search?q=tacos")
echo "Mexican Recipe:"
echo "$MEXICAN_RESPONSE" | grep -E '"title"|"cuisine"|"source"' | head -n 3
echo ""

# Test 5: French Cuisine
echo "5. Testing French Cuisine Search..."
echo "-----------------------------------"
FRENCH_RESPONSE=$(curl -s -X GET "$BASE_URL/recipes/search?q=coq%20au%20vin")
echo "French Recipe:"
echo "$FRENCH_RESPONSE" | grep -E '"title"|"cuisine"|"source"' | head -n 3
echo ""

echo "✅ Expected Results:"
echo "• Recipes from Spoonacular API (source: 'Spoonacular')"
echo "• Authentic global cuisine recipes"
echo "• Detailed ingredients with specific names"
echo "• Professional cooking instructions"
echo "• Nutrition information"
echo "• Recipe images (if available)"
echo ""

echo "🔧 If you see fallback results instead:"
echo "• Check that SPOONACULAR_API_KEY is set in server/.env"
echo "• Verify the API key is valid"
echo "• Check server logs for API errors"
echo "• Ensure server is restarted after adding the key"
