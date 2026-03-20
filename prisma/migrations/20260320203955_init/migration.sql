-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'QA', 'ENGINEER', 'MANAGER');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('SOFTWARE', 'FIRMWARE', 'HARDWARE', 'DRONE_UNIT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('FUNCTIONAL', 'REGRESSION', 'FLIGHT', 'COMPLIANCE', 'MAINTENANCE', 'EXPERIMENTAL');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'CONCLUDED', 'WAIVED');

-- CreateEnum
CREATE TYPE "RunEnvironment" AS ENUM ('LAB', 'FIELD', 'SIMULATION', 'BENCH');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX', 'DEFERRED');

-- CreateEnum
CREATE TYPE "ArchiveCategory" AS ENUM ('RELEASE_CERTIFICATION', 'REGRESSION_SUITE', 'COMPLIANCE_AUDIT', 'FIELD_INVESTIGATION', 'MAINTENANCE_CYCLE', 'EXPERIMENTAL');

-- CreateEnum
CREATE TYPE "ArchiveOutcome" AS ENUM ('PASSED', 'FAILED', 'CONDITIONAL_PASS', 'INCONCLUSIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ENGINEER',
    "avatarInitials" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ComponentType" NOT NULL,
    "version" TEXT,
    "serialNumber" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "milestone" TEXT,
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "concludedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "parameters" JSONB NOT NULL,
    "passCriteria" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "frequency" TEXT,
    "nextDueDate" TIMESTAMP(3),
    "forkDepth" INTEGER NOT NULL DEFAULT 0,
    "forkReason" TEXT,
    "isCanonical" BOOLEAN NOT NULL DEFAULT false,
    "concludedAt" TIMESTAMP(3),
    "concludedNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,
    "ownerId" TEXT NOT NULL,
    "concludedById" TEXT,
    "componentId" TEXT,
    "testPlanId" TEXT,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "environment" "RunEnvironment" NOT NULL,
    "status" "TestStatus" NOT NULL,
    "notes" TEXT,
    "measuredValues" JSONB,
    "attachments" TEXT[],
    "flightData" JSONB,
    "weatherData" JSONB,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testCaseId" TEXT NOT NULL,
    "componentId" TEXT,
    "loggedById" TEXT NOT NULL,

    CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "deferredTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "testRunId" TEXT,
    "componentId" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubRef" (
    "id" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "commitSha" TEXT,
    "prNumber" INTEGER,
    "releaseTag" TEXT,
    "branchName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testCaseId" TEXT,
    "testPlanId" TEXT,

    CONSTRAINT "GitHubRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archive" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ArchiveCategory" NOT NULL,
    "outcome" "ArchiveOutcome" NOT NULL,
    "summary" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "githubRef" TEXT,
    "releaseTag" TEXT,
    "attachments" TEXT[],
    "tags" TEXT[],
    "searchIndex" TEXT NOT NULL,
    "isImmutable" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testPlanId" TEXT,
    "archivedById" TEXT NOT NULL,

    CONSTRAINT "Archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveTestCase" (
    "id" TEXT NOT NULL,
    "archiveId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "wasCanonical" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ArchiveTestCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRef_testCaseId_key" ON "GitHubRef"("testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRef_testPlanId_key" ON "GitHubRef"("testPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "Archive_testPlanId_key" ON "Archive"("testPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveTestCase_archiveId_testCaseId_key" ON "ArchiveTestCase"("archiveId", "testCaseId");

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TestCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_concludedById_fkey" FOREIGN KEY ("concludedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "TestPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRef" ADD CONSTRAINT "GitHubRef_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRef" ADD CONSTRAINT "GitHubRef_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "TestPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archive" ADD CONSTRAINT "Archive_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "TestPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archive" ADD CONSTRAINT "Archive_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveTestCase" ADD CONSTRAINT "ArchiveTestCase_archiveId_fkey" FOREIGN KEY ("archiveId") REFERENCES "Archive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveTestCase" ADD CONSTRAINT "ArchiveTestCase_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
