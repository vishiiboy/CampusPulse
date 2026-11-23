/**
 * CampusPulse - Application Controller (js/app.js)
 * University Network Programming Assignment 02
 *
 * Coordinates UI navigation, data presentation, filtering, and event handling.
 * Interacts exclusively with CampusPulseAPI (js/api.js).
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // Application State
  // -------------------------------------------------------------
  const state = {
    activeView: 'overview',
    rooms: [],
    alerts: [],
    health: null,
    isLoading: false,
    lastUpdated: null,

    // Filters for Rooms view
    roomsSearch: '',
    roomsStatus: 'ALL',
    roomsBuilding: 'ALL',

    // Filters for Alerts view
    alertsSearch: '',
    alertsSeverity: 'ALL'
  };

  // -------------------------------------------------------------
  // DOM Element References
  // -------------------------------------------------------------
  const dom = {
    // Navigation
    navOverview: document.getElementById('nav-btn-overview'),
    navRooms: document.getElementById('nav-btn-rooms'),
    navAlerts: document.getElementById('nav-btn-alerts'),
    navNetwork: document.getElementById('nav-btn-network'),
    navCounterRooms: document.getElementById('nav-counter-rooms'),
    navCounterAlerts: document.getElementById('nav-counter-alerts'),
    appSidebar: document.getElementById('app-sidebar'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),

    // Header controls
    pageTitle: document.getElementById('page-title'),
    mockBadge: document.getElementById('mock-badge'),
    mockBadgeText: document.getElementById('mock-badge-text'),
    modeToggleBtn: document.getElementById('mode-toggle-btn'),
    modeToggleLabel: document.getElementById('mode-toggle-label'),
    btnSimulate: document.getElementById('btn-simulate-reading'),
    btnRefresh: document.getElementById('btn-refresh-data'),
    headerClock: document.getElementById('header-clock'),

    // Global Banner
    globalBanner: document.getElementById('global-banner'),
    bannerMessage: document.getElementById('banner-message'),
    bannerActionBtn: document.getElementById('banner-action-btn'),

    // Toast Container
    toastContainer: document.getElementById('toast-container'),

    // View Sections
    viewOverview: document.getElementById('view-overview'),
    viewRooms: document.getElementById('view-rooms'),
    viewAlerts: document.getElementById('view-alerts'),
    viewNetwork: document.getElementById('view-network'),

    // Overview Elements
    campusStatusHeadline: document.getElementById('campus-status-headline'),
    campusStatusDesc: document.querySelector('.campus-status-desc'),
    envStatusPill: document.getElementById('env-status-pill'),
    kpiTotalRooms: document.getElementById('kpi-total-rooms'),
    kpiWarningRooms: document.getElementById('kpi-warning-rooms'),
    kpiActiveAlerts: document.getElementById('kpi-active-alerts'),
    kpiUnackSubtext: document.getElementById('kpi-unack-subtext'),
    kpiHealthStatus: document.getElementById('kpi-health-status'),
    kpiHealthUptime: document.getElementById('kpi-health-uptime'),
    overviewSensorHighlights: document.getElementById('overview-sensor-highlights'),
    overviewAlertsFeed: document.getElementById('overview-alerts-feed'),
    overviewViewAllRooms: document.getElementById('overview-view-all-rooms'),
    overviewViewAllAlerts: document.getElementById('overview-view-all-alerts'),

    // Rooms Elements
    roomsSearchInput: document.getElementById('rooms-search-input'),
    roomsStatusFilter: document.getElementById('rooms-status-filter'),
    roomsBuildingFilter: document.getElementById('rooms-building-filter'),
    roomsCountDisplay: document.getElementById('rooms-count-display'),
    roomsCardsContainer: document.getElementById('rooms-cards-container'),

    // Alerts Elements
    alertsSearchInput: document.getElementById('alerts-search-input'),
    alertsSeverityFilter: document.getElementById('alerts-severity-filter'),
    alertsCountDisplay: document.getElementById('alerts-count-display'),
    alertsTableBody: document.getElementById('alerts-table-body'),

    // Network Elements
    networkServicesGrid: document.getElementById('network-services-grid')
  };

  // -------------------------------------------------------------
  // Utility Functions
  // -------------------------------------------------------------

  /**
   * Safe HTML string escaper to protect against XSS
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Format ISO string or timestamp into a readable relative or time format
   */
  function formatRelativeTime(dateString) {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const now = new Date();
      const diffSeconds = Math.round((now - date) / 1000);

      if (diffSeconds < 45) return 'Just now';
      if (diffSeconds < 90) return '1 min ago';
      if (diffSeconds < 3600) return Math.round(diffSeconds / 60) + 'm ago';
      if (diffSeconds < 86400) return Math.round(diffSeconds / 3600) + 'h ago';
      
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Format standard time string
   */
  function formatExactTime(dateString) {
    if (!dateString) return '--:--:--';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Show non-intrusive toast feedback
   */
  function showToast(title, body, type = 'info') {
    if (!dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'success') {
      toast.style.borderLeftColor = 'var(--status-normal)';
    } else if (type === 'warning') {
      toast.style.borderLeftColor = 'var(--status-warning)';
    } else if (type === 'critical') {
      toast.style.borderLeftColor = 'var(--status-critical)';
    }

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-body">${escapeHtml(body)}</div>
      </div>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  /**
   * Update header clock
   */
  function updateHeaderClock() {
    if (dom.headerClock) {
      const now = new Date();
      dom.headerClock.textContent = now.toLocaleTimeString();
    }
  }

  // -------------------------------------------------------------
  // Navigation & View Routing
  // -------------------------------------------------------------
  const VIEW_TITLES = {
    overview: 'Operations Overview',
    rooms: 'Campus Rooms & Telemetry',
    alerts: 'Incident & Warning Alerts',
    network: 'Network Services Status'
  };

  function switchView(viewName) {
    if (!VIEW_TITLES[viewName]) return;
    state.activeView = viewName;

    // Update Nav Buttons
    [dom.navOverview, dom.navRooms, dom.navAlerts, dom.navNetwork].forEach(btn => {
      if (!btn) return;
      const isActive = btn.getAttribute('data-view') === viewName;
      btn.classList.toggle('active', isActive);
      if (isActive) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    // Update Sections
    [dom.viewOverview, dom.viewRooms, dom.viewAlerts, dom.viewNetwork].forEach(sec => {
      if (sec) sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update Header Title
    if (dom.pageTitle) {
      dom.pageTitle.textContent = VIEW_TITLES[viewName];
    }

    // Close mobile drawer if open
    if (dom.appSidebar) {
      dom.appSidebar.classList.remove('sidebar-open');
    }

    // Re-render current view content
    renderActiveView();
  }

  // -------------------------------------------------------------
  // Data Fetching & Sync
  // -------------------------------------------------------------
  async function loadData(notify = false) {
    state.isLoading = true;
    updateModeIndicator();

    let fetchErrors = [];

    // 1. Fetch Rooms
    try {
      state.rooms = await window.CampusPulseAPI.getRooms();
    } catch (err) {
      console.warn('[App] Error loading rooms:', err.message);
      fetchErrors.push('Rooms: ' + err.message);
      state.rooms = [];
    }

    // 2. Fetch Alerts
    try {
      state.alerts = await window.CampusPulseAPI.getAlerts();
    } catch (err) {
      console.warn('[App] Error loading alerts:', err.message);
      fetchErrors.push('Alerts: ' + err.message);
      state.alerts = [];
    }

    // 3. Fetch Health
    try {
      state.health = await window.CampusPulseAPI.getHealth();
    } catch (err) {
      console.warn('[App] Error loading health:', err.message);
      state.health = null;
    }

    state.isLoading = false;
    state.lastUpdated = new Date();

    // Handle Global Banner for HTTP connectivity issues
    handleConnectivityBanner(fetchErrors);

    // Update Sidebar Badges and Top KPIs
    updateSidebarCounters();
    updateKpis();

    // Populate building options if on rooms view or first load
    populateBuildingFilter();

    // Render active screen
    renderActiveView();

    if (notify) {
      showToast('Dashboard Refreshed', `Synchronized data at ${formatExactTime(state.lastUpdated)}`, 'success');
    }
  }

  /**
   * Update header Mock vs Live indicator badge and controls
   */
  function updateModeIndicator() {
    const isMock = window.CampusPulseAPI.isMockMode();

    if (dom.mockBadge) {
      if (isMock) {
        dom.mockBadge.className = 'mock-badge-indicator';
        dom.mockBadgeText.textContent = 'MOCK DATA MODE';
        dom.mockBadge.title = 'Serving realistic simulated data from js/mock-data.js';
      } else {
        dom.mockBadge.className = 'mock-badge-indicator live-mode';
        dom.mockBadgeText.textContent = 'LIVE HTTP MODE';
        dom.mockBadge.title = 'Connected to Java HttpServer (/api endpoints)';
      }
    }

    if (dom.modeToggleLabel) {
      dom.modeToggleLabel.textContent = isMock ? 'Mode: Mock' : 'Mode: Live HTTP';
    }

    // Simulate reading is only allowed in Mock Mode
    if (dom.btnSimulate) {
      dom.btnSimulate.disabled = !isMock;
      dom.btnSimulate.title = isMock 
        ? 'Generate a simulated sensor update for testing' 
        : 'Simulation disabled in Live HTTP Mode (handled by simulated Java UDP sensor senders)';
    }

    if (dom.envStatusPill) {
      dom.envStatusPill.textContent = isMock 
        ? 'Environment: Local Standalone (Mock)' 
        : 'Environment: Java HTTP API (/api/...)';
    }
  }

  /**
   * Handle connectivity banner warning
   */
  function handleConnectivityBanner(fetchErrors) {
    if (!dom.globalBanner) return;

    const isMock = window.CampusPulseAPI.isMockMode();

    if (!isMock && state.health && state.health.status === 'UNAVAILABLE') {
      dom.globalBanner.style.display = 'flex';
      dom.globalBanner.className = 'global-banner';
      dom.bannerMessage.textContent = 'Central Java HTTP Server is offline. Start the backend at port 8080 or switch to Mock Data.';
      dom.bannerActionBtn.textContent = 'Switch to Mock Data';
      dom.bannerActionBtn.onclick = () => {
        window.CampusPulseAPI.setMockMode(true);
        loadData(true);
      };
    } else if (fetchErrors.length > 0) {
      dom.globalBanner.style.display = 'flex';
      dom.globalBanner.className = 'global-banner banner-warning';
      dom.bannerMessage.textContent = 'Partial data load warning: ' + fetchErrors.join(' | ');
      dom.bannerActionBtn.textContent = 'Retry';
      dom.bannerActionBtn.onclick = () => loadData(true);
    } else {
      dom.globalBanner.style.display = 'none';
    }
  }

  /**
   * Update Sidebar counters
   */
  function updateSidebarCounters() {
    if (dom.navCounterRooms) {
      dom.navCounterRooms.textContent = state.rooms.length;
    }
    if (dom.navCounterAlerts) {
      const activeCount = state.alerts.filter(a => !a.acknowledged).length;
      dom.navCounterAlerts.textContent = activeCount;
      dom.navCounterAlerts.style.display = activeCount > 0 ? 'inline-block' : 'none';
    }
  }

  /**
   * Update KPI Cards on Overview Screen
   */
  function updateKpis() {
    const totalRooms = state.rooms.length;
    const warningRooms = state.rooms.filter(r => r.status === 'WARNING' || r.status === 'CRITICAL').length;
    const criticalRooms = state.rooms.filter(r => r.status === 'CRITICAL').length;
    const activeAlerts = state.alerts.filter(a => !a.acknowledged).length;

    if (dom.kpiTotalRooms) dom.kpiTotalRooms.textContent = totalRooms;
    if (dom.kpiWarningRooms) {
      dom.kpiWarningRooms.textContent = warningRooms;
      dom.kpiWarningRooms.style.color = criticalRooms > 0 ? 'var(--status-critical)' : (warningRooms > 0 ? 'var(--status-warning)' : 'var(--status-normal)');
    }
    if (dom.kpiActiveAlerts) {
      dom.kpiActiveAlerts.textContent = activeAlerts;
    }
    if (dom.kpiUnackSubtext) {
      dom.kpiUnackSubtext.textContent = activeAlerts === 1 ? '1 pending acknowledgment' : `${activeAlerts} pending acknowledgment`;
    }

    if (dom.kpiHealthStatus && state.health) {
      dom.kpiHealthStatus.textContent = state.health.status || 'UNKNOWN';
      if (state.health.status === 'UP') {
        dom.kpiHealthStatus.style.color = 'var(--status-normal)';
      } else if (state.health.status === 'DEGRADED') {
        dom.kpiHealthStatus.style.color = 'var(--status-warning)';
      } else {
        dom.kpiHealthStatus.style.color = 'var(--status-critical)';
      }
    }
    if (dom.kpiHealthUptime && state.health) {
      dom.kpiHealthUptime.textContent = state.health.uptimeFormatted ? `Uptime: ${state.health.uptimeFormatted}` : 'Uptime: Unavailable';
    }

    // Campus Overall Status Headline
    if (dom.campusStatusHeadline) {
      if (criticalRooms > 0) {
        dom.campusStatusHeadline.innerHTML = `
          <span class="badge badge-critical">Critical Warning</span>
          <span>Campus Pulse Central Monitoring</span>
        `;
      } else if (warningRooms > 0) {
        dom.campusStatusHeadline.innerHTML = `
          <span class="badge badge-warning">Advisory Notice</span>
          <span>Campus Pulse Central Monitoring</span>
        `;
      } else {
        dom.campusStatusHeadline.innerHTML = `
          <span class="badge badge-normal">System Normal</span>
          <span>Campus Pulse Central Monitoring</span>
        `;
      }
    }
  }

  // -------------------------------------------------------------
  // Screen Rendering
  // -------------------------------------------------------------
  function renderActiveView() {
    switch (state.activeView) {
      case 'overview':
        renderOverview();
        break;
      case 'rooms':
        renderRooms();
        break;
      case 'alerts':
        renderAlerts();
        break;
      case 'network':
        renderNetwork();
        break;
    }
  }

  // =============================================================
  // SCREEN A: OVERVIEW
  // =============================================================
  function renderOverview() {
    // 1. Telemetry Highlights: Display rooms with issues first, or top 4 rooms
    if (dom.overviewSensorHighlights) {
      if (state.rooms.length === 0) {
        dom.overviewSensorHighlights.innerHTML = renderEmptyStateHtml(
          'No Room Telemetry',
          'No telemetry packets received. Make sure sensors are streaming data.'
        );
      } else {
        // Sort priority: CRITICAL first, then WARNING, then NORMAL
        const priorityOrder = { 'CRITICAL': 0, 'WARNING': 1, 'NORMAL': 2 };
        const sorted = [...state.rooms].sort((a, b) => {
          const pA = priorityOrder[a.status] !== undefined ? priorityOrder[a.status] : 3;
          const pB = priorityOrder[b.status] !== undefined ? priorityOrder[b.status] : 3;
          return pA - pB;
        }).slice(0, 4);

        let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
        sorted.forEach(room => {
          const statusBadge = getStatusBadgeHtml(room.status);
          const tempColor = room.temperature >= 35.0 ? 'temp-critical' : (room.temperature >= 28.0 ? 'temp-warning' : 'temp-normal');
          const occPct = room.capacity > 0 ? Math.min(100, Math.round((room.occupancy / room.capacity) * 100)) : 0;

          html += `
            <div style="background:var(--bg-card-subtle); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:12px; display:flex; align-items:center; justify-content:space-between; gap:12px;">
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="room-id-tag">${escapeHtml(room.id)}</span>
                  <span style="font-weight:600; font-size:13px; color:var(--text-primary);">${escapeHtml(room.name)}</span>
                </div>
                <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
                  ${escapeHtml(room.building)} · Updated ${formatRelativeTime(room.lastUpdated)}
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:16px;">
                <div style="text-align:right;">
                  <div class="metric-num ${tempColor}" style="font-size:16px;">${room.temperature.toFixed(1)}°C</div>
                  <div style="font-size:10.5px; color:var(--text-muted);">${room.occupancy}/${room.capacity} (${occPct}%)</div>
                </div>
                <div>${statusBadge}</div>
              </div>
            </div>
          `;
        });
        html += '</div>';
        dom.overviewSensorHighlights.innerHTML = html;
      }
    }

    // 2. Recent Alert Feed
    if (dom.overviewAlertsFeed) {
      if (state.alerts.length === 0) {
        dom.overviewAlertsFeed.innerHTML = renderEmptyStateHtml(
          'No Alerts Recorded',
          'Campus conditions are nominal with no recorded warnings.'
        );
      } else {
        const recentAlerts = state.alerts.slice(0, 4);
        let html = '<div style="display:flex; flex-direction:column; gap:10px;">';

        recentAlerts.forEach(alert => {
          const sevBadge = getSeverityBadgeHtml(alert.severity);
          const ackBadge = alert.acknowledged 
            ? `<span class="badge badge-normal" style="font-size:10px;">ACK</span>` 
            : `<span class="badge badge-critical" style="font-size:10px;">PENDING</span>`;

          html += `
            <div style="background:var(--bg-card-subtle); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:12px;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  ${sevBadge}
                  <span class="alert-source-tag">${escapeHtml(alert.source)}</span>
                  <span style="font-size:11.5px; color:var(--text-muted);">Room <strong>${escapeHtml(alert.room)}</strong></span>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                  ${ackBadge}
                  <span style="font-size:11px; color:var(--text-muted);">${formatRelativeTime(alert.timestamp)}</span>
                </div>
              </div>
              <div style="font-size:12.5px; color:var(--text-primary); margin-top:4px;">
                ${escapeHtml(alert.message)}
              </div>
            </div>
          `;
        });

        html += '</div>';
        dom.overviewAlertsFeed.innerHTML = html;
      }
    }
  }

  // =============================================================
  // SCREEN B: ROOMS & SENSORS
  // =============================================================
  function populateBuildingFilter() {
    if (!dom.roomsBuildingFilter) return;

    const currentVal = state.roomsBuilding;
    const buildings = Array.from(new Set(state.rooms.map(r => r.building).filter(Boolean))).sort();

    dom.roomsBuildingFilter.innerHTML = '<option value="ALL">All Buildings</option>';
    buildings.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      if (b === currentVal) opt.selected = true;
      dom.roomsBuildingFilter.appendChild(opt);
    });
  }

  function renderRooms() {
    if (!dom.roomsCardsContainer) return;

    const query = state.roomsSearch.toLowerCase().trim();
    const statusFilter = state.roomsStatus;
    const buildingFilter = state.roomsBuilding;

    // Filter rooms
    const filtered = state.rooms.filter(room => {
      if (statusFilter !== 'ALL' && room.status !== statusFilter) return false;
      if (buildingFilter !== 'ALL' && room.building !== buildingFilter) return false;
      if (query) {
        const text = `${room.id} ${room.name} ${room.building} ${room.sensorId} ${room.notes}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });

    // Update count display
    if (dom.roomsCountDisplay) {
      dom.roomsCountDisplay.textContent = `Showing ${filtered.length} of ${state.rooms.length} facilities`;
    }

    if (filtered.length === 0) {
      dom.roomsCardsContainer.innerHTML = renderEmptyStateHtml(
        'No Matching Rooms',
        query || statusFilter !== 'ALL' || buildingFilter !== 'ALL'
          ? 'No campus rooms match your search query or selected filter criteria.'
          : 'No rooms currently registered in the monitoring system.'
      );
      return;
    }

    let cardsHtml = '';
    filtered.forEach(room => {
      const statusClass = `status-${(room.status || 'normal').toLowerCase()}`;
      const tempColor = room.temperature >= 35.0 ? 'temp-critical' : (room.temperature >= 28.0 ? 'temp-warning' : 'temp-normal');
      const occPct = room.capacity > 0 ? Math.min(100, Math.round((room.occupancy / room.capacity) * 100)) : 0;
      const occFillClass = occPct >= 90 ? 'fill-critical' : (occPct >= 80 ? 'fill-warning' : '');

      cardsHtml += `
        <article class="room-card ${statusClass}" aria-label="Room ${escapeHtml(room.id)}: ${escapeHtml(room.name)}">
          <div class="room-card-header">
            <div>
              <span class="room-id-tag">${escapeHtml(room.id)}</span>
              <h3 class="room-name">${escapeHtml(room.name)}</h3>
              <div class="room-building">${escapeHtml(room.building)} · ${escapeHtml(room.floor)}</div>
            </div>
            <div>
              ${getStatusBadgeHtml(room.status)}
            </div>
          </div>

          <div class="room-metrics-row">
            <div class="room-metric-col">
              <span class="metric-caption">Temperature</span>
              <span class="metric-num ${tempColor}">${room.temperature.toFixed(1)}°C</span>
              <span style="font-size:10.5px; color:var(--text-muted); margin-top:2px;">Threshold: 35.0°C</span>
            </div>
            <div class="room-metric-col">
              <span class="metric-caption">Humidity</span>
              <span class="metric-num">${room.humidity}%</span>
              <span style="font-size:10.5px; color:var(--text-muted); margin-top:2px;">RH Ambient</span>
            </div>
          </div>

          <div class="occupancy-bar-wrapper">
            <div class="occupancy-labels">
              <span>Occupancy: <strong>${room.occupancy} / ${room.capacity}</strong></span>
              <span><strong>${occPct}%</strong></span>
            </div>
            <div class="progress-track" role="progressbar" aria-valuenow="${occPct}" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-fill ${occFillClass}" style="width: ${occPct}%;"></div>
            </div>
          </div>

          <div class="room-card-footer">
            <span class="room-sensor-tag">${escapeHtml(room.sensorId)}</span>
            <span title="Last update: ${escapeHtml(room.lastUpdated)}">Updated ${formatRelativeTime(room.lastUpdated)}</span>
          </div>
        </article>
      `;
    });

    dom.roomsCardsContainer.innerHTML = cardsHtml;
  }

  // =============================================================
  // SCREEN C: ALERTS & INCIDENTS
  // =============================================================
  function renderAlerts() {
    if (!dom.alertsTableBody) return;

    const query = state.alertsSearch.toLowerCase().trim();
    const sevFilter = state.alertsSeverity;

    const filtered = state.alerts.filter(alert => {
      if (sevFilter !== 'ALL' && alert.severity !== sevFilter) return false;
      if (query) {
        const text = `${alert.id} ${alert.room} ${alert.source} ${alert.message} ${alert.acknowledgedBy || ''}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });

    if (dom.alertsCountDisplay) {
      dom.alertsCountDisplay.textContent = `Showing ${filtered.length} of ${state.alerts.length} incidents`;
    }

    if (filtered.length === 0) {
      dom.alertsTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            ${renderEmptyStateHtml(
              'No Alerts Found',
              query || sevFilter !== 'ALL'
                ? 'No alerts match the specified filter conditions.'
                : 'No incidents or warning alerts have been logged.'
            )}
          </td>
        </tr>
      `;
      return;
    }

    let rowsHtml = '';
    filtered.forEach(alert => {
      const sevBadge = getSeverityBadgeHtml(alert.severity);
      const ackHtml = alert.acknowledged
        ? `<span class="ack-readonly-badge ack-done" title="Acknowledged via TCP command">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
             <span>Acknowledged</span>
           </span>
           <span class="ack-note">${escapeHtml(alert.acknowledgedBy || 'TCP Staff Client')}</span>`
        : `<span class="ack-readonly-badge ack-pending" title="Awaiting TCP staff command">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
             <span>Pending ACK</span>
           </span>
           <span class="ack-note">Action via Member 1 TCP</span>`;

      rowsHtml += `
        <tr>
          <td>${sevBadge}</td>
          <td style="font-family:var(--font-mono); font-weight:600; color:var(--text-secondary);">${escapeHtml(alert.id)}</td>
          <td><span class="alert-source-tag">${escapeHtml(alert.source)}</span></td>
          <td><strong style="color:var(--text-primary);">${escapeHtml(alert.room)}</strong></td>
          <td class="alert-message-cell">${escapeHtml(alert.message)}</td>
          <td style="white-space:nowrap; color:var(--text-muted); font-size:12px;" title="${escapeHtml(alert.timestamp)}">
            ${formatRelativeTime(alert.timestamp)}
          </td>
          <td style="white-space:nowrap;">${ackHtml}</td>
        </tr>
      `;
    });

    dom.alertsTableBody.innerHTML = rowsHtml;
  }

  // =============================================================
  // SCREEN D: NETWORK STATUS (5 ASSIGNMENTS)
  // =============================================================
  function renderNetwork() {
    if (!dom.networkServicesGrid) return;

    const health = state.health || {};
    const services = health.services || {};

    const serviceKeys = [
      { key: 'tcp', defaultPort: 'Port 6000', defaultOwner: 'Member 1' },
      { key: 'udp', defaultPort: 'Port 6001', defaultOwner: 'Member 2' },
      { key: 'multicast', defaultPort: 'Group 230.0.0.1:4446', defaultOwner: 'Member 3' },
      { key: 'concurrency', defaultPort: 'ExecutorService Pool', defaultOwner: 'Member 4' },
      { key: 'http', defaultPort: 'Port 8080', defaultOwner: 'Member 5' }
    ];

    let gridHtml = '';

    serviceKeys.forEach(item => {
      const s = services[item.key] || {
        name: `${item.key.toUpperCase()} Service`,
        status: health.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'UNKNOWN',
        owner: item.defaultOwner,
        concept: `${item.key.toUpperCase()} Networking`,
        role: 'Component details not returned by backend health endpoint.',
        lastActivity: 'No heartbeat recorded'
      };

      const statusBadge = getServiceStatusBadgeHtml(s.status);
      const connDetail = s.port ? `Port: ${s.port}` : (s.group ? `Group: ${s.group}` : (s.details || item.defaultPort));

      gridHtml += `
        <article class="service-card" aria-label="${escapeHtml(s.name)}">
          <div>
            <div class="service-card-top">
              <span class="service-owner-badge">${escapeHtml(s.owner || item.defaultOwner)}</span>
              <div>${statusBadge}</div>
            </div>
            
            <h3 class="service-concept-title">${escapeHtml(s.name || item.key.toUpperCase())}</h3>
            <div class="service-role-tag">${escapeHtml(s.concept || 'Network Programming Concept')}</div>
            
            <p class="service-description" style="margin-top: 10px;">
              ${escapeHtml(s.role || s.description || 'Networking component integrating with CampusPulse architecture.')}
            </p>
          </div>

          <div class="service-meta-box">
            <div class="service-meta-row">
              <span class="meta-term">Interface / Socket:</span>
              <span class="meta-value">${escapeHtml(connDetail)}</span>
            </div>
            <div class="service-meta-row" style="margin-top:4px;">
              <span class="meta-term">Last Activity:</span>
              <span class="meta-value" style="font-size:11px; color:var(--accent-cyan);">${escapeHtml(s.lastActivity || s.lastEvent || 'Idle')}</span>
            </div>
          </div>
        </article>
      `;
    });

    dom.networkServicesGrid.innerHTML = gridHtml;
  }

  // -------------------------------------------------------------
  // HTML Badge Generators
  // -------------------------------------------------------------
  function getStatusBadgeHtml(status) {
    const s = (status || 'NORMAL').toUpperCase();
    if (s === 'CRITICAL') {
      return '<span class="badge badge-critical">Critical</span>';
    } else if (s === 'WARNING') {
      return '<span class="badge badge-warning">Warning</span>';
    }
    return '<span class="badge badge-normal">Normal</span>';
  }

  function getSeverityBadgeHtml(severity) {
    const s = (severity || 'INFO').toUpperCase();
    if (s === 'CRITICAL') {
      return '<span class="badge badge-critical">CRITICAL</span>';
    } else if (s === 'WARNING') {
      return '<span class="badge badge-warning">WARNING</span>';
    }
    return '<span class="badge badge-info">INFO</span>';
  }

  function getServiceStatusBadgeHtml(status) {
    const s = (status || 'UNKNOWN').toUpperCase();
    if (s === 'UP') {
      return '<span class="badge badge-up">Operational (UP)</span>';
    } else if (s === 'DEGRADED') {
      return '<span class="badge badge-warning">Degraded</span>';
    } else if (s === 'DOWN' || s === 'UNAVAILABLE') {
      return '<span class="badge badge-down">Offline</span>';
    }
    return '<span class="badge badge-unknown">Unknown</span>';
  }

  function renderEmptyStateHtml(title, desc) {
    return `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24">
          <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/>
        </svg>
        <div class="empty-state-title">${escapeHtml(title)}</div>
        <div class="empty-state-desc">${escapeHtml(desc)}</div>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // Event Listeners & User Actions
  // -------------------------------------------------------------
  function initEventListeners() {
    // Navigation
    if (dom.navOverview) dom.navOverview.addEventListener('click', () => switchView('overview'));
    if (dom.navRooms) dom.navRooms.addEventListener('click', () => switchView('rooms'));
    if (dom.navAlerts) dom.navAlerts.addEventListener('click', () => switchView('alerts'));
    if (dom.navNetwork) dom.navNetwork.addEventListener('click', () => switchView('network'));

    // Quick links on overview screen
    if (dom.overviewViewAllRooms) dom.overviewViewAllRooms.addEventListener('click', () => switchView('rooms'));
    if (dom.overviewViewAllAlerts) dom.overviewViewAllAlerts.addEventListener('click', () => switchView('alerts'));

    // Mobile Hamburger
    if (dom.mobileMenuBtn && dom.appSidebar) {
      dom.mobileMenuBtn.addEventListener('click', () => {
        dom.appSidebar.classList.toggle('sidebar-open');
      });
    }

    // Toggle Mock Mode / HTTP Mode
    if (dom.modeToggleBtn) {
      dom.modeToggleBtn.addEventListener('click', () => {
        const currentMock = window.CampusPulseAPI.isMockMode();
        const newMode = !currentMock;
        window.CampusPulseAPI.setMockMode(newMode);
        showToast(
          'Mode Switched',
          newMode ? 'Switched to local Mock Data' : 'Switched to live Java HTTP API (/api/...)',
          'info'
        );
        loadData(false);
      });
    }

    // Simulate Sensor Reading (Frontend testing aid)
    if (dom.btnSimulate) {
      dom.btnSimulate.addEventListener('click', () => {
        const result = window.CampusPulseAPI.simulateSensorUpdate();
        if (result.success) {
          showToast(
            '⚡ Simulated Telemetry Packet',
            result.message || 'Simulated UDP sensor packet received and processed.',
            result.newAlert ? 'critical' : 'success'
          );
          // Reload local data to reflect simulation in UI
          loadData(false);
        } else {
          showToast('Simulation Notice', result.message || 'Simulation not possible', 'warning');
        }
      });
    }

    // Refresh Button
    if (dom.btnRefresh) {
      dom.btnRefresh.addEventListener('click', () => {
        loadData(true);
      });
    }

    // Search & Filter Listeners for Rooms
    if (dom.roomsSearchInput) {
      dom.roomsSearchInput.addEventListener('input', (e) => {
        state.roomsSearch = e.target.value;
        renderRooms();
      });
    }

    if (dom.roomsStatusFilter) {
      dom.roomsStatusFilter.addEventListener('change', (e) => {
        state.roomsStatus = e.target.value;
        renderRooms();
      });
    }

    if (dom.roomsBuildingFilter) {
      dom.roomsBuildingFilter.addEventListener('change', (e) => {
        state.roomsBuilding = e.target.value;
        renderRooms();
      });
    }

    // Search & Filter Listeners for Alerts
    if (dom.alertsSearchInput) {
      dom.alertsSearchInput.addEventListener('input', (e) => {
        state.alertsSearch = e.target.value;
        renderAlerts();
      });
    }

    if (dom.alertsSeverityFilter) {
      dom.alertsSeverityFilter.addEventListener('change', (e) => {
        state.alertsSeverity = e.target.value;
        renderAlerts();
      });
    }

    // Keyboard shortcut (Escape to reset search inputs)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (state.roomsSearch && state.activeView === 'rooms') {
          state.roomsSearch = '';
          if (dom.roomsSearchInput) dom.roomsSearchInput.value = '';
          renderRooms();
        }
        if (state.alertsSearch && state.activeView === 'alerts') {
          state.alertsSearch = '';
          if (dom.alertsSearchInput) dom.alertsSearchInput.value = '';
          renderAlerts();
        }
      }
    });
  }

  // -------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------
  function init() {
    initEventListeners();
    updateHeaderClock();
    setInterval(updateHeaderClock, 1000);

    // Initial data load
    loadData(false);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
