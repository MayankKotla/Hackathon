#!/bin/bash

echo "🤖 Testing FlavorCraft AI Integration..."
echo "========================================"

# Test AI Recipe Generation
echo "1. Testing AI Recipe Generation:"
curl -X POST http://localhost:5001/api/recipes/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc2MTQyNzk4NywiZXhwIjoxNzYyMDMyNzg3fQ.tWtkmnhL47VLIJVvtnLz2DEX5Z-jmpmZw_sUHkVAQfE" \
  -d '{
    "pantryItems": [
      {"name": "chicken breast", "quantity": "2", "unit": "pieces", "category": "protein"},
      {"name": "rice", "quantity": "1", "unit": "cup", "category": "grains"},
      {"name": "onions", "quantity": "1", "unit": "medium", "category": "produce"}
    ],
    "preferences": {
      "dietary": "none",
      "cuisine": "any"
    }
  }' | head -20

echo -e "\n\n2. Testing AI Recipe Search:"
curl "http://localhost:5001/api/recipes/search?q=pasta&pantry=%5B%7B%22name%22%3A%22chicken%22%2C%22quantity%22%3A%221%22%7D%5D" | head -20

echo -e "\n\n✅ AI Integration Test Complete!"
echo "If you see recipe data above, AI integration is working!"
echo "If you see errors, check your OpenAI API key in server/.env"
