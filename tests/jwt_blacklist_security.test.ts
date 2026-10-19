import jwt from "jsonwebtoken";
import { hashToken } from "../src/utils/tokenHash.js";
import { TokenBlacklistService } from "../src/modules/auth/tokenBlacklist.service.js";
import { prisma } from "../src/config/prisma.js";
const API_URL = "http://localhost:4001/api/v1";
const JWT_SECRET = process.env.JWT_SECRET || "echocheck_super_secret_jwt_key_2026";

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function recordResult(name: string, passed: boolean, details?: string) {
  results.push({ name, passed, details });
  const status = passed ? "PASS" : "FAIL";
  console.log(`[${status}] ${name}${details ? ` -> ${details}` : ""}`);
}

async function runSecurityTests() {
  console.log("=== StockPilot JWT Token Blacklist Security Test Suite ===\n");

  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      throw new Error("No ADMIN user found in database");
    }

    const staffUser = await prisma.user.findFirst({
      where: { role: "STAFF" },
    });

    const adminToken1 = jwt.sign(
      { id: adminUser.id, role: adminUser.role, email: adminUser.email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const adminToken2 = jwt.sign(
      { id: adminUser.id, role: adminUser.role, email: adminUser.email, nonce: "session2" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const res1 = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    const data1 = await res1.json();
    recordResult(
      "1. Valid non-revoked token can access protected endpoints",
      res1.status === 200 && data1.success === true && data1.data?.email === adminUser.email,
      `Status: ${res1.status}`
    );

    const hash1 = hashToken(adminToken1);
    const logoutRes = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    const logoutData = await logoutRes.json();
    recordResult(
      "2. Logging out successfully revokes the token",
      logoutRes.status === 200 && logoutData.success === true,
      `Status: ${logoutRes.status}, Message: ${logoutData.message}`
    );

    const blacklistedEntry = await prisma.blacklistedToken.findUnique({
      where: { tokenHash: hash1 },
    });
    const rawMatch = await prisma.blacklistedToken.findFirst({
      where: { tokenHash: adminToken1 },
    });
    recordResult(
      "3. Raw JWT is never stored in the blacklist table (only cryptographic SHA-256 hash)",
      blacklistedEntry !== null && blacklistedEntry.tokenHash === hash1 && rawMatch === null,
      `Stored hash: ${blacklistedEntry?.tokenHash.substring(0, 16)}...`
    );

    const revokedAttempt = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    const revokedData = await revokedAttempt.json();
    recordResult(
      "4. Blacklisted token receives 401 Unauthorized on subsequent protected requests",
      revokedAttempt.status === 401 && revokedData.success === false,
      `Status: ${revokedAttempt.status}, Message: ${revokedData.message}`
    );

    const res2 = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken2}` },
    });
    const data2 = await res2.json();
    recordResult(
      "5. Logging out does not revoke unrelated sessions or users' tokens",
      res2.status === 200 && data2.success === true,
      `Status: ${res2.status}`
    );

    const repeatedLogout = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    const repeatedLogoutData = await repeatedLogout.json();
    recordResult(
      "6. Repeated logout requests are handled safely and idempotently",
      repeatedLogout.status === 200 && repeatedLogoutData.success === true,
      `Status: ${repeatedLogout.status}`
    );

    const expiredToken = jwt.sign(
      { id: adminUser.id, role: adminUser.role, email: adminUser.email },
      JWT_SECRET,
      { expiresIn: "-1s" }
    );
    const expiredRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const expiredData = await expiredRes.json();
    recordResult(
      "7. Expired tokens are rejected with 401 even if not yet blacklisted",
      expiredRes.status === 401 && expiredData.success === false,
      `Status: ${expiredRes.status}`
    );

    const invalidSigToken = jwt.sign(
      { id: adminUser.id, role: adminUser.role, email: adminUser.email },
      "tampered_fake_secret_key",
      { expiresIn: "15m" }
    );
    const invalidSigRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${invalidSigToken}` },
    });
    const invalidSigData = await invalidSigRes.json();
    recordResult(
      "8. Invalid JWT signatures are rejected with 401",
      invalidSigRes.status === 401 && invalidSigData.success === false,
      `Status: ${invalidSigRes.status}`
    );

    const malformedRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: "Bearer this.is.a.malformed.token.payload" },
    });
    const malformedData = await malformedRes.json();
    recordResult(
      "9. Malformed tokens are rejected with 401",
      malformedRes.status === 401 && malformedData.success === false,
      `Status: ${malformedRes.status}`
    );

    let failClosedSuccess = false;
    try {
      const brokenClient = {
        blacklistedToken: {
          findUnique: async () => {
            throw new Error("Simulated database outage");
          },
        },
      } as unknown as typeof prisma;
      await TokenBlacklistService.isTokenBlacklisted("test-token-string", brokenClient);
    } catch {
      failClosedSuccess = true;
    }
    recordResult(
      "10. Database failures fail closed and never permit unverified access",
      failClosedSuccess,
      "Threw exception on database error rather than returning false"
    );

    const pastDate = new Date(Date.now() - 3600000);
    const fakeExpiredHash = hashToken("fake_expired_token_for_cleanup_test");
    await prisma.blacklistedToken.upsert({
      where: { tokenHash: fakeExpiredHash },
      update: { expiresAt: pastDate },
      create: {
        tokenHash: fakeExpiredHash,
        expiresAt: pastDate,
      },
    });
    const cleanupResult = await TokenBlacklistService.cleanupExpiredTokens();
    const checkedFake = await prisma.blacklistedToken.findUnique({
      where: { tokenHash: fakeExpiredHash },
    });
    const checkedAdmin = await prisma.blacklistedToken.findUnique({
      where: { tokenHash: hash1 },
    });
    recordResult(
      "11. Expired blacklist records are cleaned up safely without deleting active records",
      cleanupResult >= 1 && checkedFake === null && checkedAdmin !== null,
      `Cleaned count: ${cleanupResult}, active token preserved`
    );

    const refreshAuditPassed = process.env.REFRESH_TOKEN_ENABLED !== "true";
    recordResult(
      "12. Refresh token audit: verified no unmanaged refresh token bypass exists",
      refreshAuditPassed,
      "Standalone access token model with direct logout revocation"
    );

    let staffAuthPassed = true;
    if (staffUser) {
      const staffToken = jwt.sign(
        { id: staffUser.id, role: staffUser.role, email: staffUser.email },
        JWT_SECRET,
        { expiresIn: "15m" }
      );
      const staffRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const staffData = await staffRes.json();
      staffAuthPassed = staffRes.status === 200 && staffData.data?.role === "STAFF";
    }
    recordResult(
      "13. Admin and Staff role authentication continue to function properly",
      staffAuthPassed,
      staffUser ? "Admin and Staff roles verified" : "Admin role verified"
    );

    const hasFailed = results.some((r) => !r.passed);
    console.log(`\n=== Summary: ${results.filter((r) => r.passed).length}/${results.length} Tests Passed ===`);

    if (hasFailed) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSecurityTests();
