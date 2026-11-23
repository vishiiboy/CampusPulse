/**
 * CampusPulse - Mock Data Store
 * University Network Programming Assignment 02
 *
 * This file provides standalone, realistic mock data for local frontend testing
 * before the central Java backend (TCP, UDP, Multicast, Concurrency, HTTP) is running.
 *
 * IMPORTANT: This data simulates in-memory server state. It does NOT execute real
 * network traffic (no simulated sockets or fake protocols).
 */

(function (window) {
  'use strict';

  // Base timestamp offset generator for realistic relative timestamps
  function getRecentIsoString(minutesAgo) {
    return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  }

  // Initial Rooms dataset representing campus facilities
  // Rule note from README: Temperature >= 35.0°C triggers WARNING/CRITICAL
  const initialRooms = [
    {
      id: 'B201',
      name: 'Chemical Sciences Lab B201',
      building: 'Science Complex B',
      floor: '2nd Floor',
      temperature: 36.8,
      occupancy: 24,
      capacity: 30,
      humidity: 48,
      status: 'CRITICAL',
      lastUpdated: getRecentIsoString(1),
      sensorId: 'UDP-SENS-B201',
      notes: 'Threshold breach: temp >= 35.0°C'
    },
    {
      id: 'A102',
      name: 'Main Lecture Auditorium A102',
      building: 'Academic Tower A',
      floor: '1st Floor',
      temperature: 21.8,
      occupancy: 118,
      capacity: 150,
      humidity: 52,
      status: 'NORMAL',
      lastUpdated: getRecentIsoString(3),
      sensorId: 'UDP-SENS-A102',
      notes: 'Operational at normal capacity'
    },
    {
      id: 'C305',
      name: 'Central Datacenter / Server Room C305',
      building: 'Computing Center C',
      floor: '3rd Floor',
      temperature: 28.4,
      occupancy: 2,
      capacity: 6,
      humidity: 35,
      status: 'WARNING',
      lastUpdated: getRecentIsoString(5),
      sensorId: 'UDP-SENS-C305',
      notes: 'Elevated ambient temperature'
    },
    {
      id: 'L101',
      name: 'Quiet Study Hall L101',
      building: 'University Library L',
      floor: '1st Floor',
      temperature: 22.1,
      occupancy: 76,
      capacity: 100,
      humidity: 46,
      status: 'NORMAL',
      lastUpdated: getRecentIsoString(2),
      sensorId: 'UDP-SENS-L101',
      notes: 'Normal study environment'
    },
    {
      id: 'E402',
      name: 'Robotics & Hardware Lab E402',
      building: 'Engineering Hall E',
      floor: '4th Floor',
      temperature: 24.5,
      occupancy: 22,
      capacity: 25,
      humidity: 41,
      status: 'NORMAL',
      lastUpdated: getRecentIsoString(4),
      sensorId: 'UDP-SENS-E402',
      notes: 'High occupancy near capacity'
    },
    {
      id: 'S105',
      name: 'Student Activities Center S105',
      building: 'Student Union S',
      floor: '1st Floor',
      temperature: 23.2,
      occupancy: 42,
      capacity: 80,
      humidity: 54,
      status: 'NORMAL',
      lastUpdated: getRecentIsoString(6),
      sensorId: 'UDP-SENS-S105',
      notes: 'Standard recreational traffic'
    }
  ];

  // Initial Alerts dataset matching the five networking components
  const initialAlerts = [
    {
      id: 'ALT-1001',
      severity: 'CRITICAL',
      source: 'UDP Sensor Rule',
      room: 'B201',
      message: 'High temperature detected: 36.8°C exceeds critical threshold (35.0°C)',
      timestamp: getRecentIsoString(8),
      acknowledged: false,
      acknowledgedBy: null
    },
    {
      id: 'ALT-1002',
      severity: 'CRITICAL',
      source: 'TCP Staff Report',
      room: 'B201',
      message: 'Staff incident reported: Exhaust ventilation malfunction in fume hood',
      timestamp: getRecentIsoString(22),
      acknowledged: false,
      acknowledgedBy: null
    },
    {
      id: 'ALT-1003',
      severity: 'WARNING',
      source: 'UDP Sensor Rule',
      room: 'C305',
      message: 'Datacenter thermal alert: Rack temperature 28.4°C approaching upper limit',
      timestamp: getRecentIsoString(45),
      acknowledged: true,
      acknowledgedBy: 'Staff Client #4 (TCP)'
    },
    {
      id: 'ALT-1004',
      severity: 'INFO',
      source: 'Multicast Listener',
      room: 'A102',
      message: 'Routine emergency multicast beacon test broadcasted to group 230.0.0.1:4446',
      timestamp: getRecentIsoString(90),
      acknowledged: true,
      acknowledgedBy: 'System Auto-Log'
    },
    {
      id: 'ALT-1005',
      severity: 'WARNING',
      source: 'TCP Staff Report',
      room: 'E402',
      message: 'Safety limit notice: Room occupancy reached 88% of rated fire safety limit',
      timestamp: getRecentIsoString(140),
      acknowledged: true,
      acknowledgedBy: 'Staff Client #1 (TCP)'
    }
  ];

  // Initial System Health dataset detailing all 5 project modules
  const initialHealth = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: 14280,
    uptimeFormatted: '3h 58m 00s',
    serverVersion: 'CampusPulse Java Core 1.0.0 (JDK 17+)',
    activeSensors: 6,
    activeAlertsCount: 2,
    services: {
      tcp: {
        name: 'TCP Socket Command Service',
        status: 'UP',
        port: 6000,
        owner: 'Member 1',
        concept: 'TCP Socket Programming',
        role: 'Accepts staff incident reports (INCIDENT|...) and acknowledgment commands. Provides reliable bidirectional communication using java.net.ServerSocket.',
        lastActivity: 'TCP command ACK|ALT-1003 processed successfully'
      },
      udp: {
        name: 'UDP Sensor Telemetry Listener',
        status: 'UP',
        port: 6001,
        owner: 'Member 2',
        concept: 'UDP Networking',
        role: 'Ingests high-frequency room telemetry packets (SENSOR|room|TEMP|val|time) using DatagramSocket and DatagramPacket. Validates packet checksum and formats.',
        lastActivity: 'Packet received from SENSOR|B201|TEMP|36.8'
      },
      multicast: {
        name: 'IP Multicast Alert Publisher',
        status: 'UP',
        group: '230.0.0.1:4446',
        owner: 'Member 3',
        concept: 'IP Multicasting',
        role: 'Broadcasts emergency warning alerts to all subscribed receiver nodes simultaneously using MulticastSocket joinGroup / send operations.',
        lastActivity: 'Multicast packet published to 230.0.0.1:4446'
      },
      concurrency: {
        name: 'Multithreaded Server Engine',
        status: 'UP',
        details: 'ThreadPoolExecutor: 8 active worker threads',
        owner: 'Member 4',
        concept: 'Multithreaded Server Applications',
        role: 'Manages concurrent TCP client connections and UDP listener pipelines with ExecutorService and thread-safe collections (ConcurrentHashMap).',
        lastActivity: 'Pool capacity: 8 threads, 0 queued tasks'
      },
      http: {
        name: 'HTTP API & Web Services',
        status: 'UP',
        port: 8080,
        owner: 'Member 5',
        concept: 'HTTP & Web Services',
        role: 'JDK com.sun.net.httpserver.HttpServer delivering JSON endpoints (/api/rooms, /api/alerts, /api/health) and serving static web dashboard assets.',
        lastActivity: 'Served GET /api/rooms (200 OK)'
      }
    }
  };

  // In-memory working copy for simulation
  let roomsData = JSON.parse(JSON.stringify(initialRooms));
  let alertsData = JSON.parse(JSON.stringify(initialAlerts));
  let alertCounter = 1006;

  // Deep clone helper
  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  // Public Mock Data API
  const MockDataStore = {
    /**
     * Return copy of current mock rooms
     */
    getRooms: function () {
      return clone(roomsData);
    },

    /**
     * Return copy of current mock alerts
     */
    getAlerts: function () {
      return clone(alertsData);
    },

    /**
     * Return copy of mock system health
     */
    getHealth: function () {
      const health = clone(initialHealth);
      health.timestamp = new Date().toISOString();
      const activeCritical = alertsData.filter(function (a) { return !a.acknowledged; }).length;
      health.activeAlertsCount = activeCritical;
      health.status = activeCritical > 0 ? 'UP' : 'UP';
      return health;
    },

    /**
     * Simulate a sensor reading update (Frontend Demonstration Aid).
     * Modifies one room's values and conditionally creates an alert if a rule is triggered.
     * This is clearly labeled as a frontend simulation helper.
     */
    simulateSensorUpdate: function () {
      // Pick a random room to update
      const roomIndex = Math.floor(Math.random() * roomsData.length);
      const targetRoom = roomsData[roomIndex];

      // Fluctuate temperature (-0.6 to +0.8) and occupancy (-2 to +3)
      const tempDelta = (Math.random() * 1.4 - 0.6);
      const newTemp = Math.round((targetRoom.temperature + tempDelta) * 10) / 10;
      
      const occDelta = Math.floor(Math.random() * 6) - 2;
      const newOcc = Math.max(0, Math.min(targetRoom.capacity, targetRoom.occupancy + occDelta));

      targetRoom.temperature = newTemp;
      targetRoom.occupancy = newOcc;
      targetRoom.lastUpdated = new Date().toISOString();

      // Apply campus demo rules
      let newAlert = null;
      if (newTemp >= 35.0) {
        targetRoom.status = 'CRITICAL';
        targetRoom.notes = 'Thermal breach: >= 35.0°C';

        // Check if active alert already exists for this room
        const existing = alertsData.find(function (a) {
          return a.room === targetRoom.id && a.severity === 'CRITICAL' && !a.acknowledged;
        });

        if (!existing) {
          newAlert = {
            id: 'ALT-' + (alertCounter++),
            severity: 'CRITICAL',
            source: 'UDP Sensor Rule',
            room: targetRoom.id,
            message: 'High temperature alert: ' + newTemp + '°C exceeds safety threshold (35.0°C)',
            timestamp: new Date().toISOString(),
            acknowledged: false,
            acknowledgedBy: null
          };
          alertsData.unshift(newAlert);
        }
      } else if (newTemp >= 28.0 || (newOcc / targetRoom.capacity) >= 0.85) {
        targetRoom.status = 'WARNING';
        targetRoom.notes = newTemp >= 28.0 ? 'Elevated temperature' : 'High occupancy density';
      } else {
        targetRoom.status = 'NORMAL';
        targetRoom.notes = 'Nominal operating conditions';
      }

      return {
        updatedRoom: clone(targetRoom),
        newAlert: newAlert ? clone(newAlert) : null,
        message: 'Simulated reading for ' + targetRoom.id + ': ' + newTemp + '°C, ' + newOcc + ' occupants.'
      };
    },

    /**
     * Reset mock data to original pristine baseline
     */
    resetData: function () {
      roomsData = JSON.parse(JSON.stringify(initialRooms));
      alertsData = JSON.parse(JSON.stringify(initialAlerts));
      return {
        rooms: clone(roomsData),
        alerts: clone(alertsData)
      };
    }
  };

  // Expose on global window object
  window.CampusPulseMock = MockDataStore;
})(typeof window !== 'undefined' ? window : this);
