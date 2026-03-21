import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  })
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  const qaPassword = process.env.SEED_QA_PASSWORD
  const engPassword = process.env.SEED_ENG_PASSWORD
  const managerPassword = process.env.SEED_MANAGER_PASSWORD

  if (!adminPassword || !qaPassword || !engPassword || !managerPassword) {
    throw new Error(
      'Seed passwords must be set in environment variables. ' +
      'See .env.local.example for required variables: ' +
      'SEED_ADMIN_PASSWORD, SEED_QA_PASSWORD, SEED_ENG_PASSWORD, SEED_MANAGER_PASSWORD'
    )
  }

  console.log('Seeding test database...')

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------

  const admin = await prisma.user.create({
    data: {
      email: 'admin@testlab.internal',
      passwordHash: await hashPassword(adminPassword),
      role: 'ADMIN',
      name: 'Admin User',
      avatarInitials: 'AU',
      mustChangePassword: true,
    },
  })

  const qa = await prisma.user.create({
    data: {
      email: 'qa@testlab.internal',
      passwordHash: await hashPassword(qaPassword),
      role: 'QA',
      name: 'User 2',
      avatarInitials: 'U2',
      mustChangePassword: true,
    },
  })

  const eng1 = await prisma.user.create({
    data: {
      email: 'eng1@testlab.internal',
      passwordHash: await hashPassword(engPassword),
      role: 'ENGINEER',
      name: 'User 3',
      avatarInitials: 'U3',
      mustChangePassword: true,
    },
  })

  const eng2 = await prisma.user.create({
    data: {
      email: 'eng2@testlab.internal',
      passwordHash: await hashPassword(engPassword),
      role: 'ENGINEER',
      name: 'User 4',
      avatarInitials: 'U4',
      mustChangePassword: true,
    },
  })

  const manager = await prisma.user.create({
    data: {
      email: 'manager@testlab.internal',
      passwordHash: await hashPassword(managerPassword),
      role: 'MANAGER',
      name: 'User 5',
      avatarInitials: 'U5',
      mustChangePassword: true,
    },
  })

  console.log('  Created 5 users')

  // ---------------------------------------------------------------------------
  // Components
  // ---------------------------------------------------------------------------

  const flightController = await prisma.component.create({
    data: {
      name: 'Flight Controller v3.2',
      type: 'FIRMWARE',
      version: '3.2',
      description: 'Main flight controller firmware for all test units',
    },
  })

  const motorAssembly = await prisma.component.create({
    data: {
      name: 'Motor Assembly Unit-07',
      type: 'HARDWARE',
      serialNumber: 'MTR-2024-007',
      description: 'Brushless DC motor assembly for propulsion system',
    },
  })

  const gpsModule = await prisma.component.create({
    data: {
      name: 'GPS Module v1.4',
      type: 'HARDWARE',
      version: '1.4',
      description: 'Multi-constellation GNSS receiver module',
    },
  })

  const unitAlpha = await prisma.component.create({
    data: {
      name: 'Test Unit Alpha-01',
      type: 'DRONE_UNIT',
      serialNumber: 'TU-001',
      description: 'Primary test platform, quad-rotor configuration',
    },
  })

  const navSoftware = await prisma.component.create({
    data: {
      name: 'Navigation Software v2.3.1',
      type: 'SOFTWARE',
      version: '2.3.1',
      description: 'Autonomous navigation and waypoint management system',
    },
  })

  const batteryMgmt = await prisma.component.create({
    data: {
      name: 'Battery Management System',
      type: 'FIRMWARE',
      version: '1.0',
      description: 'Battery monitoring, cell balancing, and thermal management firmware',
    },
  })

  console.log('  Created 6 components')

  // ---------------------------------------------------------------------------
  // Test Plans
  // ---------------------------------------------------------------------------

  const releasePlan = await prisma.testPlan.create({
    data: {
      title: 'v2.3.1 Release Certification',
      status: 'IN_PROGRESS',
      description: 'Full certification test plan for the Navigation Software v2.3.1 release.',
      milestone: 'v2.3.1',
      startDate: new Date('2025-01-15'),
      targetDate: new Date('2025-03-15'),
      githubRef: {
        create: {
          repoUrl: 'https://github.com/testlab-org/nav-software',
          releaseTag: 'v2.3.1',
          branchName: 'release/v2.3.1',
        },
      },
    },
  })

  const maintenancePlan = await prisma.testPlan.create({
    data: {
      title: 'Q1 2025 Maintenance Cycle',
      status: 'IN_PROGRESS',
      description: 'Recurring quarterly maintenance testing for all hardware components.',
      milestone: 'Q1 2025',
      startDate: new Date('2025-01-01'),
      targetDate: new Date('2025-03-31'),
    },
  })

  const compliancePlan = await prisma.testPlan.create({
    data: {
      title: 'Motor Assembly Compliance Audit',
      status: 'PLANNED',
      description: 'Compliance audit for Motor Assembly Unit-07 against regulatory standards.',
      milestone: 'Compliance Q1',
      startDate: new Date('2025-02-01'),
      targetDate: new Date('2025-04-30'),
    },
  })

  console.log('  Created 3 test plans')

  // ---------------------------------------------------------------------------
  // Test Cases
  // ---------------------------------------------------------------------------

  const tcMotorEndurance = await prisma.testCase.create({
    data: {
      title: 'Motor endurance at max load',
      testType: 'MAINTENANCE',
      status: 'PLANNED',
      visibility: 'PUBLIC',
      objective:
        'Evaluate motor assembly endurance under maximum rated load conditions over a sustained period. Measure thermal output, vibration amplitude, and RPM stability.',
      parameters: {
        loadPercent: 100,
        ambientTempCelsius: 25,
        testDurationMinutes: 120,
        rpmTarget: 8500,
      },
      passCriteria:
        'Motor sustains max load for 120 minutes without thermal shutdown. Vibration < 0.1mm. RPM stability within 2%.',
      steps: [
        { order: 1, description: 'Mount motor assembly on test bench' },
        { order: 2, description: 'Connect telemetry sensors (thermal, vibration, RPM)' },
        { order: 3, description: 'Ramp to 100% rated load over 30 seconds' },
        { order: 4, description: 'Hold at max load for 120 minutes' },
        { order: 5, description: 'Record all sensor values at 1-minute intervals' },
        { order: 6, description: 'Verify no thermal shutdown triggered' },
        { order: 7, description: 'Ramp down and inspect bearings visually' },
      ],
      frequency: 'Quarterly',
      nextDueDate: new Date('2025-04-01'),
      componentId: motorAssembly.id,
      testPlanId: maintenancePlan.id,
      ownerId: eng1.id,
    },
  })

  const tcMotorEnduranceHighTemp = await prisma.testCase.create({
    data: {
      title: 'Motor endurance at max load — high temperature variant (45°C)',
      testType: 'MAINTENANCE',
      status: 'IN_PROGRESS',
      visibility: 'PUBLIC',
      objective:
        'Fork of motor endurance test conducted at elevated ambient temperature (45°C) to simulate desert operations.',
      parameters: {
        loadPercent: 100,
        ambientTempCelsius: 45,
        testDurationMinutes: 120,
        rpmTarget: 8500,
      },
      passCriteria:
        'Motor sustains max load at 45°C ambient for 120 minutes without thermal shutdown.',
      steps: [
        { order: 1, description: 'Configure environmental chamber to 45°C' },
        { order: 2, description: 'Mount motor assembly on test bench inside chamber' },
        { order: 3, description: 'Connect telemetry sensors' },
        { order: 4, description: 'Ramp to 100% rated load over 30 seconds' },
        { order: 5, description: 'Hold at max load for 120 minutes' },
        { order: 6, description: 'Record all sensor values at 1-minute intervals' },
        { order: 7, description: 'Verify bearing temperature stays below 100°C' },
      ],
      componentId: motorAssembly.id,
      testPlanId: maintenancePlan.id,
      ownerId: eng1.id,
      parentId: tcMotorEndurance.id,
      forkDepth: 1,
      forkReason: 'High temperature desert operations variant',
    },
  })

  const tcMotorEnduranceReduced = await prisma.testCase.create({
    data: {
      title: 'Motor endurance at max load — reduced load variant (80%)',
      testType: 'MAINTENANCE',
      status: 'PLANNED',
      visibility: 'PUBLIC',
      objective:
        'Fork of motor endurance test at 80% rated load to establish baseline comparison for degradation analysis.',
      parameters: {
        loadPercent: 80,
        ambientTempCelsius: 25,
        testDurationMinutes: 120,
        rpmTarget: 6800,
      },
      passCriteria:
        'Motor sustains 80% load for 120 minutes. Compare thermal and vibration metrics to 100% load test.',
      steps: [
        { order: 1, description: 'Mount motor assembly on test bench' },
        { order: 2, description: 'Connect telemetry sensors' },
        { order: 3, description: 'Ramp to 80% rated load over 30 seconds' },
        { order: 4, description: 'Hold at 80% load for 120 minutes' },
        { order: 5, description: 'Record all sensor values at 1-minute intervals' },
        { order: 6, description: 'Compare results against max load baseline' },
      ],
      componentId: motorAssembly.id,
      testPlanId: maintenancePlan.id,
      ownerId: eng2.id,
      parentId: tcMotorEndurance.id,
      forkDepth: 1,
      forkReason: 'Reduced load baseline comparison',
      isCanonical: true,
    },
  })

  const tcGpsFailover = await prisma.testCase.create({
    data: {
      title: 'GPS failover response',
      testType: 'FUNCTIONAL',
      status: 'IN_PROGRESS',
      visibility: 'PUBLIC',
      objective:
        'Verify that the navigation system correctly detects GPS signal loss and transitions to inertial navigation within the specified timeout window.',
      parameters: {
        signalLossType: 'complete',
        maxFailoverTimeSec: 2.0,
        positionDriftToleranceMeters: 1.5,
        testAltitudeMeters: 50,
      },
      passCriteria:
        'Failover completes within 2 seconds. Position drift < 1.5m after 30 seconds of inertial navigation.',
      steps: [
        { order: 1, description: 'Establish stable GPS lock at test altitude' },
        { order: 2, description: 'Verify position hold accuracy < 0.5m' },
        { order: 3, description: 'Simulate complete GPS signal loss' },
        { order: 4, description: 'Measure failover time to inertial navigation' },
        { order: 5, description: 'Hold position for 30 seconds on inertial nav' },
        { order: 6, description: 'Measure position drift' },
        { order: 7, description: 'Restore GPS signal and verify re-acquisition' },
      ],
      componentId: gpsModule.id,
      testPlanId: releasePlan.id,
      ownerId: eng2.id,
    },
  })

  const tcGpsFailoverMulti = await prisma.testCase.create({
    data: {
      title: 'GPS failover response — urban interference variant',
      testType: 'FUNCTIONAL',
      status: 'DRAFT',
      visibility: 'PUBLIC',
      objective:
        'Fork of GPS failover test simulating progressive multi-satellite dropout in urban environment.',
      parameters: {
        signalLossType: 'progressive',
        satelliteDropInterval: '5s',
        maxFailoverTimeSec: 3.0,
        positionDriftToleranceMeters: 2.0,
      },
      passCriteria:
        'System detects degraded GPS within 1 satellite loss. Full failover within 3 seconds of total loss.',
      steps: [
        { order: 1, description: 'Establish stable GPS lock with 8+ satellites' },
        { order: 2, description: 'Progressively drop satellites one every 5 seconds' },
        { order: 3, description: 'Monitor navigation mode transitions' },
        { order: 4, description: 'Record position accuracy at each stage' },
        { order: 5, description: 'Verify full failover when satellites < 3' },
        { order: 6, description: 'Restore satellites and verify recovery' },
      ],
      componentId: gpsModule.id,
      testPlanId: releasePlan.id,
      ownerId: eng2.id,
      parentId: tcGpsFailover.id,
      forkDepth: 1,
      forkReason: 'Progressive multi-satellite dropout scenario for urban environments',
    },
  })

  const tcFirmwareRegression = await prisma.testCase.create({
    data: {
      title: 'Firmware update regression suite',
      testType: 'REGRESSION',
      status: 'IN_PROGRESS',
      visibility: 'PUBLIC',
      objective:
        'Execute full regression suite against Flight Controller v3.2 firmware after OTA update. Validate sensor calibration persistence, failsafe triggers, and communication bus integrity.',
      parameters: {
        firmwareVersion: '3.2',
        previousVersion: '3.1.4',
        updateMethod: 'OTA',
        totalChecks: 47,
      },
      passCriteria:
        'All 47 regression checks pass. Sensor calibration drift < 0.1%. Communication bus latency < 5ms.',
      steps: [
        { order: 1, description: 'Record pre-update sensor calibration values' },
        { order: 2, description: 'Perform OTA firmware update to v3.2' },
        { order: 3, description: 'Verify update success and version number' },
        { order: 4, description: 'Execute all 47 regression checks' },
        { order: 5, description: 'Compare post-update sensor calibration' },
        { order: 6, description: 'Test all failsafe trigger conditions' },
        { order: 7, description: 'Measure communication bus latency' },
      ],
      componentId: flightController.id,
      testPlanId: releasePlan.id,
      ownerId: eng1.id,
    },
  })

  const tcFlightStability = await prisma.testCase.create({
    data: {
      title: 'Flight stability at wind threshold',
      testType: 'FLIGHT',
      status: 'IN_PROGRESS',
      visibility: 'PUBLIC',
      objective:
        'Assess vehicle attitude stability and position hold accuracy at maximum rated wind speed (35 km/h) across all cardinal headings.',
      parameters: {
        maxWindSpeedKmh: 35,
        testAltitudeMeters: 50,
        positionHoldToleranceMeters: 1.5,
        headings: ['N', 'E', 'S', 'W'],
      },
      passCriteria:
        'Position deviation < 1.5m in all headings at 35 km/h wind. No attitude oscillations > 5 degrees.',
      steps: [
        { order: 1, description: 'Pre-flight check and calibration' },
        { order: 2, description: 'Ascend to 50m test altitude' },
        { order: 3, description: 'Enter position hold mode' },
        { order: 4, description: 'Rotate to each cardinal heading (N, E, S, W)' },
        { order: 5, description: 'Hold each heading for 3 minutes under wind load' },
        { order: 6, description: 'Record position deviation and attitude angles' },
        { order: 7, description: 'Descend and land' },
      ],
      componentId: unitAlpha.id,
      testPlanId: releasePlan.id,
      ownerId: eng1.id,
    },
  })

  const tcBatteryCompliance = await prisma.testCase.create({
    data: {
      title: 'Battery thermal compliance',
      testType: 'COMPLIANCE',
      status: 'PLANNED',
      visibility: 'RESTRICTED',
      objective:
        'Verify that the Battery Management System maintains cell temperature within regulatory limits (0°C–45°C) during charge, discharge, and peak draw cycles.',
      parameters: {
        regulatoryLimitMinCelsius: 0,
        regulatoryLimitMaxCelsius: 45,
        chargeRateC: 1.0,
        dischargeRateC: 2.0,
        peakDrawAmps: 30,
      },
      passCriteria:
        'Cell temperature stays within 0–45°C across all test conditions. Cell balance delta < 20mV.',
      steps: [
        { order: 1, description: 'Connect BMS to test rig with thermal monitoring' },
        { order: 2, description: 'Execute charge cycle at 1C rate' },
        { order: 3, description: 'Record max cell temperature during charge' },
        { order: 4, description: 'Execute discharge cycle at 2C rate' },
        { order: 5, description: 'Record max cell temperature during discharge' },
        { order: 6, description: 'Apply peak draw of 30A for 60 seconds' },
        { order: 7, description: 'Record max cell temperature during peak draw' },
        { order: 8, description: 'Verify all temperatures within regulatory limits' },
      ],
      componentId: batteryMgmt.id,
      testPlanId: compliancePlan.id,
      ownerId: eng2.id,
    },
  })

  const tcNavLoadTest = await prisma.testCase.create({
    data: {
      title: 'Navigation software load test',
      testType: 'FUNCTIONAL',
      status: 'PLANNED',
      visibility: 'PUBLIC',
      objective:
        'Stress test the Navigation Software v2.3.1 with concurrent waypoint recalculations, obstacle avoidance inputs, and telemetry streaming at maximum data rate.',
      parameters: {
        concurrentWaypoints: 250,
        targetResponseTimeMs: 50,
        soakTestDurationHours: 4,
        maxCpuUtilizationPercent: 80,
      },
      passCriteria:
        'Response time < 50ms at p99. No memory leaks over 4-hour soak. CPU utilization < 80%.',
      steps: [
        { order: 1, description: 'Deploy Nav Software v2.3.1 to test environment' },
        { order: 2, description: 'Configure 250 concurrent waypoint recalculation streams' },
        { order: 3, description: 'Enable obstacle avoidance inputs at max rate' },
        { order: 4, description: 'Enable telemetry streaming at max data rate' },
        { order: 5, description: 'Run soak test for 4 hours' },
        { order: 6, description: 'Monitor response times, memory, and CPU throughout' },
        { order: 7, description: 'Analyze results for memory leaks or degradation' },
      ],
      componentId: navSoftware.id,
      testPlanId: releasePlan.id,
      ownerId: eng2.id,
    },
  })

  const tcMotorVibration = await prisma.testCase.create({
    data: {
      title: 'Motor vibration analysis',
      testType: 'MAINTENANCE',
      status: 'IN_PROGRESS',
      visibility: 'TEAM',
      objective:
        'Capture and analyse vibration frequency spectrum of Motor Assembly Unit-07 at idle, 50%, 75%, and 100% throttle to detect bearing wear signatures.',
      parameters: {
        throttleLevels: ['idle', '50%', '75%', '100%'],
        expectedMaxHz: 120,
        sensorType: 'accelerometer',
        samplingRateHz: 10000,
      },
      passCriteria:
        'Vibration harmonics at 100% throttle < 120 Hz. No bearing wear signatures detected.',
      steps: [
        { order: 1, description: 'Mount accelerometer on motor housing' },
        { order: 2, description: 'Configure data acquisition at 10kHz sampling' },
        { order: 3, description: 'Record vibration at idle for 60 seconds' },
        { order: 4, description: 'Ramp to 50% throttle and record for 60 seconds' },
        { order: 5, description: 'Ramp to 75% throttle and record for 60 seconds' },
        { order: 6, description: 'Ramp to 100% throttle and record for 60 seconds' },
        { order: 7, description: 'Analyze frequency spectrum for each level' },
        { order: 8, description: 'Compare against baseline and wear thresholds' },
      ],
      componentId: motorAssembly.id,
      testPlanId: maintenancePlan.id,
      ownerId: eng1.id,
    },
  })

  await prisma.testCase.create({
    data: {
      title: 'Firmware rollback procedure',
      testType: 'REGRESSION',
      status: 'DRAFT',
      visibility: 'PUBLIC',
      objective:
        'Validate that Flight Controller firmware can be safely rolled back from v3.2 to v3.1.x without data loss or requiring recalibration.',
      parameters: {
        fromVersion: '3.2',
        toVersion: '3.1.4',
        rollbackMethod: 'OTA',
      },
      passCriteria:
        'Rollback completes without errors. Sensor calibration data preserved. No recalibration needed.',
      steps: [
        { order: 1, description: 'Record current sensor calibration on v3.2' },
        { order: 2, description: 'Initiate OTA rollback to v3.1.4' },
        { order: 3, description: 'Verify rollback success and version number' },
        { order: 4, description: 'Check sensor calibration data integrity' },
        { order: 5, description: 'Run basic flight readiness checks' },
        { order: 6, description: 'Verify no data loss in flight logs' },
      ],
      componentId: flightController.id,
      testPlanId: releasePlan.id,
      ownerId: eng1.id,
    },
  })

  console.log('  Created 11 test cases (including forks)')

  // ---------------------------------------------------------------------------
  // Test Runs
  // ---------------------------------------------------------------------------

  await prisma.testRun.create({
    data: {
      testCaseId: tcMotorEndurance.id,
      status: 'PASSED',
      environment: 'BENCH',
      loggedById: eng1.id,
      componentId: motorAssembly.id,
      notes: 'Motor sustained max load for 120 minutes without anomaly.',
      measuredValues: {
        temperaturePeakCelsius: 78.3,
        avgRpm: 8420,
        vibrationAmplitudeMm: 0.04,
        voltageDropV: 0.12,
        testDurationMinutes: 120,
      },
    },
  })

  const runMotorHighTemp = await prisma.testRun.create({
    data: {
      testCaseId: tcMotorEnduranceHighTemp.id,
      status: 'FAILED',
      environment: 'BENCH',
      loggedById: eng1.id,
      componentId: motorAssembly.id,
      notes:
        'Motor exceeded thermal threshold at 96 minutes. Emergency shutdown triggered at 105°C bearing temperature.',
      measuredValues: {
        ambientTemperatureCelsius: 55,
        temperaturePeakCelsius: 105.7,
        avgRpm: 8105,
        vibrationAmplitudeMm: 0.09,
        shutdownTriggered: true,
        timeToShutdownMinutes: 96,
      },
    },
  })

  const runGpsFailover = await prisma.testRun.create({
    data: {
      testCaseId: tcGpsFailover.id,
      status: 'PASSED',
      environment: 'SIMULATION',
      loggedById: eng2.id,
      componentId: gpsModule.id,
      notes:
        'Failover to inertial navigation completed in 1.2 seconds. Position drift within acceptable 0.5m tolerance after 30 seconds.',
      measuredValues: {
        failoverTimeSec: 1.2,
        positionDriftMeters: 0.34,
        inertialNavAccuracyPercent: 97.8,
        signalRecoveryTimeSec: 4.6,
      },
    },
  })

  await prisma.testRun.create({
    data: {
      testCaseId: tcFirmwareRegression.id,
      status: 'PASSED',
      environment: 'LAB',
      loggedById: eng1.id,
      componentId: flightController.id,
      notes:
        'All 47 regression checks passed. Sensor calibration data persisted correctly through OTA update.',
      measuredValues: {
        totalChecks: 47,
        passedChecks: 47,
        failedChecks: 0,
        calibrationDriftPercent: 0.02,
        comBusLatencyMs: 3.1,
      },
    },
  })

  await prisma.testRun.create({
    data: {
      testCaseId: tcFlightStability.id,
      status: 'IN_PROGRESS',
      environment: 'FIELD',
      loggedById: eng1.id,
      componentId: unitAlpha.id,
      location: 'Test Range Alpha',
      notes:
        'Test underway. Completed north and east headings; south and west headings pending weather window.',
      flightData: {
        altitudeMeters: 50,
        groundSpeedKmh: 0,
        windSpeedKmh: 33.4,
        durationMinutes: 42,
        coordinates: {
          takeoff: { lat: 34.0522, lng: -118.2437 },
          current: { lat: 34.0524, lng: -118.2439 },
        },
        headingsCompleted: ['N', 'E'],
        headingsPending: ['S', 'W'],
        maxPositionDeviationMeters: 1.12,
      },
      weatherData: {
        temperatureCelsius: 31,
        humidityPercent: 62,
        windSpeedKmh: 33.4,
        windDirection: 'NW',
        visibility: 'clear',
      },
    },
  })

  await prisma.testRun.create({
    data: {
      testCaseId: tcBatteryCompliance.id,
      status: 'PASSED',
      environment: 'LAB',
      loggedById: eng2.id,
      componentId: batteryMgmt.id,
      notes:
        'All thermal limits respected across charge, discharge, and peak draw cycles. Maximum cell temperature recorded at 41.2°C during peak draw.',
      measuredValues: {
        chargeTempMaxCelsius: 38.4,
        dischargeTempMaxCelsius: 39.7,
        peakDrawTempMaxCelsius: 41.2,
        regulatoryLimitCelsius: 45,
        cellBalanceDeltamV: 12,
        cyclesCompleted: 15,
      },
    },
  })

  const runMotorVibration = await prisma.testRun.create({
    data: {
      testCaseId: tcMotorVibration.id,
      status: 'FAILED',
      environment: 'BENCH',
      loggedById: eng1.id,
      componentId: motorAssembly.id,
      notes:
        'Anomalous vibration harmonic detected at 100% throttle — 142 Hz peak suggests early bearing wear. Recommend immediate inspection.',
      measuredValues: {
        idleVibrationHz: 22,
        fiftyPercentHz: 58,
        seventyFivePercentHz: 89,
        hundredPercentHz: 142,
        expectedHundredPercentHz: 115,
        bearingWearIndicator: 'ALERT',
        rpmAtFailure: 8600,
      },
    },
  })

  const runNavLoad = await prisma.testRun.create({
    data: {
      testCaseId: tcNavLoadTest.id,
      status: 'PASSED',
      environment: 'SIMULATION',
      loggedById: eng2.id,
      componentId: navSoftware.id,
      notes:
        'Navigation software handled 250 concurrent waypoint recalculations with sub-50ms response time. No memory leaks detected over 4-hour soak test.',
      measuredValues: {
        concurrentWaypoints: 250,
        avgResponseTimeMs: 34,
        p99ResponseTimeMs: 48,
        memoryLeakDetected: false,
        soakTestDurationHours: 4,
        cpuUtilizationPercent: 72,
      },
    },
  })

  await prisma.testRun.create({
    data: {
      testCaseId: tcFlightStability.id,
      status: 'PASSED',
      environment: 'FIELD',
      loggedById: eng1.id,
      componentId: unitAlpha.id,
      location: 'Test Range Alpha',
      runDate: new Date('2025-01-20'),
      notes:
        'Preliminary stability run at 25 km/h wind — all four headings completed successfully.',
      flightData: {
        altitudeMeters: 50,
        groundSpeedKmh: 0,
        windSpeedKmh: 25.0,
        durationMinutes: 68,
        coordinates: {
          takeoff: { lat: 34.0522, lng: -118.2437 },
          landing: { lat: 34.0522, lng: -118.2437 },
        },
        headingsCompleted: ['N', 'E', 'S', 'W'],
        headingsPending: [],
        maxPositionDeviationMeters: 0.73,
      },
      weatherData: {
        temperatureCelsius: 28,
        humidityPercent: 55,
        windSpeedKmh: 25.0,
        windDirection: 'E',
        visibility: 'clear',
      },
    },
  })

  console.log('  Created 9 test runs')

  // ---------------------------------------------------------------------------
  // Issues
  // ---------------------------------------------------------------------------

  await prisma.issue.create({
    data: {
      title: 'Motor bearing overheating under high-temperature conditions',
      description:
        'During the high-temperature variant of the motor endurance test, the motor exceeded its thermal threshold at 96 minutes with bearing temperature reaching 105.7°C. This poses a critical risk for operations in hot climates and must be resolved before deployment clearance.',
      severity: 'CRITICAL',
      status: 'OPEN',
      testRunId: runMotorHighTemp.id,
      componentId: motorAssembly.id,
      createdById: eng1.id,
      assigneeId: eng1.id,
    },
  })

  await prisma.issue.create({
    data: {
      title: 'Anomalous vibration harmonic at full throttle',
      description:
        'Motor Assembly Unit-07 shows a 142 Hz vibration peak at 100% throttle — expected value is 115 Hz. This harmonic signature is consistent with early-stage bearing wear and requires physical inspection and possible replacement.',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      testRunId: runMotorVibration.id,
      componentId: motorAssembly.id,
      createdById: eng1.id,
      assigneeId: eng1.id,
    },
  })

  await prisma.issue.create({
    data: {
      title: 'GPS failover position drift exceeds spec in edge cases',
      description:
        'While the primary GPS failover test passed, edge-case simulation with rapid altitude change during signal loss showed position drift of 1.8m — exceeding the 1.5m tolerance. Needs further investigation under combined loss scenarios.',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      testRunId: runGpsFailover.id,
      componentId: gpsModule.id,
      createdById: qa.id,
      assigneeId: eng2.id,
    },
  })

  await prisma.issue.create({
    data: {
      title: 'Navigation software CPU utilization higher than target',
      description:
        'Load test showed 72% CPU utilization under peak conditions. While within operational limits, the target was 60%. Optimization deferred to v2.4.0 roadmap as it does not impact current release certification.',
      severity: 'MEDIUM',
      status: 'DEFERRED',
      deferredTo: 'v2.4',
      testRunId: runNavLoad.id,
      componentId: navSoftware.id,
      createdById: eng2.id,
      assigneeId: eng2.id,
    },
  })

  console.log('  Created 4 issues')

  // ---------------------------------------------------------------------------
  // Archive — v2.2.0 Release Certification (concluded)
  // ---------------------------------------------------------------------------

  const archive = await prisma.archive.create({
    data: {
      title: 'v2.2.0 Release Certification',
      category: 'RELEASE_CERTIFICATION',
      outcome: 'CONDITIONAL_PASS',
      archivedById: qa.id,
      releaseTag: 'v2.2.0',
      summary:
        'Release certification for Navigation Software v2.2.0 completed with conditional pass. All critical and high-priority test cases passed. Two low-severity findings documented and accepted with dispositions. One medium finding deferred.',
      findings: [
        {
          id: 'FINDING-001',
          description:
            'Minor telemetry timestamp jitter of ±3ms observed under high CPU load. Within acceptable tolerance for v2.2.0 release.',
          severity: 'LOW',
          disposition: 'ACCEPTED',
          notes: 'Monitoring in production; will revisit in v2.3 if jitter exceeds ±5ms.',
        },
        {
          id: 'FINDING-002',
          description:
            'Waypoint upload latency increases by 12% when more than 200 waypoints are queued. Documented as known limitation.',
          severity: 'MEDIUM',
          disposition: 'DEFERRED',
          notes: 'Optimization scheduled for v2.4.0 roadmap.',
        },
        {
          id: 'FINDING-003',
          description:
            'All flight envelope tests passed within specification. No anomalies detected across 14 test flights.',
          severity: 'LOW',
          disposition: 'RESOLVED',
        },
      ],
      attachments: [
        'v2.2.0-test-report.pdf',
        'flight-logs-certification.zip',
        'sensor-calibration-data.csv',
      ],
      tags: ['release', 'v2.2.0', 'certification', 'navigation', 'conditional-pass'],
      searchIndex:
        'v2.2.0 Release Certification RELEASE_CERTIFICATION CONDITIONAL_PASS Navigation Software telemetry jitter waypoint latency flight envelope certification release',
    },
  })

  await prisma.archiveTestCase.createMany({
    data: [
      { archiveId: archive.id, testCaseId: tcFirmwareRegression.id, wasCanonical: true },
      { archiveId: archive.id, testCaseId: tcNavLoadTest.id, wasCanonical: true },
      { archiveId: archive.id, testCaseId: tcFlightStability.id, wasCanonical: false },
      { archiveId: archive.id, testCaseId: tcGpsFailover.id, wasCanonical: true },
    ],
  })

  console.log('  Created archive with 4 linked test cases')
  console.log('\nSeed completed successfully.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
