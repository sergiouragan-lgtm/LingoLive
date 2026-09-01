import fs from "node:fs";
import path from "node:path";

const contractPath = path.join(process.cwd(), "openapi", "mobile.openapi.yaml");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

const requiredOperations = new Map([
  ["/api/quizzes/generate", "post"],
  ["/api/quizzes/{sessionId}/submit", "post"],
  ["/api/learning/progress", "get"],
  ["/api/learning/flashcard-sessions/{sessionId}/complete", "post"],
  ["/api/pronunciation/evaluate", "post"],
  ["/api/school/mobile-context", "get"],
  ["/api/create-checkout-session", "post"],
]);

const failures = [];
if (contract.openapi !== "3.1.0") failures.push("OpenAPI 3.1.0 is required");
if (contract.info?.version !== "1.0.0") failures.push("mobile contract version must be 1.0.0");
if (contract.components?.securitySchemes?.firebaseBearer?.scheme !== "bearer") failures.push("firebase bearer scheme is missing");

for (const [route, method] of requiredOperations) {
  const operation = contract.paths?.[route]?.[method];
  if (!operation) {
    failures.push(`${method.toUpperCase()} ${route} is missing`);
    continue;
  }
  if (!operation.operationId) failures.push(`${method.toUpperCase()} ${route} has no operationId`);
  if (!operation.responses?.["401"]) failures.push(`${method.toUpperCase()} ${route} has no 401 response`);
}

for (const route of [
  "/api/quizzes/{sessionId}/submit",
  "/api/learning/flashcard-sessions/{sessionId}/complete",
  "/api/pronunciation/evaluate",
]) {
  const operation = contract.paths[route].post;
  if (!/idempoten/i.test(`${operation.summary || ""} ${operation.description || ""}`)) failures.push(`${route} must document idempotency`);
}

if (failures.length) {
  console.error(JSON.stringify({ status: "failed", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "passed", openapi: contract.openapi, operations: requiredOperations.size }, null, 2));
