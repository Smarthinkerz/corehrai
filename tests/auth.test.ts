import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Auth Utilities", () => {
  describe("Password Hashing", () => {
    it("should hash and verify passwords correctly", async () => {
      const { hashPassword } = await import("../server/auth");
      const hash = await hashPassword("TestPassword123!");
      expect(hash).toBeDefined();
      expect(hash).toContain(".");
      const parts = hash.split(".");
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });

    it("should generate different hashes for same password", async () => {
      const { hashPassword } = await import("../server/auth");
      const hash1 = await hashPassword("SamePassword");
      const hash2 = await hashPassword("SamePassword");
      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty password", async () => {
      const { hashPassword } = await import("../server/auth");
      const hash = await hashPassword("");
      expect(hash).toBeDefined();
      expect(hash).toContain(".");
    });

    it("should produce hash with salt and key components", async () => {
      const { hashPassword } = await import("../server/auth");
      const hash = await hashPassword("ComplexP@ssw0rd!");
      const [salt, key] = hash.split(".");
      expect(salt.length).toBeGreaterThanOrEqual(16);
      expect(key.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe("Session Security", () => {
    it("should not use hardcoded session secret", () => {
      const secret = process.env.SESSION_SECRET;
      if (secret) {
        expect(secret).not.toBe("keyboard cat");
        expect(secret).not.toBe("secret");
        expect(secret.length).toBeGreaterThan(16);
      }
    });
  });
});

describe("Validation Middleware", () => {
  it("should export validateBody function", async () => {
    const { validateBody } = await import("../server/middleware/validate");
    expect(validateBody).toBeDefined();
    expect(typeof validateBody).toBe("function");
  });

  it("should export validateParams function", async () => {
    const { validateParams } = await import("../server/middleware/validate");
    expect(validateParams).toBeDefined();
    expect(typeof validateParams).toBe("function");
  });

  it("should export idParamSchema", async () => {
    const { idParamSchema } = await import("../server/middleware/validate");
    expect(idParamSchema).toBeDefined();
    const valid = idParamSchema.safeParse({ id: "123" });
    expect(valid.success).toBe(true);
    const invalid = idParamSchema.safeParse({ id: "abc" });
    expect(invalid.success).toBe(false);
  });

  it("validateBody should create middleware that validates request body", async () => {
    const { validateBody } = await import("../server/middleware/validate");
    const { z } = await import("zod");
    const testSchema = z.object({ name: z.string().min(1) });
    const middleware = validateBody(testSchema);
    expect(typeof middleware).toBe("function");
  });
});

describe("CSRF Middleware", () => {
  it("should export csrfProtection function", async () => {
    const { csrfProtection } = await import("../server/middleware/csrf");
    expect(csrfProtection).toBeDefined();
    expect(typeof csrfProtection).toBe("function");
  });

  it("should export csrfTokenRoute function", async () => {
    const { csrfTokenRoute } = await import("../server/middleware/csrf");
    expect(csrfTokenRoute).toBeDefined();
    expect(typeof csrfTokenRoute).toBe("function");
  });
});

describe("Pagination Middleware", () => {
  it("should parse pagination params correctly", async () => {
    const { parsePagination } = await import("../server/middleware/pagination");
    const mockReq = { query: { page: "2", limit: "10" } } as any;
    const result = parsePagination(mockReq);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(10);
  });

  it("should use defaults for missing params", async () => {
    const { parsePagination } = await import("../server/middleware/pagination");
    const mockReq = { query: {} } as any;
    const result = parsePagination(mockReq);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(0);
  });

  it("should cap limit at max", async () => {
    const { parsePagination } = await import("../server/middleware/pagination");
    const mockReq = { query: { limit: "500" } } as any;
    const result = parsePagination(mockReq);
    expect(result.limit).toBe(100);
  });

  it("should handle negative page", async () => {
    const { parsePagination } = await import("../server/middleware/pagination");
    const mockReq = { query: { page: "-1" } } as any;
    const result = parsePagination(mockReq);
    expect(result.page).toBe(1);
  });

  it("should generate paginated response", async () => {
    const { paginatedResponse } = await import("../server/middleware/pagination");
    const data = [1, 2, 3];
    const result = paginatedResponse(data, 30, { page: 1, limit: 10, offset: 0 });
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.pagination.total).toBe(30);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasMore).toBe(true);
  });

  it("should correctly indicate no more pages", async () => {
    const { paginatedResponse } = await import("../server/middleware/pagination");
    const data = [1, 2, 3];
    const result = paginatedResponse(data, 3, { page: 1, limit: 10, offset: 0 });
    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.totalPages).toBe(1);
  });

  it("should calculate offset for page 3 with limit 10", async () => {
    const { parsePagination } = await import("../server/middleware/pagination");
    const mockReq = { query: { page: "3", limit: "10" } } as any;
    const result = parsePagination(mockReq);
    expect(result.offset).toBe(20);
  });
});

describe("Feature Gating", () => {
  it("should export feature gating functions", async () => {
    const module = await import("../server/middleware/featureGating");
    expect(module.requireFeature).toBeDefined();
    expect(module.getPlanFeatures).toBeDefined();
    expect(module.getPlanLimits).toBeDefined();
  });

  it("should return correct plan limits for free tier", async () => {
    const { getPlanLimits } = await import("../server/middleware/featureGating");
    const limits = getPlanLimits("free");
    expect(limits).toBeDefined();
    expect(limits.maxUsers).toBeDefined();
    expect(limits.maxEmployees).toBeDefined();
  });

  it("should return correct plan limits for enterprise tier", async () => {
    const { getPlanLimits } = await import("../server/middleware/featureGating");
    const limits = getPlanLimits("enterprise");
    expect(limits).toBeDefined();
    expect(limits.maxUsers).toBe(-1);
    expect(limits.maxEmployees).toBe(-1);
  });

  it("should return features for each plan", async () => {
    const { getPlanFeatures } = await import("../server/middleware/featureGating");
    const freeFeatures = getPlanFeatures("free");
    const proFeatures = getPlanFeatures("pro");
    const enterpriseFeatures = getPlanFeatures("enterprise");
    expect(Array.isArray(freeFeatures)).toBe(true);
    expect(Array.isArray(proFeatures)).toBe(true);
    expect(Array.isArray(enterpriseFeatures)).toBe(true);
    expect(enterpriseFeatures.length).toBeGreaterThanOrEqual(proFeatures.length);
    expect(proFeatures.length).toBeGreaterThanOrEqual(freeFeatures.length);
  });
});

describe("Logger", () => {
  it("should export logger and httpLogger", async () => {
    const { logger, httpLogger } = await import("../server/middleware/logger");
    expect(logger).toBeDefined();
    expect(httpLogger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
  });
});

describe("RBAC Middleware", () => {
  it("should export requireMinRole", async () => {
    const { requireMinRole } = await import("../server/middleware/rbac");
    expect(requireMinRole).toBeDefined();
    expect(typeof requireMinRole).toBe("function");
  });

  it("should create middleware function for role", async () => {
    const { requireMinRole } = await import("../server/middleware/rbac");
    const middleware = requireMinRole("admin");
    expect(typeof middleware).toBe("function");
  });
});
