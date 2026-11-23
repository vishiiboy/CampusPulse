package lk.ac.uom.campuspulse.concurrency;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * Standalone demonstration of the CampusPulse Concurrency Foundation.
 * <p>
 * Member 4 Responsibility: Multithreaded Server Applications.
 * <p>
 * Demonstrates:
 * <ul>
 *   <li>Fixed thread pool initialization with worker thread naming</li>
 *   <li>Concurrent execution of simulated client request tasks</li>
 *   <li>Generic Callable submission and Future result retrieval</li>
 *   <li>Resilient exception handling and thread-safe metric tracking</li>
 *   <li>Controlled, two-phase graceful shutdown</li>
 * </ul>
 * <p>
 * <b>NOTE:</b> This test harness uses simulated tasks to verify the internal
 * concurrency engine independently. It does NOT represent real TCP or UDP
 * socket communication.
 */
public class ConcurrencyDemo {

    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("  CampusPulse - Concurrency Foundation Verification (Member 4)");
        System.out.println("  Network Programming Assignment 02 | University of Moratuwa");
        System.out.println("================================================================================");
        System.out.println("  [NOTICE] Internal verification of thread pooling, metrics, and lifecycle.");
        System.out.println("           Socket-level networking will be integrated by Members 1, 2, 3, and 5.");
        System.out.println("================================================================================\n");

        // 1. Initialize ConcurrencyManager with a pool of 3 worker threads
        int poolSize = 3;
        System.out.printf("[DEMO] Initializing ConcurrencyManager with fixed pool size = %d...%n", poolSize);
        ConcurrencyManager concurrencyManager = new ConcurrencyManager(poolSize);

        System.out.println("[DEMO] Initial Metrics: " + concurrencyManager.getMetrics());
        System.out.println();

        // 2. Submit simulated tasks to demonstrate concurrent processing across worker threads
        System.out.println("--------------------------------------------------------------------------------");
        System.out.println(" PHASE 1: Submitting 6 Simulated Client Workloads (Pool Size: 3)");
        System.out.println("--------------------------------------------------------------------------------");

        String[] simulatedWorkloads = {
                "UDP-SENS-B201 (Simulated Packet Ingestion)",
                "TCP-STAFF-101 (Simulated Incident Report)",
                "RULE-CHECK-B201 (Simulated Rule Evaluation)",
                "UDP-SENS-A102 (Simulated Packet Ingestion)",
                "TCP-STAFF-102 (Simulated Alert Acknowledgment)",
                "HTTP-API-SYNC (Simulated Snapshot Generation)"
        };

        for (int i = 0; i < simulatedWorkloads.length; i++) {
            final int taskId = i + 1;
            final String taskDesc = simulatedWorkloads[i];

            concurrencyManager.submitTask(() -> {
                String threadName = Thread.currentThread().getName();
                System.out.printf("  -> [START ] Task #%d [%s] assigned to worker [%s]%n",
                        taskId, taskDesc, threadName);
                try {
                    // Simulate processing time
                    Thread.sleep(400);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    System.err.printf("  XX [INTRPT] Task #%d was interrupted%n", taskId);
                    return;
                }
                System.out.printf("  <- [FINISH] Task #%d [%s] completed by worker [%s]%n",
                        taskId, taskDesc, threadName);
            });
        }

        // Allow tasks to run and inspect mid-execution metrics
        try {
            Thread.sleep(250);
            System.out.println("\n[DEMO] Mid-Flight Snapshot: " + concurrencyManager.getMetrics() + "\n");
            // Wait for phase 1 tasks to settle
            Thread.sleep(700);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // 3. Demonstrate Callable<T> and Future<T> support
        System.out.println("--------------------------------------------------------------------------------");
        System.out.println(" PHASE 2: Submitting Value-Returning Callable Task (Future<T>)");
        System.out.println("--------------------------------------------------------------------------------");

        Future<Double> simulatedSensorAvg = concurrencyManager.submitTask(() -> {
            String worker = Thread.currentThread().getName();
            System.out.printf("  -> [START ] Computing simulated campus temperature average on [%s]%n", worker);
            Thread.sleep(300);
            double simulatedAvg = (36.8 + 21.8 + 28.4 + 22.1 + 24.5) / 5.0;
            System.out.printf("  <- [FINISH] Computation complete on [%s], result = %.2f°C%n", worker, simulatedAvg);
            return simulatedAvg;
        });

        try {
            Double avgResult = simulatedSensorAvg.get();
            System.out.printf("[DEMO] Future result successfully retrieved: %.2f°C%n%n", avgResult);
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("[DEMO] Error retrieving Future result: " + e.getMessage());
        }

        // 4. Demonstrate Resilient Failure Handling
        System.out.println("--------------------------------------------------------------------------------");
        System.out.println(" PHASE 3: Demonstrating Exception Containment & Failure Metric Tracking");
        System.out.println("--------------------------------------------------------------------------------");

        concurrencyManager.submitTask(() -> {
            String worker = Thread.currentThread().getName();
            System.out.printf("  -> [START ] Executing faulty task (simulating corrupt payload) on [%s]%n", worker);
            throw new RuntimeException("Simulated validation failure: Corrupted sensor packet checksum");
        });

        // Brief pause to allow failed task to be processed
        try {
            Thread.sleep(200);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println("[DEMO] Post-Failure Metrics (Notice failedTasks incremented):");
        System.out.println("       " + concurrencyManager.getMetrics() + "\n");

        // 5. Demonstrate Controlled Graceful Shutdown
        System.out.println("--------------------------------------------------------------------------------");
        System.out.println(" PHASE 4: Controlled Graceful Shutdown");
        System.out.println("--------------------------------------------------------------------------------");

        System.out.println("[DEMO] Initiating graceful shutdown (5-second timeout)...");
        boolean terminatedCleanly = concurrencyManager.shutdown(5, TimeUnit.SECONDS);

        System.out.printf("[DEMO] Shutdown Complete. Clean termination: %b%n", terminatedCleanly);
        System.out.println("[DEMO] Final Metrics: " + concurrencyManager.getMetrics());

        System.out.println("\n================================================================================");
        System.out.println("  Member 4 Concurrency Foundation Demonstration Completed Successfully");
        System.out.println("================================================================================");
    }
}
