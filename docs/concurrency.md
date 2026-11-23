# CampusPulse Concurrency Foundation

**Network Programming – Assignment 02 | Member 4: Multithreaded Server Applications**  
**Package:** `lk.ac.uom.campuspulse.concurrency`

---

## 1. Overview & Architecture

In CampusPulse, high volumes of asynchronous network events arrive simultaneously:
- High-frequency room sensor updates arriving over UDP (Member 2)
- Interactive staff commands and incident reports over TCP (Member 1)
- Emergency alert broadcasts over IP Multicast (Member 3)
- Real-time HTTP dashboard requests (Member 5)

Creating an unbounded new thread per client connection or packet (`new Thread(...)`) can rapidly exhaust operating system resources, leading to CPU thrashing and `OutOfMemoryError`. 

The **Concurrency Foundation** solves this by establishing a reusable, bounded thread pool backed by standard Java concurrency primitives (`java.util.concurrent.*`).

```
                    CampusPulse Concurrency Foundation
                   +----------------------------------+
                   |       ConcurrencyManager         |
                   |                                  |
Incoming Tasks --->|  [Bounded LinkedBlockingQueue]   |
(Runnable/Callable)|                 |                |
                   |                 v                |
                   |      [Fixed ThreadPoolExecutor]  |
                   |   +--------------------------+   |
                   |   | cp-worker-1 | cp-worker-2|   |
                   |   | cp-worker-3 | cp-worker-4|   |
                   |   +--------------------------+   |
                   |                 |                |
                   |                 v                |
                   |   Atomic Metric Accumulators     |
                   |   (Submitted, Active, Completed, |
                   |    Failed, Queued, Pool Size)    |
                   +----------------------------------+
```

---

## 2. Key Components

### 2.1 `ConcurrencyManager`
The central thread management engine.
- **Fixed Thread Pool:** Uses `ThreadPoolExecutor` with a configured pool size (defaults to `2 * availableProcessors()`, minimum 4).
- **Custom Worker Naming:** Employs a custom `ThreadFactory` creating identifiable, non-daemon threads named `cp-worker-1`, `cp-worker-2`, etc.
- **Task Rejection Protection:** Bounded work queue (`LinkedBlockingQueue`) with a meaningful `RejectedExecutionHandler` that logs diagnostic state and prevents server stalls.
- **Resilient Exception Containment:** Task wrappers catch unhandled exceptions, increment the `failedTasks` counter, and keep worker threads alive.
- **Controlled Two-Phase Shutdown:** `shutdown()` halts new submissions, drains pending tasks with a configurable timeout, and safely falls back to `shutdownNow()` if lingering tasks do not terminate.

### 2.2 `ConcurrencyMetrics`
An immutable snapshot record providing thread-safe visibility into:
- `submittedTasks`: Total tasks accepted for execution.
- `completedTasks`: Tasks finished successfully.
- `failedTasks`: Tasks that threw unhandled exceptions or were rejected.
- `activeTasks`: Tasks currently occupying worker threads.
- `queuedTasks`: Backlog of tasks waiting in the queue.
- `poolSize`: Total worker thread capacity.
- `isShutdown`: Whether termination has commenced.
- `isTerminated`: Whether all tasks and workers have finished.

### 2.3 `ConcurrencyDemo`
A self-contained verification program demonstrating:
1. Multi-task concurrent execution across named worker threads.
2. Value-returning `Callable<T>` tasks retrieving results via `Future<T>`.
3. Exception containment and automatic increment of failure metrics.
4. Clean, graceful shutdown.

> **Note:** The demonstration runs simulated workloads to verify the concurrency engine independently. It does not initiate real TCP or UDP network traffic.

---

## 3. Public API Reference

```java
// Initialization
ConcurrencyManager manager = new ConcurrencyManager();               // Default pool size
ConcurrencyManager manager = new ConcurrencyManager(int poolSize);   // Custom pool size
ConcurrencyManager manager = new ConcurrencyManager(int poolSize, int queueCapacity);

// Task Submission
void submitTask(Runnable task);              // Asynchronous fire-and-forget
<T> Future<T> submitTask(Callable<T> task);  // Asynchronous with return value

// Observability
ConcurrencyMetrics getMetrics();             // Immutable metrics snapshot
long getSubmittedTaskCount();
long getCompletedTaskCount();
long getFailedTaskCount();
long getActiveTaskCount();
int getQueueSize();
int getPoolSize();
boolean isShutdown();
boolean isTerminated();

// Lifecycle Management
boolean shutdown(long timeout, TimeUnit unit); // Two-phase graceful shutdown
boolean shutdownGracefully();                  // Default 5-second timeout shutdown
```

---

## 4. Integration Guide for Team Members

### 4.1 Member 1 (TCP Socket Programming)
When Member 1's `ServerSocket` accepts a client connection, offload the blocking communication to the concurrency manager instead of spawning an unmanaged thread:

```java
// In Member 1's TCP server loop:
ServerSocket serverSocket = new ServerSocket(6000);
while (running) {
    Socket clientSocket = serverSocket.accept();
    concurrencyManager.submitTask(new TcpClientHandler(clientSocket));
}
```

### 4.2 Member 2 (UDP Networking)
When Member 2's `DatagramSocket` receives a packet, offload payload parsing, validation, and shared state updates immediately so the UDP listener never drops incoming datagrams:

```java
// In Member 2's UDP listener loop:
DatagramSocket socket = new DatagramSocket(6001);
byte[] buffer = new byte[1024];

while (running) {
    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
    socket.receive(packet);

    // Make an independent copy of packet data
    byte[] payload = Arrays.copyOf(packet.getData(), packet.getLength());
    concurrencyManager.submitTask(() -> {
        UdpPacketParser.parseAndValidate(payload);
    });
}
```

### 4.3 Member 5 (HTTP & Web Services)
Member 5 can expose the thread pool's health and load metrics directly through the `GET /api/health` endpoint:

```java
// In Member 5's HTTP health handler:
ConcurrencyMetrics metrics = concurrencyManager.getMetrics();
// Include metrics in JSON health response:
// { "services": { "concurrency": { "status": "UP", "active": 3, "queued": 0 } } }
```

---

## 5. How to Compile and Run the Demonstration

### Option A: Using Maven (Recommended)
Compile the project:
```bash
mvn clean compile
```

Run the standalone concurrency verification demo:
```bash
mvn exec:java
```

Or package and execute the JAR:
```bash
mvn package
java -jar target/campuspulse-1.0.0-SNAPSHOT.jar
```

### Option B: Using Standard JDK `javac` / `java`
If running directly from the repository root without Maven:

```powershell
# Create output directory
mkdir -p target/classes

# Compile all Java sources
javac -d target/classes src/main/java/lk/ac/uom/campuspulse/concurrency/*.java

# Run the demo
java -cp target/classes lk.ac.uom.campuspulse.concurrency.ConcurrencyDemo
```

---

## 6. Current Implementation Status & Next Steps

* **Current Status:** Concurrency core complete and verified independently.
* **Pending Integration:** Sockets (`ServerSocket`, `DatagramSocket`, `MulticastSocket`) and HTTP endpoints will be bound to this manager as Members 1, 2, 3, and 5 implement their respective modules.
