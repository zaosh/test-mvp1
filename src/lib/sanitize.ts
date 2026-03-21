import { z } from 'zod'

// --- TestCase.parameters ---
export const ParameterSchema = z.record(
  z.string(),
  z.union([z.string().max(500), z.number(), z.boolean(), z.array(z.string().max(200))])
)

// --- TestCase.steps ---
export const StepSchema = z.array(
  z.object({
    order: z.number().int().positive(),
    description: z.string().min(1).max(2000),
    expected: z.string().max(1000).optional(),
  })
)

// --- TestRun.measuredValues ---
export const MeasuredValuesSchema = z.record(
  z.string().max(100),
  z.union([z.string().max(500), z.number(), z.boolean()])
)

// --- TestRun.flightData ---
export const FlightDataSchema = z.object({
  pilotName: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  durationMinutes: z.number().positive(),
  maxAltitudeMeters: z.number().optional(),
  altitudeMeters: z.number().optional(),
  groundSpeedKmh: z.number().optional(),
  windSpeedKmh: z.number().optional(),
  coordinates: z.record(z.string(), z.unknown()).optional(),
  headingsCompleted: z.array(z.string()).optional(),
  headingsPending: z.array(z.string()).optional(),
  maxPositionDeviationMeters: z.number().optional(),
  weather: z
    .object({
      tempCelsius: z.number().min(-50).max(60),
      windSpeedKph: z.number().min(0).max(200),
      humidity: z.number().min(0).max(100),
      conditions: z.string().max(200),
    })
    .optional(),
}).passthrough()

// --- Archive.findings ---
export const FindingSchema = z.array(
  z.object({
    id: z.string().regex(/^FINDING-\d+$/),
    description: z.string().min(1).max(2000),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
    disposition: z.enum(['RESOLVED', 'DEFERRED', 'ACCEPTED', 'WONT_FIX']),
    notes: z.string().max(1000).optional(),
  })
)

// --- GitHubRef ---
export const GitHubRefSchema = z.object({
  repoUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith('https://github.com/'), {
      message: 'Only github.com URLs are allowed',
    }),
  commitSha: z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .optional(),
  prNumber: z.number().int().positive().optional(),
  releaseTag: z.string().max(100).optional(),
  branchName: z.string().max(200).optional(),
})

// --- TestCase create/update ---
export const TestCaseCreateSchema = z.object({
  title: z.string().min(1).max(500),
  objective: z.string().min(1).max(5000),
  testType: z.enum(['FUNCTIONAL', 'REGRESSION', 'FLIGHT', 'COMPLIANCE', 'MAINTENANCE', 'EXPERIMENTAL']),
  status: z.enum(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'CONCLUDED', 'WAIVED']).optional(),
  visibility: z.enum(['PUBLIC', 'TEAM', 'RESTRICTED']).optional(),
  parameters: ParameterSchema,
  passCriteria: z.string().min(1).max(2000),
  steps: StepSchema,
  frequency: z.string().max(100).optional(),
  nextDueDate: z.string().datetime().optional(),
  componentId: z.string().cuid().optional(),
  testPlanId: z.string().cuid().optional(),
})

export const TestCaseUpdateSchema = TestCaseCreateSchema.partial()

// --- TestRun create ---
export const TestRunCreateSchema = z.object({
  testCaseId: z.string().cuid(),
  environment: z.enum(['LAB', 'FIELD', 'SIMULATION', 'BENCH']),
  status: z.enum(['PASSED', 'FAILED', 'IN_PROGRESS', 'BLOCKED']),
  notes: z.string().max(5000).optional(),
  measuredValues: MeasuredValuesSchema.optional(),
  flightData: FlightDataSchema.optional(),
  weatherData: z.record(z.string(), z.unknown()).optional(),
  location: z.string().max(500).optional(),
  componentId: z.string().cuid().optional(),
})

// --- Issue create/update ---
export const IssueCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX', 'DEFERRED']).optional(),
  testRunId: z.string().cuid().optional(),
  componentId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  resolutionNotes: z.string().max(5000).optional(),
  deferredTo: z.string().max(100).optional(),
})

export const IssueUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(5000).optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX', 'DEFERRED']).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  resolutionNotes: z.string().max(5000).optional(),
  deferredTo: z.string().max(100).optional(),
})

// --- Component create/update ---
export const ComponentCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['SOFTWARE', 'FIRMWARE', 'HARDWARE', 'DRONE_UNIT', 'SYSTEM']),
  version: z.string().max(50).optional(),
  serialNumber: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  status: z.string().max(50).optional(),
})

export const ComponentUpdateSchema = ComponentCreateSchema.partial()

// --- TestPlan create/update ---
export const TestPlanCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  milestone: z.string().max(200).optional(),
  status: z.enum(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'CONCLUDED', 'WAIVED']).optional(),
  startDate: z.string().datetime().optional(),
  targetDate: z.string().datetime().optional(),
})

export const TestPlanUpdateSchema = TestPlanCreateSchema.partial()

// --- Archive create ---
export const ArchiveCreateSchema = z.object({
  title: z.string().min(1).max(500),
  category: z.enum([
    'RELEASE_CERTIFICATION',
    'REGRESSION_SUITE',
    'COMPLIANCE_AUDIT',
    'FIELD_INVESTIGATION',
    'MAINTENANCE_CYCLE',
    'EXPERIMENTAL',
  ]),
  outcome: z.enum(['PASSED', 'FAILED', 'CONDITIONAL_PASS', 'INCONCLUSIVE']),
  summary: z.string().min(1).max(10000),
  findings: FindingSchema,
  githubRef: z.string().max(500).optional(),
  releaseTag: z.string().max(100).optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  testPlanId: z.string().cuid().optional(),
  testCaseIds: z.array(z.string().cuid()).optional(),
})

// --- Fork ---
export const ForkCreateSchema = z.object({
  forkReason: z.string().min(10).max(2000),
  overrideParameters: ParameterSchema.optional(),
  overrideTitle: z.string().min(1).max(500).optional(),
})

// --- Conclude ---
export const ConcludeSchema = z.object({
  concludedNotes: z.string().min(1).max(5000),
  isCanonical: z.boolean().optional(),
})

// --- File upload MIME validation ---
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/json',
] as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function isAllowedMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

export function containsPathTraversal(filename: string): boolean {
  return /(\.\.[/\\]|%2e%2e)/i.test(filename)
}
