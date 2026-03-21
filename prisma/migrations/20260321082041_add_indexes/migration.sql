-- CreateIndex
CREATE INDEX "Component_type_idx" ON "Component"("type");

-- CreateIndex
CREATE INDEX "Component_deletedAt_idx" ON "Component"("deletedAt");

-- CreateIndex
CREATE INDEX "Issue_severity_idx" ON "Issue"("severity");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_assigneeId_idx" ON "Issue"("assigneeId");

-- CreateIndex
CREATE INDEX "Issue_componentId_idx" ON "Issue"("componentId");

-- CreateIndex
CREATE INDEX "Issue_testRunId_idx" ON "Issue"("testRunId");

-- CreateIndex
CREATE INDEX "Issue_deletedAt_idx" ON "Issue"("deletedAt");

-- CreateIndex
CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt");

-- CreateIndex
CREATE INDEX "TestCase_status_idx" ON "TestCase"("status");

-- CreateIndex
CREATE INDEX "TestCase_testType_idx" ON "TestCase"("testType");

-- CreateIndex
CREATE INDEX "TestCase_ownerId_idx" ON "TestCase"("ownerId");

-- CreateIndex
CREATE INDEX "TestCase_componentId_idx" ON "TestCase"("componentId");

-- CreateIndex
CREATE INDEX "TestCase_testPlanId_idx" ON "TestCase"("testPlanId");

-- CreateIndex
CREATE INDEX "TestCase_deletedAt_idx" ON "TestCase"("deletedAt");

-- CreateIndex
CREATE INDEX "TestCase_createdAt_idx" ON "TestCase"("createdAt");

-- CreateIndex
CREATE INDEX "TestRun_testCaseId_idx" ON "TestRun"("testCaseId");

-- CreateIndex
CREATE INDEX "TestRun_componentId_idx" ON "TestRun"("componentId");

-- CreateIndex
CREATE INDEX "TestRun_loggedById_idx" ON "TestRun"("loggedById");

-- CreateIndex
CREATE INDEX "TestRun_status_idx" ON "TestRun"("status");

-- CreateIndex
CREATE INDEX "TestRun_runDate_idx" ON "TestRun"("runDate");

-- CreateIndex
CREATE INDEX "TestRun_deletedAt_idx" ON "TestRun"("deletedAt");
