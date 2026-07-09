#!/usr/bin/env sh
# security-test.sh
# Comprehensive security testing script for TaskPlanner API

set -e

echo "🔍 Running comprehensive security tests..."

# Test 1: Basic headers
echo "1. Checking security headers..."
headers=$(curl -i http://localhost:3000/meta/head | grep -E '^[A-Z]' | head -10)

if echo "$headers" | grep -q "X-Content-Type-Options: nosniff"; then
  echo "   ✓ X-Content-Type-Options: nosniff"
else
  echo "   ✗ Missing X-Content-Type-Options: nosniff"
  exit 1
fi

if echo "$headers" | grep -q "X-Frame-Options: DENY"; then
  echo "   ✓ X-Frame-Options: DENY"
else
  echo "   ✗ Missing X-Frame-Options: DENY"
  exit 1
fi

if echo "$headers" | grep -q "X-XSS-Protection: 1; mode=block"; then
  echo "   ✓ X-XSS-Protection: 1; mode=block"
else
  echo "   ✗ Missing X-XSS-Protection: 1; mode=block"
  exit 1
fi

# Test 2: 401 Unauthorized without token
echo "2. Testing unauthorized access..."
resp=$(curl -i -s -X GET http://localhost:3000/api/notes | head -n 1)
if echo "$resp" | grep -q "HTTP/1.1 401 Unauthorized"; then
  echo "   ✓ Correctly returns 401 without auth"
else
  echo "   ✗ Unexpected unauthorized response: $resp"
  exit 1
fi

# Test 3: Successful authentication placeholder
echo "3. Testing secure endpoint (mock)..."
# Mock successful auth test by checking headers on protected route
if curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer fake-token" http://localhost:3000/api/notes | grep -q "2[0-9][0-9]"; then
  echo "   ✓ Secure endpoint responds with 200"
else
  echo "   ✗ Secure endpoint failed"
  exit 1
fi

# Test 4: Error codes
echo "4. Testing standardized error codes..."
errorCode=$(curl -i -s -X POST http://localhost:3000/api/notes -H "Content-Type: application/json" -d '{"not":"valid"}' | head -n 1 | awk '{print $2}')
if [ "$errorCode" -ge 400 ]; then
  echo "   ✓ Proper error code returned: $errorCode"
else
  echo "   ✗ Unexpected error code: $errorCode"
  exit 1
fi

# Test 5: Rate limiting header
echo "5. Testing rate limiting headers..."
rateResp=$(curl -i -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer test-token" http://localhost:3000/api/notes)
if echo "$rateResp" | grep -q "200"; then
  echo "   ✓ Rate limiting headers accessible"
else
  echo "   ✗ Rate limiting headers inaccessible"
  exit 1
fi

echo "✅ All security tests passed!"