package lk.ac.uom.campuspulse.concurrency;

import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Centralized, reusable concurrency manager for CampusPulse.
 * <p>
 * Member 4 Responsibility: Multithreaded Server Applications.
 * <p>
 * This manager provides controlled thread pooling using a fixed-size
 * {@link ThreadPoolExecutor}, preventing uncontrolled thread proliferation
 * under heavy client loads. It offers thread-safe task metrics, custom worker
 * thread naming, task submission for both {@link Runnable} and {@link Callable},
 * meaningful rejection handling, and a two-phase graceful shutdown routine.
 */
public class ConcurrencyManager {

    /** Default pool size when not explicitly configured (sensible baseline for I/O bound tasks). */
    public static final int DEFAULT_POOL_SIZE = Math.max(4, Runtime.getRuntime().availableProcessors() * 2);

    /** Default maximum backlog capacity for queued tasks before rejection policy triggers. */
    public static final int DEFAULT_QUEUE_CAPACITY = 1000;

    private final int poolSize;
    private final ThreadPoolExecutor executor;

    // Thread-safe operational metrics
    private final AtomicLong submittedTasks = new AtomicLong(0);
    private final AtomicLong completedTasks = new AtomicLong(0);
    private final AtomicLong failedTasks = new AtomicLong(0);
    private final AtomicLong activeTasks = new AtomicLong(0);

    /**
     * Creates a ConcurrencyManager with the default pool size and queue capacity.
     */
    public ConcurrencyManager() {
        this(DEFAULT_POOL_SIZE, DEFAULT_QUEUE_CAPACITY);
    }

    /**
     * Creates a ConcurrencyManager with a custom fixed pool size.
     *
     * @param poolSize number of dedicated worker threads in the pool
     */
    public ConcurrencyManager(int poolSize) {
        this(poolSize, DEFAULT_QUEUE_CAPACITY);
    }

    /**
     * Creates a ConcurrencyManager with a custom pool size and queue capacity.
     *
     * @param poolSize      number of dedicated worker threads in the pool (must be > 0)
     * @param queueCapacity maximum number of pending tasks allowed in the queue (must be > 0)
     */
    public ConcurrencyManager(int poolSize, int queueCapacity) {
        if (poolSize <= 0) {
            throw new IllegalArgumentException("Thread pool size must be greater than zero: " + poolSize);
        }
        if (queueCapacity <= 0) {
            throw new IllegalArgumentException("Queue capacity must be greater than zero: " + queueCapacity);
        }

        this.poolSize = poolSize;

        // Custom rejection policy logging detailed diagnostic context
        RejectedExecutionHandler rejectionHandler = new CustomRejectionHandler();

        // Custom thread factory providing identifiable worker thread names
        ThreadFactory threadFactory = new CampusPulseThreadFactory("cp-worker");

        // Fixed thread pool with bounded work queue
        this.executor = new ThreadPoolExecutor(
                poolSize,
                poolSize,
                0L,
                TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<>(queueCapacity),
                threadFactory,
                rejectionHandler
        );
    }

    /**
     * Submits a fire-and-forget {@link Runnable} task for asynchronous execution.
     *
     * @param task the runnable task to execute
     * @throws NullPointerException       if task is null
     * @throws RejectedExecutionException if the task cannot be accepted (e.g. pool shutdown or queue full)
     */
    public void submitTask(Runnable task) {
        Objects.requireNonNull(task, "Task cannot be null");
        checkNotShutdown();

        submittedTasks.incrementAndGet();

        Runnable wrappedTask = () -> {
            activeTasks.incrementAndGet();
            try {
                task.run();
                completedTasks.incrementAndGet();
            } catch (Throwable t) {
                failedTasks.incrementAndGet();
                System.err.printf("[ConcurrencyManager] Worker thread [%s] encountered an unhandled exception: %s%n",
                        Thread.currentThread().getName(), t.getMessage());
                throw t;
            } finally {
                activeTasks.decrementAndGet();
            }
        };

        try {
            executor.execute(wrappedTask);
        } catch (RejectedExecutionException rex) {
            failedTasks.incrementAndGet();
            throw rex;
        }
    }

    /**
     * Submits a value-returning {@link Callable} task and returns a {@link Future} representing
     * the pending result.
     *
     * @param <T>  the result type of the task
     * @param task the callable task to execute
     * @return a Future to retrieve the computed result or handle cancellation/exceptions
     * @throws NullPointerException       if task is null
     * @throws RejectedExecutionException if the task cannot be accepted
     */
    public <T> Future<T> submitTask(Callable<T> task) {
        Objects.requireNonNull(task, "Task cannot be null");
        checkNotShutdown();

        submittedTasks.incrementAndGet();

        Callable<T> wrappedTask = () -> {
            activeTasks.incrementAndGet();
            try {
                T result = task.call();
                completedTasks.incrementAndGet();
                return result;
            } catch (Throwable t) {
                failedTasks.incrementAndGet();
                throw t;
            } finally {
                activeTasks.decrementAndGet();
            }
        };

        try {
            return executor.submit(wrappedTask);
        } catch (RejectedExecutionException rex) {
            failedTasks.incrementAndGet();
            throw rex;
        }
    }

