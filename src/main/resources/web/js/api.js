/**
 * CampusPulse - Centralized Data Adapter (js/api.js)
 * University Network Programming Assignment 02
 *
 * This adapter decouples the UI from data fetching details.
 * It provides a single point of interaction for rooms, alerts, and system health.
 *
 * CONFIGURATION SWITCH:
 * - Toggle `API_CONFIG.useMockData` to true or false.
 * - When true: serves realistic mock data from js/mock-data.js.
 * - When false: calls GET /api/rooms, GET /api/alerts, and GET /api/health.
 *
 * Notice: When opened directly via file:// in a browser, mock mode is automatically
 * active to avoid browser security / CORS restrictions on local file fetches.
 */

(function (window) {
  'use strict';

  // Master Configuration
  const API_CONFIG = {
    // Flag to switch between Mock and Live HTTP API
    // Default is true so frontend works immediately before Java backend is launched
    useMockData: true,

    // Base URL for API endpoints.
    // When served by Java HttpServer at port 8080, '' uses the same origin.
    // If running frontend on another port during testing, e.g. 'http://localhost:8080'
    apiBaseUrl: '',

    // Network request timeout in milliseconds
    timeoutMs: 5000
  };

  // Check saved preference in localStorage (if supported by environment)
  try {
    const savedMode = localStorage.getItem('campuspulse_use_mock');
    if (savedMode !== null) {
      API_CONFIG.useMockData = savedMode === 'true';
    }
  } catch (e) {
    // localStorage may be disabled in some file:// sandboxes
  }

  // Force mock mode if opened via file:// protocol
  if (window.location && window.location.protocol === 'file:') {
    API_CONFIG.useMockData = true;
  }

  /**
   * Helper to perform fetch with a timeout
   */
  async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          ...(options.headers || {})
        }
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  /**
   * Safe Room Schema Normalizer
   * Protects UI against missing backend fields or inconsistent data
   */
  function normalizeRoom(r, index) {
    if (!r || typeof r !== 'object') {
      return {
        id: 'UNKNOWN-' + (index + 1),
        name: 'Unknown Room',
        building: 'General Campus',
        floor: '-',
        temperature: 0.0,
        occupancy: 0,
        capacity: 1,
        humidity: 0,
        status: 'NORMAL',
        lastUpdated: new Date().toISOString(),
        sensorId: 'UNKNOWN'
      };
    }

    const temp = typeof r.temperature === 'number' ? r.temperature : parseFloat(r.temperature) || 0.0;
    const occ = typeof r.occupancy === 'number' ? r.occupancy : parseInt(r.occupancy, 10) || 0;
    const cap = typeof r.capacity === 'number' ? r.capacity : parseInt(r.capacity, 10) || 30;
    
    // Status normalization: NORMAL, WARNING, CRITICAL
    let status = (r.status || '').toUpperCase();
    if (status !== 'NORMAL' && status !== 'WARNING' && status !== 'CRITICAL') {
      if (temp >= 35.0) {
        status = 'CRITICAL';
      } else if (temp >= 28.0 || (cap > 0 && (occ / cap) >= 0.85)) {
        status = 'WARNING';
      } else {
        status = 'NORMAL';
      }
    }

    return {
      id: String(r.id || 'RM-' + (index + 1)),
      name: String(r.name || ('Campus Room ' + (r.id || ''))),
      building: String(r.building || 'Campus Facility'),
      floor: String(r.floor || 'Ground Floor'),
      temperature: Math.round(temp * 10) / 10,
      occupancy: Math.max(0, occ),
      capacity: Math.max(1, cap),
      humidity: typeof r.humidity === 'number' ? r.humidity : (parseInt(r.humidity, 10) || 45),
      status: status,
      lastUpdated: r.lastUpdated || r.timestamp || new Date().toISOString(),
      sensorId: String(r.sensorId || ('UDP-' + (r.id || 'SENS'))),
      notes: r.notes || ''
    };
  }

  /**
   * Safe Alert Schema Normalizer
   */
  function normalizeAlert(a, index) {
    if (!a || typeof a !== 'object') {
      return {
        id: 'ALT-' + (index + 1),
        severity: 'INFO',
        source: 'System',
        room: 'General',
        message: 'Empty or malformed alert event',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        acknowledgedBy: null
      };
    }

    let sev = (a.severity || 'INFO').toUpperCase();
    if (sev !== 'CRITICAL' && sev !== 'WARNING' && sev !== 'INFO') {
      sev = 'INFO';
    }

    return {
      id: String(a.id || ('ALT-' + (index + 1))),
      severity: sev,
      source: String(a.source || 'Central System'),
      room: String(a.room || a.roomId || 'All'),
      message: String(a.message || 'Notification recorded'),
      timestamp: a.timestamp || new Date().toISOString(),
      acknowledged: Boolean(a.acknowledged),
      acknowledgedBy: a.acknowledgedBy ? String(a.acknowledgedBy) : null
    };
  }

  /**
   * Safe Health Normalizer
   */
  function normalizeHealth(h) {
    if (!h || typeof h !== 'object') {
      return createUnavailableHealth('Backend returned invalid health payload');
    }

    const defaultServices = {
      tcp: {
        name: 'TCP Socket Command Service',
        status: 'UNKNOWN',
        port: 6000,
        owner: 'Member 1',
        concept: 'TCP Socket Programming',
        role: 'Reliable staff incident reporting & acknowledgment socket (ServerSocket).',
        lastActivity: 'No data from server'
      },
      udp: {
        name: 'UDP Sensor Telemetry Listener',
        status: 'UNKNOWN',
        port: 6001,
        owner: 'Member 2',
        concept: 'UDP Networking',
        role: 'Fast datagram ingestion for room sensor metrics (DatagramSocket).',
        lastActivity: 'No data from server'
      },
      multicast: {
        name: 'IP Multicast Alert Publisher',
        status: 'UNKNOWN',
        group: '230.0.0.1:4446',
        owner: 'Member 3',
        concept: 'IP Multicasting',
        role: 'Emergency alert distribution group broadcasting critical notices.',
        lastActivity: 'No data from server'
      },
      concurrency: {
        name: 'Multithreaded Server Engine',
        status: 'UNKNOWN',
        details: 'ExecutorService worker pool',
        owner: 'Member 4',
        concept: 'Multithreaded Server Applications',
        role: 'Concurrent client connection handling and thread-safe shared state.',
        lastActivity: 'No data from server'
      },
      http: {
        name: 'HTTP API & Web Services',
        status: 'UP',
        port: 8080,
        owner: 'Member 5',
        concept: 'HTTP & Web Services',
        role: 'JDK HttpServer serving REST endpoints and web dashboard assets.',
        lastActivity: 'Delivered health payload'
      }
    };

    const s = h.services || {};

    return {
      status: (h.status || 'UP').toUpperCase(),
      timestamp: h.timestamp || new Date().toISOString(),
      uptimeSeconds: typeof h.uptimeSeconds === 'number' ? h.uptimeSeconds : 0,
      uptimeFormatted: h.uptimeFormatted || h.uptime || 'Unknown',
      serverVersion: h.serverVersion || 'CampusPulse Java Core',
      activeSensors: typeof h.activeSensors === 'number' ? h.activeSensors : 0,
      activeAlertsCount: typeof h.activeAlertsCount === 'number' ? h.activeAlertsCount : 0,
      services: {
        tcp: { ...defaultServices.tcp, ...(s.tcp || {}) },
        udp: { ...defaultServices.udp, ...(s.udp || {}) },
        multicast: { ...defaultServices.multicast, ...(s.multicast || {}) },
        concurrency: { ...defaultServices.concurrency, ...(s.concurrency || {}) },
        http: { ...defaultServices.http, ...(s.http || {}) }
      }
    };
  }

  /**
   * Creates an explicit UNAVAILABLE health payload when backend cannot be reached
   */
  function createUnavailableHealth(reason) {
    return {
      status: 'UNAVAILABLE',
      isOffline: true,
      timestamp: new Date().toISOString(),
      uptimeFormatted: 'Backend Disconnected',
      uptimeSeconds: 0,
      serverVersion: 'Java Backend Offline / Not Found',
      errorReason: reason || 'Connection to server failed. Start the Java backend at http://localhost:8080',
      activeSensors: 0,
      activeAlertsCount: 0,
      services: {
        tcp: {
          name: 'TCP Socket Command Service',
          status: 'UNAVAILABLE',
          port: 6000,
          owner: 'Member 1',
          concept: 'TCP Socket Programming',
          role: 'Reliable staff incident reporting & acknowledgment socket (ServerSocket).',
          lastActivity: 'No connection to backend'
        },
        udp: {
          name: 'UDP Sensor Telemetry Listener',
          status: 'UNAVAILABLE',
          port: 6001,
          owner: 'Member 2',
          concept: 'UDP Networking',
          role: 'Fast datagram ingestion for room sensor metrics (DatagramSocket).',
          lastActivity: 'No connection to backend'
        },
        multicast: {
          name: 'IP Multicast Alert Publisher',
          status: 'UNAVAILABLE',
          group: '230.0.0.1:4446',
          owner: 'Member 3',
          concept: 'IP Multicasting',
          role: 'Emergency alert distribution group broadcasting critical notices.',
          lastActivity: 'No connection to backend'
        },
        concurrency: {
          name: 'Multithreaded Server Engine',
          status: 'UNAVAILABLE',
          details: 'Thread pool unavailable',
          owner: 'Member 4',
          concept: 'Multithreaded Server Applications',
          role: 'Concurrent client connection handling and thread-safe shared state.',
          lastActivity: 'No connection to backend'
        },
        http: {
          name: 'HTTP API & Web Services',
          status: 'UNAVAILABLE',
          port: 8080,
          owner: 'Member 5',
          concept: 'HTTP & Web Services',
          role: 'JDK HttpServer serving REST endpoints and web dashboard assets.',
          lastActivity: 'Connection refused / Unreachable'
        }
      }
    };
  }

  // Centralized CampusPulse API Object
  const CampusPulseAPI = {
    /**
     * Fetch Room Telemetry
     * @returns {Promise<Array>} Array of normalized room objects
     */
    async getRooms() {
      if (API_CONFIG.useMockData) {
        if (!window.CampusPulseMock) {
          throw new Error('CampusPulseMock not loaded. Ensure js/mock-data.js is included.');
        }
        return window.CampusPulseMock.getRooms().map(normalizeRoom);
      }

      // HTTP Mode: GET /api/rooms
      const url = (API_CONFIG.apiBaseUrl || '') + '/api/rooms';
      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText} while fetching ${url}`);
        }
        const data = await response.json();
        const roomsList = Array.isArray(data) ? data : (data.rooms || []);
        return roomsList.map(normalizeRoom);
      } catch (err) {
        console.warn('[CampusPulse API] Failed to fetch rooms from live backend:', err.message);
        throw new Error(`Unable to load rooms from ${url} (${err.message}). Is the Java server running?`);
      }
    },

    /**
     * Fetch Alert Incidents
     * @returns {Promise<Array>} Array of normalized alert objects
     */
    async getAlerts() {
      if (API_CONFIG.useMockData) {
        if (!window.CampusPulseMock) {
          throw new Error('CampusPulseMock not loaded. Ensure js/mock-data.js is included.');
        }
        return window.CampusPulseMock.getAlerts().map(normalizeAlert);
      }

      // HTTP Mode: GET /api/alerts
      const url = (API_CONFIG.apiBaseUrl || '') + '/api/alerts';
      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText} while fetching ${url}`);
        }
        const data = await response.json();
        const alertsList = Array.isArray(data) ? data : (data.alerts || []);
        return alertsList.map(normalizeAlert);
      } catch (err) {
        console.warn('[CampusPulse API] Failed to fetch alerts from live backend:', err.message);
        throw new Error(`Unable to load alerts from ${url} (${err.message}). Is the Java server running?`);
      }
    },

    /**
     * Fetch System Health and Service Status
     * @returns {Promise<Object>} Normalized health status
     */
    async getHealth() {
      if (API_CONFIG.useMockData) {
        if (!window.CampusPulseMock) {
          return createUnavailableHealth('Mock data module unavailable');
        }
        return normalizeHealth(window.CampusPulseMock.getHealth());
      }

      // HTTP Mode: GET /api/health
      const url = (API_CONFIG.apiBaseUrl || '') + '/api/health';
      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
          return createUnavailableHealth(`HTTP ${response.status} from ${url}`);
        }
        const data = await response.json();
        return normalizeHealth(data);
      } catch (err) {
        console.warn('[CampusPulse API] Live health check failed:', err.message);
        return createUnavailableHealth(`Failed to connect to ${url}: ${err.message}`);
      }
    },

    /**
     * Simulate Sensor Telemetry Update (Mock mode testing aid)
     */
    simulateSensorUpdate() {
      if (!API_CONFIG.useMockData) {
        return {
          success: false,
          message: 'Simulation action is disabled in HTTP Live Mode. Readings are generated by real Java UDP sensor clients.'
        };
      }
      if (window.CampusPulseMock && typeof window.CampusPulseMock.simulateSensorUpdate === 'function') {
        const result = window.CampusPulseMock.simulateSensorUpdate();
        return {
          success: true,
          ...result
        };
      }
      return {
        success: false,
        message: 'Mock simulation handler is not available.'
      };
    },

    /**
     * Check if currently in Mock Data mode
     */
    isMockMode() {
      return Boolean(API_CONFIG.useMockData);
    },

    /**
     * Set Mock Data mode explicitly
     */
    setMockMode(enableMock) {
      API_CONFIG.useMockData = Boolean(enableMock);
      try {
        localStorage.setItem('campuspulse_use_mock', String(API_CONFIG.useMockData));
      } catch (e) {
        // Ignore storage exceptions
      }
    },

    /**
     * Get active API configuration
     */
    getConfig() {
      return { ...API_CONFIG };
    },

    /**
     * Set Base URL for HTTP mode
     */
    setBaseUrl(url) {
      API_CONFIG.apiBaseUrl = (url || '').trim().replace(/\/+$/, '');
    }
  };

  // Expose on global window object
  window.CampusPulseAPI = CampusPulseAPI;
})(typeof window !== 'undefined' ? window : this);
