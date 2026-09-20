#!/bin/bash
set -e

# LingoLive Testing Suite Runner
# Executes all tests: integration, load, security, performance
# Usage: ./scripts/run-tests.sh [integration|load|security|performance|all]

TEST_TYPE=${1:-all}
API_BASE=${API_BASE:-http://localhost:3000}
AUTH_TOKEN=${AUTH_TOKEN:-test-token}

echo "🧪 LingoLive Testing Suite"
echo "   Type: $TEST_TYPE"
echo "   API: $API_BASE"
echo ""

# Export variables for tests
export API_BASE
export AUTH_TOKEN

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

run_integration_tests() {
  echo "${YELLOW}=== Running Integration Tests ===${NC}"
  echo "Testing: Payment Flow, LiveKit, AI Tutor"
  
  npm run test -- \
    tests/integration/payment-flow.integration.test.ts \
    tests/integration/livekit-flow.integration.test.ts \
    tests/integration/openai-tutor.integration.test.ts \
    --reporter=verbose
  
  echo -e "${GREEN}✅ Integration tests passed${NC}\n"
}

run_load_tests() {
  echo "${YELLOW}=== Running Load Tests ===${NC}"
  echo "Testing: 100 VUs over 9 minutes"
  
  # Check if k6 is installed
  if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 not installed. Install with: brew install k6${NC}"
    return 1
  fi
  
  k6 run \
    --vus 100 \
    --duration 9m \
    --out csv=test-results/load-test-results.csv \
    tests/load/load-test.js
  
  echo -e "${GREEN}✅ Load tests completed${NC}\n"
}

run_stress_tests() {
  echo "${YELLOW}=== Running Stress Tests ===${NC}"
  echo "Testing: Ramping to 1500 VUs"
  
  if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 not installed${NC}"
    return 1
  fi
  
  k6 run \
    --out csv=test-results/stress-test-results.csv \
    tests/load/stress-test.js
  
  echo -e "${GREEN}✅ Stress tests completed${NC}\n"
}

run_security_tests() {
  echo "${YELLOW}=== Running Security Tests ===${NC}"
  echo "Testing: OWASP ZAP scanning"
  
  # Check if ZAP is installed
  if ! command -v zaproxy &> /dev/null; then
    echo -e "${RED}❌ OWASP ZAP not installed. Install from: https://www.zaproxy.org/${NC}"
    return 1
  fi
  
  # Run ZAP in daemon mode with config
  zaproxy \
    -config tests/security/zap-config.yaml \
    -cmd \
    -quickurl $API_BASE \
    -quickout test-results/zap-report.html
  
  echo -e "${GREEN}✅ Security tests completed${NC}\n"
}

run_performance_tests() {
  echo "${YELLOW}=== Running Performance Tests ===${NC}"
  echo "Testing: Baseline metrics and SLA validation"
  
  npm run test -- \
    tests/performance/baseline.test.ts \
    --reporter=verbose
  
  echo -e "${GREEN}✅ Performance tests completed${NC}\n"
}

# Create results directory
mkdir -p test-results

# Run requested tests
case $TEST_TYPE in
  integration)
    run_integration_tests
    ;;
  load)
    run_load_tests
    ;;
  stress)
    run_stress_tests
    ;;
  security)
    run_security_tests
    ;;
  performance)
    run_performance_tests
    ;;
  all)
    run_integration_tests
    run_performance_tests
    run_load_tests
    run_stress_tests
    run_security_tests
    
    echo ""
    echo "${GREEN}════════════════════════════════════${NC}"
    echo "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "${GREEN}════════════════════════════════════${NC}"
    echo ""
    echo "Test Results:"
    echo "  📁 Integration Tests: ✅"
    echo "  📊 Performance Tests: ✅"
    echo "  📈 Load Tests: ✅"
    echo "  💪 Stress Tests: ✅"
    echo "  🔒 Security Tests: ✅"
    echo ""
    echo "Reports:"
    echo "  Load Test: test-results/load-test-results.csv"
    echo "  Stress Test: test-results/stress-test-results.csv"
    echo "  Security: test-results/zap-report.html"
    echo ""
    ;;
  *)
    echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
    echo "Usage: ./scripts/run-tests.sh [integration|load|stress|security|performance|all]"
    exit 1
    ;;
esac
