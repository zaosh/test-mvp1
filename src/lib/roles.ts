export type Role = "ADMIN" | "QA" | "ENGINEER" | "MANAGER";

export const PERMISSIONS = {
  DASHBOARD_ACCESS: ["ADMIN", "QA", "MANAGER"] as Role[],
  MANAGE_TEST_CASES: ["ADMIN", "QA"] as Role[],
  MANAGE_TEST_PLANS: ["ADMIN", "QA"] as Role[],
  CREATE_TEST_RUNS: ["ADMIN", "QA", "ENGINEER"] as Role[],
  MANAGE_ISSUES: ["ADMIN", "QA", "ENGINEER"] as Role[],
  CREATE_ARCHIVES: ["ADMIN", "QA"] as Role[],
  CONCLUDE_TESTS: ["ADMIN", "QA"] as Role[],
} as const;

export function hasPermission(userRole: Role, permission: Role[]): boolean {
  return permission.includes(userRole);
}

export function canAccessDashboard(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.DASHBOARD_ACCESS);
}

export function canManageTestCases(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.MANAGE_TEST_CASES);
}

export function canManageTestPlans(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.MANAGE_TEST_PLANS);
}

export function canCreateTestRuns(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CREATE_TEST_RUNS);
}

export function canManageIssues(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.MANAGE_ISSUES);
}

export function canCreateArchives(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CREATE_ARCHIVES);
}

export function canConcludeTests(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CONCLUDE_TESTS);
}
