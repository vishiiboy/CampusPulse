package lk.ac.uom.campuspulse.concurrency;

/**
 * Immutable snapshot of runtime metrics for the CampusPulse ConcurrencyManager.
 * <p>
 * Provides thread-safe observability into task execution, worker utilization,
 * and lifecycle status for the central server engine (Member 4).
 */
public record ConcurrencyMetrics(
        long submittedTasks,
        long completedTasks,
        long failedTasks,
        long activeTasks,
        int queuedTasks,
        int poolSize,
        boolean isShutdown,
        boolean isTerminated
) {
    @Override
    public String toString() {
        return String.format(
                "ConcurrencyMetrics[Pool: %d, Active: %d, Queued: %d | Submitted: %d, Completed: %d, Failed: %d | Shutdown: %b, Terminated: %b]",
                poolSize, activeTasks, queuedTasks, submittedTasks, completedTasks, failedTasks, isShutdown, isTerminated
        );
    }
}
