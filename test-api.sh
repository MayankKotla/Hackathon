#!/bin/bash

# FlavorCraft API Test Script
# Run this after completing the database migration

echo "🧪 Testing FlavorCraft API Endpoints..."
echo "========================================"

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s http://localhost:5001/api/health | jq .
echo ""

# Test 2: User Registration
echo "2. Testing User Registration..."
curl -s -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User 2","email":"test2@example.com","password":"password123"}' | jq .
echo ""

# Test 3: User Login
echo "3. Testing User Login..."
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"password123"}' | jq -r '.token')
echo "Token: $TOKEN"
echo ""

# Test 4: Add Pantry Item (Protein)
echo "4. Testing Add Pantry Item (Protein)..."
curl -s -X POST http://localhost:5001/api/pantry/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Chicken Breast","quantity":"2","unit":"pieces","category":"protein"}' | jq .
echo ""

# Test 5: Add Pantry Item (Grains)
echo "5. Testing Add Pantry Item (Grains)..."
curl -s -X POST http://localhost:5001/api/pantry/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Rice","quantity":"1","unit":"cup","category":"grains"}' | jq .
echo ""

# Test 6: Add Pantry Item (Dairy)
echo "6. Testing Add Pantry Item (Dairy)..."
curl -s -X POST http://localhost:5001/api/pantry/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Milk","quantity":"1","unit":"liter","category":"dairy"}' | jq .
echo ""

# Test 7: Get Pantry Items
echo "7. Testing Get Pantry Items..."
curl -s -X GET http://localhost:5001/api/pantry \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test 8: Get User Profile
echo "8. Testing Get User Profile..."
curl -s -X GET http://localhost:5001/api/users/profile \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test 9: Get Recipes
echo "9. Testing Get Recipes..."
curl -s -X GET http://localhost:5001/api/recipes | jq .
echo ""

echo "✅ API Testing Complete!"
echo "Check the results above to see if all endpoints are working."
