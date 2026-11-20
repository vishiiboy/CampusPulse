# CampusPulse

### Smart Campus Monitoring & Emergency Communication System

**Network Programming – Assignment 02 | Group Project (5 Members)**  
**Expected deadline:** 26 November 2026  
**Status:** Planning and development (features described below are proposed, not yet implemented)

## Overview

**CampusPulse** is a Java-based educational network programming application that simulates a smart campus monitoring system. Virtual sensors send room readings to a central Java server. Staff clients can report incidents or acknowledge warnings, while the system detects configurable conditions and notifies subscribed clients. A lightweight web dashboard displays current room readings, alerts, and recent events.

The main purpose is to **demonstrate five distinct networking concepts within one integrated application**. The focus is on real networking behavior and live demonstrations, rather than an elaborate user interface.

> **Note:** CampusPulse is a classroom prototype with simulated data, not a real emergency response or safety-certified monitoring system. Details may change when official assignment guidelines are released.

## Project Objectives

- Demonstrate **TCP socket communication** for reliable commands and responses.
- Use **UDP datagrams** for frequent, lightweight sensor updates.
- Distribute emergency-style notifications using **IP multicast**.
- Handle multiple clients with **Java multithreading and concurrency controls**.
- Expose monitoring data through **HTTP APIs** and a simple web dashboard.
- Integrate five independently developed networking modules into one working Java application.

## How CampusPulse Works

1. Java sensor simulators send readings such as room temperature and occupancy through UDP.
2. The central Java backend receives and validates readings, then updates shared in-memory state.
3. Configurable demonstration rules detect abnormal readings (for example, temperature at or above 35°C).
4. The multicast service broadcasts an alert to clients that have joined the alert group.
5. The web dashboard requests the current status and alerts from HTTP endpoints.
6. A staff client uses TCP to report an incident or acknowledge an alert and receive a response.

```text
   Simulated Sensor Clients
           | UDP
           v
   +-------------------------+
   |   Central Java Server   |
   |                         |
   |  Shared State + Rules   |
   |  Concurrent Processing  |
   +-------------------------+
     ^       |            |
     | TCP   | Multicast  | HTTP
     |       v            v
  Staff   Alert         Browser
  Client  Receivers     Dashboard
```

## Team Responsibilities

Each member owns one primary networking concept, a meaningful feature, a test or runnable demonstration, and an approximately two-minute presentation segment.

| Member | Networking Concept | Individual Contribution |
|---|---|---|
| Member 1 | **TCP Socket Programming** | Implement staff incident reporting, control/acknowledgment commands, and reliable server responses using Java `Socket` and `ServerSocket`. |
| Member 2 | **UDP Networking** | Implement simulated sensor senders and a UDP listener using `DatagramSocket` and `DatagramPacket`, including message validation. |
| Member 3 | **IP Multicasting** | Implement alert publishing and multiple group subscribers using `MulticastSocket`, with join/receive/leave behavior. |
| Member 4 | **Multithreaded Server Applications** | Implement concurrent client handling with `ExecutorService` and thread-safe access to shared readings and alerts. |
| Member 5 | **HTTP & Web Services** | Implement Java HTTP endpoints and a basic HTML/CSS/JavaScript dashboard for status and alert history. |

**Team agreement:** Members collaborate on integration, documentation, and testing, but each must be able to explain and demonstrate their own networking implementation.

## Planned Minimum Features (MVP)

- [ ] Start a central Java server.
- [ ] Run at least two simulated sensor clients.
- [ ] Receive and validate UDP readings from multiple rooms.
- [ ] Accept TCP incident reports and acknowledgment commands.
- [ ] Trigger a warning when a configured demonstration rule is met.
- [ ] Send one multicast alert to at least two receiving clients.
- [ ] Serve current room readings, alerts, and health information over HTTP.
- [ ] Show basic live status and event history in a browser dashboard.
- [ ] Handle multiple simultaneous clients without corrupting shared data.
- [ ] Demonstrate the complete sensor-to-alert-to-dashboard workflow.

## Planned Technology Stack