    /**
     * Returns an immutable snapshot of real-time concurrency metrics.
     *
     * @return ConcurrencyMetrics snapshot
     */
    public ConcurrencyMetrics getMetrics() {
        return new ConcurrencyMetrics(
                submittedTasks.get(),
                completedTasks.get(),
                failedTasks.get(),
                activeTasks.get(),
                executor.getQueue().size(),
                poolSize,
                executor.isShutdown(),
                executor.isTerminated()
        );
    }

    /**
     * Initiates a two-phase controlled graceful shutdown.
     * <ol>
     *   <li>Stops accepting new tasks while allowing previously submitted tasks to complete.</li>
     *   <li>Waits up to the specified timeout for tasks to terminate.</li>
     *   <li>If tasks fail to terminate within the timeout, issues {@code shutdownNow()} to cancel lingering tasks.</li>
     * </ol>
     *
     * @param timeout the maximum time to wait
     * @param unit    the time unit of the timeout argument
     * @return {@code true} if this executor terminated, or {@code false} if the timeout elapsed before termination
     */
    public boolean shutdown(long timeout, TimeUnit unit) {
        if (executor.isShutdown()) {
            return executor.isTerminated();
        }

        executor.shutdown(); // Reject new tasks, drain queued tasks

        try {
            if (!executor.awaitTermination(timeout, unit)) {
                System.err.printf("[ConcurrencyManager] Warning: Tasks did not complete within %d %s. Forcing shutdownNow()...%n",
                        timeout, unit);
                executor.shutdownNow(); // Interrupt running workers

                if (!executor.awaitTermination(timeout, unit)) {
                    System.err.println("[ConcurrencyManager] Error: Thread pool failed to terminate completely.");
                }
            }
        } catch (InterruptedException ie) {
            System.err.println("[ConcurrencyManager] Shutdown interrupted. Issuing immediate shutdownNow()...");
            executor.shutdownNow();
            Thread.currentThread().interrupt(); // Restore interrupted status
        }

        return executor.isTerminated();
    }

    /**
     * Convenience method to gracefully shut down the thread pool with a default 5-second timeout.
     *
     * @return true if cleanly terminated, false otherwise
     */
    public boolean shutdownGracefully() {
        return shutdown(5, TimeUnit.SECONDS);
    }

    /**
     * Checks if shutdown has been initiated on the executor.
     *
     * @return true if shutdown has commenced
     */
    public boolean isShutdown() {
        return executor.isShutdown();
    }

    /**
     * Checks if all tasks have completed following shutdown.
     *
     * @return true if all tasks have completed and workers terminated
     */
    public boolean isTerminated() {
        return executor.isTerminated();
    }

    public int getPoolSize() {
        return poolSize;
    }

    public int getQueueSize() {
        return executor.getQueue().size();
    }

    public long getActiveTaskCount() {
        return activeTasks.get();
    }

    public long getSubmittedTaskCount() {
        return submittedTasks.get();
    }

    public long getCompletedTaskCount() {
        return completedTasks.get();
    }

    public long getFailedTaskCount() {
        return failedTasks.get();
    }

    private void checkNotShutdown() {
        if (executor.isShutdown()) {
            throw new RejectedExecutionException("Cannot submit task: ConcurrencyManager has already been shut down.");
        }
    }

    /**
     * Custom ThreadFactory providing predictable naming and clean exception handling.
     */
    private static class CampusPulseThreadFactory implements ThreadFactory {
        private final String prefix;
        private final AtomicInteger threadNumber = new AtomicInteger(1);

        CampusPulseThreadFactory(String prefix) {
            this.prefix = prefix;
        }

        @Override
        public Thread newThread(Runnable r) {
            Thread thread = new Thread(r, prefix + "-" + threadNumber.getAndIncrement());
            thread.setDaemon(false);
            thread.setPriority(Thread.NORM_PRIORITY);
            thread.setUncaughtExceptionHandler((t, e) ->
                    System.err.printf("[Thread %s] Uncaught exception: %s%n", t.getName(), e.getMessage()));
            return thread;
        }
    }

    /**
     * Meaningful rejection policy that produces descriptive diagnostics.
     */
    private class CustomRejectionHandler implements RejectedExecutionHandler {
        @Override
        public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
            String reason = executor.isShutdown()
                    ? "Executor is shut down"
                    : "Queue capacity reached (current queue: " + executor.getQueue().size() + ")";
            throw new RejectedExecutionException(String.format(
                    "Task rejected by CampusPulse ConcurrencyManager [%s]. Submitted: %d, Completed: %d",
                    reason, submittedTasks.get(), completedTasks.get()
            ));
        }
    }
}
