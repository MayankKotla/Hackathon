#!/bin/bash

# Simple FlavorCraft API Test (without jq)
echo "🧪 Testing FlavorCraft API..."
echo "============================="

# Test 1: Health Check
echo "1. Health Check:"
curl -s http://localhost:5001/api/health
echo -e "\n"

# Test 2: User Registration
echo "2. User Registration:"
curl -s -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User 3","email":"test3@example.com","password":"password123"}'
echo -e "\n"

# Test 3: User Login
echo "3. User Login:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test3@example.com","password":"password123"}')
echo "$LOGIN_RESPONSE"

# Extract token (simple method)
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"
echo ""

# Test 4: Add Pantry Item (Protein)
echo "4. Add Pantry Item (Protein):"
curl -s -X POST http://localhost:5001/api/pantry/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Chicken Breast","quantity":"2","unit":"pieces","category":"protein"}'
echo -e "\n"

# Test 5: Add Pantry Item (Grains)
echo "5. Add Pantry Item (Grains):"
curl -s -X POST http://localhost:5001/api/pantry/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Rice","quantity":"1","unit":"cup","category":"grains"}'
echo -e "\n"

# Test 6: Get Pantry Items
echo "6. Get Pantry Items:"
curl -s -X GET http://localhost:5001/api/pantry \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# Test 7: Get User Profile
echo "7. Get User Profile:"
curl -s -X GET http://localhost:5001/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "✅ Testing Complete!"
echo "If you see JSON responses above, the API is working!"
echo "If you see 'Server error', run the database migration first."
