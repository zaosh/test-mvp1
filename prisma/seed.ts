import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding drone test database...");

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------

  const admin = await prisma.user.create({
    data: {
      email: "admin@dronetest.internal",
      passwordHash: hashSync("admin123", 10),
      role: "ADMIN",
      name: "System Admin",
      avatarInitials: "SA",
    },
  });

  const qa = await prisma.user.create({
    data: {
      email: "qa@dronetest.internal",
      passwordHash: hashSync("qa123", 10),
      role: "QA",
      name: "Riya Sharma",
      avatarInitials: "RS",
    },
  });

  const eng1 = await prisma.user.create({
    data: {
      email: "eng1@dronetest.internal",
      passwordHash: hashSync("eng123", 10),
      role: "ENGINEER",
      name: "Arjun Mehta",
      avatarInitials: "AM",
    },
  });

  const eng2 = await prisma.user.create({
    data: {
      email: "eng2@dronetest.internal",
      passwordHash: hashSync("eng123", 10),
      role: "ENGINEER",
      name: "Priya Nair",
      avatarInitials: "PN",
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@dronetest.internal",
      passwordHash: hashSync("mgr123", 10),
      role: "MANAGER",
      name: "Dev Patel",
      avatarInitials: "DP",
    },
  });

  console.log("  Created 5 users");

  // ---------------------------------------------------------------------------
  // Components
  // ---------------------------------------------------------------------------

  const flightController = await prisma.component.create({
    data: {
      name: "Flight Controller v3.2",
      type: "FIRMWARE",
      version: "3.2",
      description: "Main flight controller firmware for all drone units",
    },
  });

  const motorAssembly = await prisma.component.create({
    data: {
      name: "Motor Assembly Unit-07",
      type: "HARDWARE",
      serialNumber: "MTR-2024-007",
      description: "Brushless DC motor assembly for propulsion system",
    },
  });

  const gpsModule = await prisma.component.create({
    data: {
      name: "GPS Module v1.4",
      type: "HARDWARE",
      version: "1.4",
      description: "Multi-constellation GNSS receiver module",
    },
  });

  const droneAlpha = await prisma.component.create({
    data: {
      name: "Drone Unit Alpha-01",
      type: "DRONE_UNIT",
      serialNumber: "DRN-001",
      description: "Primary test drone platform, quad-rotor configuration",
    },
  });

  const navSoftware = await prisma.component.create({
    data: {
      name: "Navigation Software v2.3.1",
      type: "SOFTWARE",
      version: "2.3.1",
      description: "Autonomous navigation and waypoint management system",
    },
  });

  const batteryMgmt = await prisma.component.create({
    data: {
      name: "Battery Management System",
      type: "FIRMWARE",
      version: "1.0",
      description: "Battery monitoring, cell balancing, and thermal management firmware",
    },
  });

  console.log("  Created 6 components");

  // ---------------------------------------------------------------------------
  // Test Plans
  // ---------------------------------------------------------------------------

  const releasePlan = await prisma.testPlan.create({
    data: {
      title: "v2.3.1 Release Certification",
      status: "IN_PROGRESS",
      description:
        "Full certification test plan for the Navigation Software v2.3.1 release.",
      milestone: "v2.3.1",
      startDate: new Date("2025-01-15"),
      targetDate: new Date("2025-03-15"),
      githubRef: {
        create: {
          repoUrl: "https://github.com/dronetest-org/nav-software",
          releaseTag: "v2.3.1",
          branchName: "release/v2.3.1",
        },
      },
    },
  });

  const maintenancePlan = await prisma.testPlan.create({
    data: {
      title: "Q1 2025 Maintenance Cycle",
      status: "IN_PROGRESS",
      description:
        "Recurring quarterly maintenance testing for all hardware components.",
      milestone: "Q1 2025",
      startDate: new Date("2025-01-01"),
      targetDate: new Date("2025-03-31"),
    },
  });

  const compliancePlan = await prisma.testPlan.create({
    data: {
      title: "Motor Assembly Compliance Audit",
      status: "PLANNED",
      description:
        "Compliance audit for Motor Assembly Unit-07 against regulatory standards.",
      milestone: "Compliance Q1",
      startDate: new Date("2025-02-01"),
      targetDate: new Date("2025-04-30"),
    },
  });

  console.log("  Created 3 test plans");

  // ---------------------------------------------------------------------------
  // Test Cases
  // ---------------------------------------------------------------------------

  const tcMotorEndurance = await prisma.testCase.create({
    data: {
      title: "Motor endurance at max load",
      testType: "MAINTENANCE",
      status: "PLANNED",
      objective:
        "Evaluate motor assembly endurance under maximum rated load conditions over a sustained period. Measure thermal output, vibration amplitude, and RPM stability.",
      parameters: {
        loadPercent: 100,
        ambientTempCelsius: 25,
        testDurationMinutes: 120,
        rpmTarget: 8500,
      },
      passCriteria:
        "Motor sustains max load for 120 minutes without thermal shutdown. Vibration < 0.1mm. RPM stability within 2%.",
      steps: [
        "Mount motor assembly on test bench",
        "Connect telemetry sensors (thermal, vibration, RPM)",
        "Ramp to 100% rated load over 30 seconds",
        "Hold at max load for 120 minutes",
        "Record all sensor values at 1-minute intervals",
        "Verify no thermal shutdown triggered",
        "Ramp down and inspect bearings visually",
      ],
      frequency: "Quarterly",
      nextDueDate: new Date("2025-04-01"),
      componentId: motorAssembly.id,
      testPlanId: maintenancePlan.id,
      ownerId: eng1.id,
    },
  });

  // Fork A: high temp variant
  const tcMotorEnduranceHighTemp = await prisma.testCase.create({
    data: {
      title: "Motor endurance at max load — high temperature variant (45°C)",
      testType: "MAINTENANCE",
      status: "IN_PROGRESS",
      objective:
        "Fork of motor endurance test conducted at elevated ambient temperature (45°C) to simulate desert operations.",
      parameters: {
        loadPercent: 100,
        ambientTempCelsius: 45,
        testDurationMinutes: 120,
        rpmTarget: 8500,
      },
      passCriteria:
        "Motor sustains max load at 45°C ambient for 120 minutes without thermal shutdown.",
      steps: [
        "Configure environmental chamber to 45°C",
        "Mount motor assembly on test bench inside chamber",
        "Connect telemetry sensors",
        "Ramp to 100% rated load over 30 seconds",
        "Hold at max load for 120 minutes",
        "Record all sensor values at 1-minute intervals",
        "Verify bearing temperature stays below 100°C",
      ],
      componentId: motorAssembly.id,
      testPlanId: maintenancePlan.id,
      ownerId: eng1.id,
      parentId: tcMotorEndurance.id,
      forkDepth: 1,
      forkReason: "High temperature desert operations variant",
    },
  });

  // Fork B: reduced load variant
  const tcMotorEnduranceReduced = await prisma.testCase.create({
    data: {
      title: "Motor endurance at max load — reduced load variant (80%)",
      testType: "MAINTENANCE",
      status: "PLANNED",
      objective:
        "Fork of motor endurance test at 80% rated load to establish baseline comparison for degradation analysis.",
      parameters: {
        loadPercent: 80,
        ambientTempCelsius: 25,
        testDurationMinutes: 120,
        rpmTarget: 6800,
      },
      passCriteria:
        "Motor sustains 80% load for 120 minutes. Compare thermal and vibration metrics to 100% load test.",
      steps: [
        "Mount motor assembly on test bench",
        "Connect telemetry sensors",
        "Ramp to 80% rated load over 30 seconds",
        "Hold at 80% load for 120 minutes",
        "Record all sensor values at 1-minute intervals",
        "Compare results against max load baseline",
      ],
      componentId: motorAssembly.id,
      testPlanId: maintenancePlan.id,
      ownerId: eng2.id,
      parentId: tcMotorEndurance.id,
      forkDepth: 1,
      forkReason: "Reduced load baseline comparison",
    },
  });

  const tcGpsFailover = await prisma.testCase.create({
    data: {
      title: "GPS failover response",
      testType: "FUNCTIONAL",
      status: "IN_PROGRESS",
      objective:
        "Verify that the navigation system correctly detects GPS signal loss and transitions to inertial navigation within the specified timeout window.",
      parameters: {
        signalLossType: "complete",
        maxFailoverTimeSec: 2.0,
        positionDriftToleranceMeters: 1.5,
        testAltitudeMeters: 50,
      },
      passCriteria:
        "Failover completes within 2 seconds. Position drift < 1.5m after 30 seconds of inertial navigation.",
      steps: [
        "Establish stable GPS lock at test altitude",
        "Verify position hold accuracy < 0.5m",
        "Simulate complete GPS signal loss",
        "Measure failover time to inertial navigation",
        "Hold position for 30 seconds on inertial nav",
        "Measure position drift",
        "Restore GPS signal and verify re-acquisition",
      ],
      componentId: gpsModule.id,
      testPlanId: releasePlan.id,
      ownerId: eng2.id,
    },
  });

  // Fork of GPS failover: multi-satellite dropout
  const tcGpsFailoverMulti = await prisma.testCase.create({
    data: {
      title: "GPS failover response — multi-satellite dropout",
      testType: "FUNCTIONAL",
      status: "DRAFT",
      objective:
        "Fork of GPS failover test simulating progressive multi-satellite dropout rather than full signal loss.",
      parameters: {
        signalLossType: "progressive",
        satelliteDropInterval: "5s",
        maxFailoverTimeSec: 3.0,
        positionDriftToleranceMeters: 2.0,
      },
      passCriteria:
        "System detects degraded GPS within 1 satellite loss. Full failover within 3 seconds of total loss.",
      steps: [
        "Establish stable GPS lock with 8+ satellites",
        "Progressively drop satellites one every 5 seconds",
        "Monitor navigation mode transitions",
        "Record position accuracy at each stage",
        "Verify full failover when satellites < 3",
        "Restore satellites and verify recovery",
      ],
      componentId: gpsModule.id,
      testPlanId: releasePlan.id,
      ownerId: eng2.id,
      parentId: tcGpsFailover.id,
      forkDepth: 1,
      forkReason: "Progressive multi-satellite dropout scenario",
    },
  });

  const tcFirmwareRegression = await prisma.testCase.create({
    data: {
      title: "Firmware update regression suite",
      testType: "REGRESSION",
      status: "IN_PROGRESS",
      objective:
        "Execute full regression suite against Flight Controller v3.2 firmware after OTA update. Validate sensor calibration persistence, failsafe triggers, and communication bus integrity.",
      parameters: {
        firmwareVersion: "3.2",
        previousVersion: "3.1.4",
        updateMethod: "OTA",
        totalChecks: 47,
      },
      passCriteria:
        "All 47 regression checks pass. Sensor calibration drift < 0.1%. Communication bus latency < 5ms.",
      steps: [
        "Record pre-update sensor calibration values",
        "Perform OTA firmware update to v3.2",
        "Verify update success and version number",
        "Execute all 47 regression checks",
        "Compare post-update sensor calibration",
        "Test all failsafe trigger conditions",
        "Measure communication bus latency",
      ],
      componentId: flightController.id,
      testPlanId: releasePlan.id,
      ownerId: eng1.id,
    },
  });

  const tcFlightStability = await prisma.testCase.create({
    data: {
      title: "Flight stability at wind threshold",
      testType: "FLIGHT",
      status: "IN_PROGRESS",
      objective:
        "Assess drone attitude stability and position hold accuracy at maximum rated wind speed (35 km/h) across all cardinal headings.",
      parameters: {
        maxWindSpeedKmh: 35,
        testAltitudeMeters: 50,
        positionHoldToleranceMeters: 1.5,
        headings: ["N", "E", "S", "W"],
      },
      passCriteria:
        "Position deviation < 1.5m in all headings at 35 km/h wind. No attitude oscillations > 5 degrees.",
      steps: [
        "Pre-flight check and calibration",
        "Ascend to 50m test altitude",
        "Enter position hold mode",
        "Rotate to each cardinal heading (N, E, S, W)",
        "Hold each heading for 3 minutes under wind load",
        "Record position deviation and attitude angles",
        "Descend and land",
      ],
      componentId: droneAlpha.id,
      testPlanId: releasePlan.id,
      ownerId: eng1.id,
    },
  });

  const tcBatteryCompliance = await prisma.testCase.create({
    data: {
      title: "Battery thermal compliance",
      testType: "COMPLIANCE",
      status: "PLANNED",
      objective:
        "Verify that the Battery Management System maintains cell temperature within regulatory limits (0°C–45°C) during charge, discharge, and peak draw cycles.",
      parameters: {
        regulatoryLimitMinCelsius: 0,
        regulatoryLimitMaxCelsius: 45,
        chargeRateC: 1.0,
        dischargeRateC: 2.0,
        peakDrawAmps: 30,
      },
      passCriteria:
        "Cell temperature stays within 0–45°C across all test conditions. Cell balance delta < 20mV.",
      steps: [
        "Connect BMS to test rig with thermal monitoring",
        "Execute charge cycle at 1C rate",
        "Record max cell temperature during charge",
        "Execute discharge cycle at 2C rate",
        "Record max cell temperature during discharge",
        "Apply peak draw of 30A for 60 seconds",
        "Record max cell temperature during peak draw",
        "Verify all temperatures within regulatory limits",
      ],
      componentId: batteryMgmt.id,
      testPlanId: compliancePlan.id,
      ownerId: eng2.id,
    },
  });

  const tcNavLoadTest = await prisma.testCase.create({
    data: {
      title: "Navigation software load test",
      testType: "FUNCTIONAL",
      status: "PLANNED",
      objective:
        "Stress test the Navigation Software v2.3.1 with concurrent waypoint recalculations, obstacle avoidance inputs, and telemetry streaming at maximum data rate.",
      parameters: {
        concurrentWaypoints: 250,
        targetResponseTimeMs: 50,
        soakTestDurationHours: 4,
        maxCpuUtilizationPercent: 80,
      },
      passCriteria:
        "Response time < 50ms at p99. No memory leaks over 4-hour soak. CPU utilization < 80%.",
      steps: [
        "Deploy Nav Software v2.3.1 to test environment",
        "Configure 250 concurrent waypoint recalculation streams",
        "Enable obstacle avoidance inputs at max rate",
        "Enable telemetry streaming at max data rate",
        "Run soak test for 4 hours",
        "Monitor response times, memory, and CPU throughout",
        "Analyze results for memory leaks or degradation",
      ],
      componentId: navSoftware.id,
      testPlanId: releasePlan.id,
      ownerId: eng2.id,
    },
  });

  const tcMotorVibration = await prisma.testCase.create({
    data: {
      title: "Motor vibration analysis",
      testType: "MAINTENANCE",
      status: "IN_PROGRESS",
      objective:
        "Capture and analyse vibration frequency spectrum of Motor Assembly Unit-07 at idle, 50%, 75%, and 100% throttle to detect bearing wear signatures.",
      parameters: {
        throttleLevels: ["idle", "50%", "75%", "100%"],
        expectedMaxHz: 120,
        sensorType: "accelerometer",
        samplingRateHz: 10000,
      },
      passCriteria:
        "Vibration harmonics at 100% throttle < 120 Hz. No bearing wear signatures detected.",
      steps: [
        "Mount accelerometer on motor housing",
        "Configure data acquisition at 10kHz sampling",
        "Record vibration at idle for 60 seconds",
        "Ramp to 50% throttle and record for 60 seconds",
        "Ramp to 75% throttle and record for 60 seconds",
        "Ramp to 100% throttle and record for 60 seconds",
        "Analyze frequency spectrum for each level",
        "Compare against baseline and wear thresholds",
      ],
      componentId: motorAssembly.id,
      testPlanId: maintenancePlan.id,
      ownerId: eng1.id,
    },
  });

  const tcFirmwareRollback = await prisma.testCase.create({
    data: {
      title: "Firmware rollback procedure",
      testType: "REGRESSION",
      status: "DRAFT",
      objective:
        "Validate that Flight Controller firmware can be safely rolled back from v3.2 to v3.1.x without data loss or requiring recalibration.",
      parameters: {
        fromVersion: "3.2",
        toVersion: "3.1.4",
        rollbackMethod: "OTA",
      },
      passCriteria:
        "Rollback completes without errors. Sensor calibration data preserved. No recalibration needed.",
      steps: [
        "Record current sensor calibration on v3.2",
        "Initiate OTA rollback to v3.1.4",
        "Verify rollback success and version number",
        "Check sensor calibration data integrity",
        "Run basic flight readiness checks",
        "Verify no data loss in flight logs",
      ],
      componentId: flightController.id,
      testPlanId: releasePlan.id,
      ownerId: eng1.id,
    },
  });

  console.log("  Created 11 test cases (including forks)");

  // ---------------------------------------------------------------------------
  // Test Runs
  // ---------------------------------------------------------------------------

  // Run 1 — Motor endurance — PASSED
  await prisma.testRun.create({
    data: {
      testCaseId: tcMotorEndurance.id,
      status: "PASSED",
      environment: "BENCH",
      loggedById: eng1.id,
      componentId: motorAssembly.id,
      notes: "Motor sustained max load for 120 minutes without anomaly.",
      measuredValues: {
        temperaturePeakCelsius: 78.3,
        avgRpm: 8420,
        vibrationAmplitudeMm: 0.04,
        voltageDropV: 0.12,
        testDurationMinutes: 120,
      },
    },
  });

  // Run 2 — Motor endurance high temp fork — FAILED
  const runMotorHighTemp = await prisma.testRun.create({
    data: {
      testCaseId: tcMotorEnduranceHighTemp.id,
      status: "FAILED",
      environment: "BENCH",
      loggedById: eng1.id,
      componentId: motorAssembly.id,
      notes:
        "Motor exceeded thermal threshold at 96 minutes. Emergency shutdown triggered at 105°C bearing temperature.",
      measuredValues: {
        ambientTemperatureCelsius: 55,
        temperaturePeakCelsius: 105.7,
        avgRpm: 8105,
        vibrationAmplitudeMm: 0.09,
        shutdownTriggered: true,
        timeToShutdownMinutes: 96,
      },
    },
  });

  // Run 3 — GPS failover — PASSED
  const runGpsFailover = await prisma.testRun.create({
    data: {
      testCaseId: tcGpsFailover.id,
      status: "PASSED",
      environment: "SIMULATION",
      loggedById: eng2.id,
      componentId: gpsModule.id,
      notes:
        "Failover to inertial navigation completed in 1.2 seconds. Position drift within acceptable 0.5m tolerance after 30 seconds.",
      measuredValues: {
        failoverTimeSec: 1.2,
        positionDriftMeters: 0.34,
        inertialNavAccuracyPercent: 97.8,
        signalRecoveryTimeSec: 4.6,
      },
    },
  });

  // Run 4 — Firmware regression — PASSED
  await prisma.testRun.create({
    data: {
      testCaseId: tcFirmwareRegression.id,
      status: "PASSED",
      environment: "LAB",
      loggedById: eng1.id,
      componentId: flightController.id,
      notes:
        "All 47 regression checks passed. Sensor calibration data persisted correctly through OTA update.",
      measuredValues: {
        totalChecks: 47,
        passedChecks: 47,
        failedChecks: 0,
        calibrationDriftPercent: 0.02,
        comBusLatencyMs: 3.1,
      },
    },
  });

  // Run 5 — Flight stability — IN_PROGRESS
  await prisma.testRun.create({
    data: {
      testCaseId: tcFlightStability.id,
      status: "IN_PROGRESS",
      environment: "FIELD",
      loggedById: eng1.id,
      componentId: droneAlpha.id,
      location: "Test Range Alpha, Bangalore",
      notes:
        "Test underway. Completed north and east headings; south and west headings pending weather window.",
      flightData: {
        altitudeMeters: 50,
        groundSpeedKmh: 0,
        windSpeedKmh: 33.4,
        durationMinutes: 42,
        coordinates: {
          takeoff: { lat: 12.9716, lng: 77.5946 },
          current: { lat: 12.9718, lng: 77.5948 },
        },
        headingsCompleted: ["N", "E"],
        headingsPending: ["S", "W"],
        maxPositionDeviationMeters: 1.12,
      },
      weatherData: {
        temperatureCelsius: 31,
        humidityPercent: 62,
        windSpeedKmh: 33.4,
        windDirection: "NW",
        visibility: "clear",
      },
    },
  });

  // Run 6 — Battery compliance — PASSED
  await prisma.testRun.create({
    data: {
      testCaseId: tcBatteryCompliance.id,
      status: "PASSED",
      environment: "LAB",
      loggedById: eng2.id,
      componentId: batteryMgmt.id,
      notes:
        "All thermal limits respected across charge, discharge, and peak draw cycles. Maximum cell temperature recorded at 41.2°C during peak draw.",
      measuredValues: {
        chargeTempMaxCelsius: 38.4,
        dischargeTempMaxCelsius: 39.7,
        peakDrawTempMaxCelsius: 41.2,
        regulatoryLimitCelsius: 45,
        cellBalanceDeltamV: 12,
        cyclesCompleted: 15,
      },
    },
  });

  // Run 7 — Motor vibration — FAILED
  const runMotorVibration = await prisma.testRun.create({
    data: {
      testCaseId: tcMotorVibration.id,
      status: "FAILED",
      environment: "BENCH",
      loggedById: eng1.id,
      componentId: motorAssembly.id,
      notes:
        "Anomalous vibration harmonic detected at 100% throttle — 142 Hz peak suggests early bearing wear. Recommend immediate inspection.",
      measuredValues: {
        idleVibrationHz: 22,
        fiftyPercentHz: 58,
        seventyFivePercentHz: 89,
        hundredPercentHz: 142,
        expectedHundredPercentHz: 115,
        bearingWearIndicator: "ALERT",
        rpmAtFailure: 8600,
      },
    },
  });

  // Run 8 — Navigation load test — PASSED
  const runNavLoad = await prisma.testRun.create({
    data: {
      testCaseId: tcNavLoadTest.id,
      status: "PASSED",
      environment: "SIMULATION",
      loggedById: eng2.id,
      componentId: navSoftware.id,
      notes:
        "Navigation software handled 250 concurrent waypoint recalculations with sub-50ms response time. No memory leaks detected over 4-hour soak test.",
      measuredValues: {
        concurrentWaypoints: 250,
        avgResponseTimeMs: 34,
        p99ResponseTimeMs: 48,
        memoryLeakDetected: false,
        soakTestDurationHours: 4,
        cpuUtilizationPercent: 72,
      },
    },
  });

  // Run 9 — Flight stability earlier run — PASSED (historical data)
  await prisma.testRun.create({
    data: {
      testCaseId: tcFlightStability.id,
      status: "PASSED",
      environment: "FIELD",
      loggedById: eng1.id,
      componentId: droneAlpha.id,
      location: "Test Range Alpha, Bangalore",
      runDate: new Date("2025-01-20"),
      notes:
        "Preliminary stability run at 25 km/h wind — all four headings completed successfully.",
      flightData: {
        altitudeMeters: 50,
        groundSpeedKmh: 0,
        windSpeedKmh: 25.0,
        durationMinutes: 68,
        coordinates: {
          takeoff: { lat: 12.9716, lng: 77.5946 },
          landing: { lat: 12.9716, lng: 77.5946 },
        },
        headingsCompleted: ["N", "E", "S", "W"],
        headingsPending: [],
        maxPositionDeviationMeters: 0.73,
      },
      weatherData: {
        temperatureCelsius: 28,
        humidityPercent: 55,
        windSpeedKmh: 25.0,
        windDirection: "E",
        visibility: "clear",
      },
    },
  });

  console.log("  Created 9 test runs");

  // ---------------------------------------------------------------------------
  // Issues
  // ---------------------------------------------------------------------------

  await prisma.issue.create({
    data: {
      title: "Motor bearing overheating under high-temperature conditions",
      description:
        "During the high-temperature variant of the motor endurance test, the motor exceeded its thermal threshold at 96 minutes with bearing temperature reaching 105.7°C. This poses a critical risk for operations in hot climates and must be resolved before deployment clearance.",
      severity: "CRITICAL",
      status: "OPEN",
      testRunId: runMotorHighTemp.id,
      componentId: motorAssembly.id,
      createdById: eng1.id,
      assigneeId: eng1.id,
    },
  });

  await prisma.issue.create({
    data: {
      title: "Anomalous vibration harmonic at full throttle",
      description:
        "Motor Assembly Unit-07 shows a 142 Hz vibration peak at 100% throttle — expected value is 115 Hz. This harmonic signature is consistent with early-stage bearing wear and requires physical inspection and possible replacement.",
      severity: "HIGH",
      status: "IN_PROGRESS",
      testRunId: runMotorVibration.id,
      componentId: motorAssembly.id,
      createdById: eng1.id,
      assigneeId: eng1.id,
    },
  });

  await prisma.issue.create({
    data: {
      title: "GPS failover position drift exceeds spec in edge cases",
      description:
        "While the primary GPS failover test passed, edge-case simulation with rapid altitude change during signal loss showed position drift of 1.8m — exceeding the 1.5m tolerance. Needs further investigation under combined loss scenarios.",
      severity: "HIGH",
      status: "IN_PROGRESS",
      testRunId: runGpsFailover.id,
      componentId: gpsModule.id,
      createdById: qa.id,
      assigneeId: eng2.id,
    },
  });

  await prisma.issue.create({
    data: {
      title: "Navigation software CPU utilization higher than target",
      description:
        "Load test showed 72% CPU utilization under peak conditions. While within operational limits, the target was 60%. Optimization deferred to v2.4.0 roadmap as it does not impact current release certification.",
      severity: "MEDIUM",
      status: "DEFERRED",
      deferredTo: "v2.4.0",
      testRunId: runNavLoad.id,
      componentId: navSoftware.id,
      createdById: eng2.id,
      assigneeId: eng2.id,
    },
  });

  console.log("  Created 4 issues");

  // ---------------------------------------------------------------------------
  // Archive — v2.2.0 Release Certification (concluded)
  // ---------------------------------------------------------------------------

  const archive = await prisma.archive.create({
    data: {
      title: "v2.2.0 Release Certification",
      category: "RELEASE_CERTIFICATION",
      outcome: "PASSED",
      archivedById: qa.id,
      releaseTag: "v2.2.0",
      summary:
        "Release certification for Navigation Software v2.2.0 completed successfully. All critical and high-priority test cases passed. Two low-severity findings documented and accepted with dispositions.",
      findings: [
        {
          findingId: "F-2024-001",
          description:
            "Minor telemetry timestamp jitter of ±3ms observed under high CPU load. Within acceptable tolerance for v2.2.0 release.",
          severity: "LOW",
          disposition: "ACCEPTED",
        },
        {
          findingId: "F-2024-002",
          description:
            "Waypoint upload latency increases by 12% when more than 200 waypoints are queued. Documented as known limitation.",
          severity: "LOW",
          disposition: "ACCEPTED",
        },
        {
          findingId: "F-2024-003",
          description:
            "All flight envelope tests passed within specification. No anomalies detected across 14 test flights.",
          severity: "INFO",
          disposition: "NOTED",
        },
      ],
      attachments: [
        "v2.2.0-test-report.pdf",
        "flight-logs-certification.zip",
        "sensor-calibration-data.csv",
      ],
      tags: ["release", "v2.2.0", "certification", "navigation", "passed"],
      searchIndex:
        "v2.2.0 Release Certification RELEASE_CERTIFICATION PASSED Navigation Software telemetry jitter waypoint latency flight envelope certification release",
    },
  });

  // Link archive to relevant test cases via ArchiveTestCase
  await prisma.archiveTestCase.createMany({
    data: [
      { archiveId: archive.id, testCaseId: tcFirmwareRegression.id, wasCanonical: true },
      { archiveId: archive.id, testCaseId: tcNavLoadTest.id, wasCanonical: true },
      { archiveId: archive.id, testCaseId: tcFlightStability.id, wasCanonical: false },
      { archiveId: archive.id, testCaseId: tcGpsFailover.id, wasCanonical: true },
    ],
  });

  console.log("  Created archive with 4 linked test cases");

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------

  console.log("\nSeed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
