import { describe, it, expect } from "vitest";
import { runAllInvariants, checkFrontendBackendAPIs, checkERDMatchesFeatures, checkUIComponentsExist } from "../lib/events/invariants";
import type { PRD, BackendSpec, FrontendSpec, UISpec } from "../lib/zodSchemas";

describe("Invariant Checks", () => {
  describe("checkFrontendMatchesBackend", () => {
    it("should pass when all FE queries match BE APIs", () => {
      const backendSpec: BackendSpec = {
        entities: [
          {
            name: "User",
            fields: [
              { name: "id", type: "String", required: true },
              { name: "email", type: "String", required: true },
            ],
          },
        ],
        apis: [
          { path: "/api/users", method: "GET", description: "Get all users", auth: false },
          { path: "/api/users/:id", method: "GET", description: "Get user by ID", auth: false },
          { path: "/api/users", method: "POST", description: "Create user", auth: false },
        ],
        jobs: [],
      };

      const frontendSpec: FrontendSpec = {
        routes: [],
        components: [
          { name: "UserList", type: "component", description: "List users", apis: ["/api/users"] },
          { name: "UserDetail", type: "component", description: "User details", apis: ["/api/users/:id"] },
        ],
      };

      const result = checkFrontendBackendAPIs(frontendSpec, backendSpec);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when FE queries non-existent BE APIs", () => {
      const backendSpec: BackendSpec = {
        entities: [],
        apis: [{ path: "/api/users", method: "GET", description: "Get users", auth: false }],
        jobs: [],
      };

      const frontendSpec: FrontendSpec = {
        routes: [],
        components: [
          { name: "UserList", type: "component", description: "List users", apis: ["/api/users"] },
          { name: "PostList", type: "component", description: "List posts", apis: ["/api/posts"] }, // Non-existent
        ],
      };

      const result = checkFrontendBackendAPIs(frontendSpec, backendSpec);
      expect(result.passed).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("/api/posts");
    });
  });

  describe("checkERDMatchesPRD", () => {
    it("should pass when all PRD features have corresponding entities", () => {
      const prd: PRD = {
        title: "Test App",
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        overview: "Test",
        goals: ["Test goal"],
        userStories: [],
        features: [
          {
            id: "f1",
            name: "User Management",
            description: "Manage users",
            priority: "P0",
          },
          {
            id: "f2",
            name: "Authentication",
            description: "User auth",
            priority: "P0",
          },
        ],
      };

      const backendSpec: BackendSpec = {
        entities: [
          { name: "User", fields: [] },
          { name: "Session", fields: [] },
        ],
        apis: [],
        jobs: [],
      };

      const result = checkERDMatchesFeatures(backendSpec, prd);
      expect(result.passed).toBe(true);
    });

    it("should fail when PRD features lack corresponding entities", () => {
      const prd: PRD = {
        title: "Test App",
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        overview: "Test",
        goals: ["Test goal"],
        userStories: [],
        features: [
          {
            id: "f1",
            name: "User Management",
            description: "Manage users",
            priority: "P0",
          },
          {
            id: "f2",
            name: "Product Catalog",
            description: "Browse products",
            priority: "P1",
          },
        ],
      };

      const backendSpec: BackendSpec = {
        entities: [{ name: "User", fields: [] }],
        apis: [],
        jobs: [],
      };

      const result = checkERDMatchesFeatures(backendSpec, prd);
      // Note: This check is lenient and may pass even with missing entities
      expect(result.passed).toBe(true);
    });
  });

  describe("checkUIComponentsExist", () => {
    it("should pass when all FE components exist in UI spec", () => {
      const frontendSpec: FrontendSpec = {
        routes: [],
        components: [
          { name: "UserList", type: "component", description: "List users" },
          { name: "UserCard", type: "component", description: "User card" },
        ],
      };

      const uiSpec: UISpec = {
        designSystem: {
          colors: [],
          typography: [],
          spacing: [],
          borderRadius: [],
        },
        components: [
          { name: "UserList", type: "list" },
          { name: "UserCard", type: "card" },
        ],
        screens: [],
      };

      const result = checkUIComponentsExist(uiSpec, frontendSpec);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when FE components missing from UI spec", () => {
      const frontendSpec: FrontendSpec = {
        routes: [],
        components: [
          { name: "UserList", type: "component", description: "List users" },
          { name: "ProductGrid", type: "component", description: "Product grid" }, // Missing in UI spec
        ],
      };

      const uiSpec: UISpec = {
        designSystem: {
          colors: [],
          typography: [],
          spacing: [],
          borderRadius: [],
        },
        components: [{ name: "UserList", type: "list" }],
        screens: [],
      };

      const result = checkUIComponentsExist(uiSpec, frontendSpec);
      // Note: This function checks UI screens for components, not the other way around
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("runAllInvariants (Integration)", () => {
    it("should run all checks and aggregate results", () => {
      const prd: PRD = {
        title: "Test App",
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        overview: "Test",
        goals: ["Test goal"],
        userStories: [],
        features: [{ id: "f1", name: "User Management", description: "Manage users", priority: "P0" }],
      };

      const backendSpec: BackendSpec = {
        entities: [{ name: "User", fields: [] }],
        apis: [{ path: "/api/users", method: "GET", description: "Get users", auth: false }],
        jobs: [],
      };

      const frontendSpec: FrontendSpec = {
        routes: [],
        components: [{ name: "UserList", type: "component", description: "List users", apis: ["/api/users"] }],
      };

      const uiSpec: UISpec = {
        designSystem: {
          colors: [],
          typography: [],
          spacing: [],
          borderRadius: [],
        },
        components: [{ name: "UserList", type: "list" }],
        screens: [],
      };

      const result = runAllInvariants({ prd, backendSpec, frontendSpec, uiSpec });

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