| Component | Technology |
|---|---|
| Backend | **Java 17+** |
| Build tool | **Maven** |
| TCP/UDP/Multicast | Java `java.net` socket APIs |
| Concurrency | `ExecutorService` and thread-safe Java collections |
| HTTP API | JDK `HttpServer` (or a minimal Java HTTP framework, if needed) |
| Frontend | HTML, CSS, JavaScript |
| State storage | In-memory state (database not required for MVP) |
| Development | Git, GitHub, VS Code or IntelliJ IDEA |

## Proposed Message Formats and Ports

These are preliminary contracts to help team members build compatible modules. Confirm them before implementation.

**UDP sensor message:**

```text
SENSOR|B201|TEMP|36.8|1700
```

**TCP staff command and response:**

```text
INCIDENT|B201|SMOKE
OK|INCIDENT-001
```

**Proposed HTTP endpoints:**

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/rooms` | View latest room readings and status |
| `GET` | `/api/alerts` | View recent warning and incident events |
| `GET` | `/api/health` | Check server status |

**Illustrative ports:** TCP `6000` · UDP `6001` · HTTP `8080`. Multicast address and port will be configured and documented during implementation.

## Proposed Repository Structure

```text
campuspulse/
├── README.md
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── .../
│   │   │       ├── core/          # Shared models, state and warning rules
│   │   │       ├── tcp/           # Member 1
│   │   │       ├── udp/           # Member 2
│   │   │       ├── multicast/     # Member 3
│   │   │       ├── concurrency/   # Member 4
│   │   │       └── http/          # Member 5
│   │   └── resources/
│   │       └── web/              # Simple browser dashboard
│   └── test/
│       └── java/                 # Module and integration tests
└── docs/                         # Diagrams, contracts and demo notes
```

> The folder tree is a **target structure**; these files and folders are not yet assumed to exist.

## Getting Started

**Current status:** The project is being set up. Executable commands and the complete local-run instructions will be added once the Java application skeleton is committed.

Planned setup:

1. Install a compatible JDK (Java 17 or newer) and Maven.
2. Clone this repository.
3. Build the Java backend.
4. Start the central server.
5. Start the simulated sensor clients and multicast receivers.
6. Open the local dashboard and run the demonstration scenario.

## GitHub Collaboration

Work on separate feature branches and merge tested changes via pull requests.

| Branch | Ownership |
|---|---|
| `main` | Integrated, tested project |
| `feature/tcp` | TCP implementation |
| `feature/udp` | UDP implementation |
| `feature/multicast` | Multicasting implementation |
| `feature/concurrency` | Multithreading implementation |
| `feature/http` | HTTP API and dashboard |

Before coding, agree on the shared models, warning rules, message formats, ports, and module interfaces. Avoid directly changing another member's module without discussion.

## Development Timeline

| Date (2026) | Goal |
|---|---|
| 21 Nov | Finalize features, responsibilities, networking contracts, and repository setup |
| 22 Nov | Create initial working versions of the five modules |
| 23 Nov | Complete each module's basic networking behavior and tests |
| 24 Nov | Integrate TCP, UDP, multicast, concurrency, and HTTP workflows |
| 25 Nov | Run end-to-end tests and rehearse the team demonstration |
| 26 Nov | Final validation and expected submission/presentation |

## Presentation Plan (10 Minutes)

| Time | Member | Demonstration |
|---|---|---|
| 00:00–02:00 | Member 1 | Report an incident via TCP and show the response |
| 02:00–04:00 | Member 2 | Stream sensor readings via UDP |
| 04:00–06:00 | Member 3 | Show the same multicast alert on two client instances |
| 06:00–08:00 | Member 4 | Demonstrate simultaneous clients and thread-safe processing |
| 08:00–10:00 | Member 5 | Open the HTTP dashboard and show updated rooms/alerts |

## Scope and Limitations

The first version deliberately excludes physical sensors, cloud hosting, user accounts, SMS notifications, and a database. Testing will start on `localhost`; LAN demonstrations will be attempted only if network permissions allow them. Multicast support can vary by operating system and Wi-Fi/network setup, so group reception must be tested early.

## Course Context

This project is being developed for **Network Programming Assignment 02** using concepts covered in the semester's lectures: TCP/IP Networking in Java, UDP Networking, Multithreaded Server Applications, Multicasting with Sockets, and HTTP/Web Services. Additional topics such as NIO and secure networking may be considered only after the core demonstration is stable.

---

**CampusPulse — one connected Java application, five distinct networking contributions.**
