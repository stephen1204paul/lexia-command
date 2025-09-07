/**
 * Performance Monitor
 * Tracks and analyzes performance metrics for Raycast-style command bar
 */

// Performance thresholds (in milliseconds)
const PERFORMANCE_TARGETS = {
    COMMAND_BAR_OPEN: 50,        // Command bar should open instantly
    INITIAL_COMMANDS: 100,       // Initial commands should load very fast
    SEARCH_RESPONSE: 50,         // Search should feel instant
    BACKGROUND_LOAD: 1000,       // Background loading acceptable up to 1s
    CACHE_ACCESS: 10,            // Cache should be nearly instant
    API_REQUEST: 2000            // API requests should complete within 2s
};

// Performance categories for different operations
const OPERATION_TYPES = {
    CACHE_ACCESS: 'cache_access',
    SEARCH: 'search', 
    API_REQUEST: 'api_request',
    RENDER: 'render',
    USER_INTERACTION: 'user_interaction'
};

/**
 * Performance measurement utilities
 */
class PerformanceTracker {
    constructor() {
        this.metrics = new Map();
        this.sessions = [];
        this.currentSession = null;
        this.observers = [];
    }

    /**
     * Start a new performance session
     */
    startSession(sessionId = null) {
        this.currentSession = {
            id: sessionId || `session-${Date.now()}`,
            startTime: performance.now(),
            operations: [],
            userInteractions: 0,
            cacheHits: 0,
            cacheMisses: 0,
            searchCount: 0,
            apiCalls: 0
        };
    }

    /**
     * End current session and analyze results
     */
    endSession() {
        if (!this.currentSession) return null;

        this.currentSession.endTime = performance.now();
        this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
        
        const analysis = this.analyzeSession(this.currentSession);
        this.sessions.push({ ...this.currentSession, analysis });
        
        const session = this.currentSession;
        this.currentSession = null;
        
        return session;
    }

    /**
     * Measure operation performance
     */
    measure(operationType, operationName, operation) {
        const startTime = performance.now();
        let result;
        let error = null;

        try {
            // Handle both sync and async operations
            if (typeof operation === 'function') {
                result = operation();
            } else {
                result = operation;
            }

            // If it's a promise, handle async timing
            if (result && typeof result.then === 'function') {
                return result.then(
                    (asyncResult) => {
                        this.recordMeasurement(operationType, operationName, startTime, null);
                        return asyncResult;
                    },
                    (asyncError) => {
                        this.recordMeasurement(operationType, operationName, startTime, asyncError);
                        throw asyncError;
                    }
                );
            } else {
                this.recordMeasurement(operationType, operationName, startTime, null);
                return result;
            }
        } catch (syncError) {
            error = syncError;
            this.recordMeasurement(operationType, operationName, startTime, error);
            throw error;
        }
    }

    /**
     * Record a measurement
     */
    recordMeasurement(operationType, operationName, startTime, error = null) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const target = PERFORMANCE_TARGETS[operationName.toUpperCase()] || 1000;
        const isSlowOperation = duration > target;

        const measurement = {
            type: operationType,
            name: operationName,
            duration,
            startTime,
            endTime,
            target,
            isSlowOperation,
            error: error ? error.message : null,
            timestamp: Date.now()
        };

        // Store in metrics
        const key = `${operationType}-${operationName}`;
        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }
        this.metrics.get(key).push(measurement);

        // Add to current session
        if (this.currentSession) {
            this.currentSession.operations.push(measurement);
            this.updateSessionCounters(operationType, error);
        }

        // Log performance issues
        if (isSlowOperation) {
            console.warn(`⚠️ Slow operation: ${operationName} took ${duration.toFixed(1)}ms (target: ${target}ms)`);
        }

        // Notify observers
        this.notifyObservers('measurement', measurement);

        return measurement;
    }

    /**
     * Update session counters
     */
    updateSessionCounters(operationType, error) {
        if (!this.currentSession) return;

        switch (operationType) {
            case OPERATION_TYPES.CACHE_ACCESS:
                if (error) {
                    this.currentSession.cacheMisses++;
                } else {
                    this.currentSession.cacheHits++;
                }
                break;
            case OPERATION_TYPES.SEARCH:
                this.currentSession.searchCount++;
                break;
            case OPERATION_TYPES.API_REQUEST:
                this.currentSession.apiCalls++;
                break;
            case OPERATION_TYPES.USER_INTERACTION:
                this.currentSession.userInteractions++;
                break;
        }
    }

    /**
     * Analyze session performance
     */
    analyzeSession(session) {
        const operations = session.operations;
        const slowOperations = operations.filter(op => op.isSlowOperation);
        const averageDuration = operations.length > 0 
            ? operations.reduce((sum, op) => sum + op.duration, 0) / operations.length 
            : 0;

        const operationsByType = operations.reduce((acc, op) => {
            if (!acc[op.type]) acc[op.type] = [];
            acc[op.type].push(op);
            return acc;
        }, {});

        const cacheHitRate = session.cacheHits + session.cacheMisses > 0
            ? (session.cacheHits / (session.cacheHits + session.cacheMisses) * 100)
            : 0;

        return {
            overall: {
                totalOperations: operations.length,
                averageDuration: averageDuration.toFixed(2),
                slowOperations: slowOperations.length,
                slowOperationRate: ((slowOperations.length / operations.length) * 100).toFixed(1)
            },
            cache: {
                hitRate: cacheHitRate.toFixed(1),
                hits: session.cacheHits,
                misses: session.cacheMisses
            },
            search: {
                totalSearches: session.searchCount,
                averageSearchTime: this.getAverageForType(operationsByType[OPERATION_TYPES.SEARCH])
            },
            api: {
                totalCalls: session.apiCalls,
                averageResponseTime: this.getAverageForType(operationsByType[OPERATION_TYPES.API_REQUEST])
            },
            recommendations: this.generateRecommendations(session, slowOperations)
        };
    }

    /**
     * Generate performance recommendations
     */
    generateRecommendations(session, slowOperations) {
        const recommendations = [];

        // Cache recommendations
        const cacheHitRate = session.cacheHits + session.cacheMisses > 0
            ? (session.cacheHits / (session.cacheHits + session.cacheMisses) * 100)
            : 0;
        
        if (cacheHitRate < 70) {
            recommendations.push({
                type: 'cache',
                priority: 'high',
                message: `Low cache hit rate (${cacheHitRate.toFixed(1)}%). Consider preloading more content or increasing cache TTL.`
            });
        }

        // Search performance recommendations
        const searchOps = slowOperations.filter(op => op.type === OPERATION_TYPES.SEARCH);
        if (searchOps.length > 0) {
            recommendations.push({
                type: 'search',
                priority: 'medium',
                message: `${searchOps.length} slow search operations detected. Consider optimizing search index or reducing search scope.`
            });
        }

        // API performance recommendations
        const apiOps = slowOperations.filter(op => op.type === OPERATION_TYPES.API_REQUEST);
        if (apiOps.length > 0) {
            recommendations.push({
                type: 'api',
                priority: 'high',
                message: `${apiOps.length} slow API calls detected. Consider caching more aggressively or optimizing queries.`
            });
        }

        return recommendations;
    }

    /**
     * Get average duration for operation type
     */
    getAverageForType(operations) {
        if (!operations || operations.length === 0) return 0;
        return (operations.reduce((sum, op) => sum + op.duration, 0) / operations.length).toFixed(2);
    }

    /**
     * Get performance summary
     */
    getSummary() {
        const allMeasurements = Array.from(this.metrics.values()).flat();
        const recentMeasurements = allMeasurements.filter(
            m => Date.now() - m.timestamp < 5 * 60 * 1000 // Last 5 minutes
        );

        const slowOperations = recentMeasurements.filter(m => m.isSlowOperation);

        return {
            totalMeasurements: allMeasurements.length,
            recentMeasurements: recentMeasurements.length,
            slowOperations: slowOperations.length,
            averagePerformance: this.getOverallAverage(recentMeasurements),
            performanceGrade: this.calculateGrade(recentMeasurements),
            sessions: this.sessions.length,
            recommendations: this.getTopRecommendations()
        };
    }

    /**
     * Calculate performance grade
     */
    calculateGrade(measurements) {
        if (measurements.length === 0) return 'N/A';

        const slowRate = (measurements.filter(m => m.isSlowOperation).length / measurements.length) * 100;
        
        if (slowRate < 5) return 'A';
        if (slowRate < 10) return 'B';
        if (slowRate < 20) return 'C';
        if (slowRate < 35) return 'D';
        return 'F';
    }

    /**
     * Get overall average performance
     */
    getOverallAverage(measurements) {
        if (measurements.length === 0) return 0;
        return (measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length).toFixed(2);
    }

    /**
     * Get top recommendations
     */
    getTopRecommendations() {
        const recentSessions = this.sessions.slice(-5); // Last 5 sessions
        const allRecommendations = recentSessions
            .map(s => s.analysis?.recommendations || [])
            .flat();

        // Group by type and count occurrences
        const grouped = allRecommendations.reduce((acc, rec) => {
            if (!acc[rec.type]) acc[rec.type] = { count: 0, messages: new Set() };
            acc[rec.type].count++;
            acc[rec.type].messages.add(rec.message);
            return acc;
        }, {});

        return Object.entries(grouped)
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 3)
            .map(([type, data]) => ({
                type,
                count: data.count,
                message: Array.from(data.messages)[0] // Take first unique message
            }));
    }

    /**
     * Add observer for performance events
     */
    addObserver(callback) {
        this.observers.push(callback);
    }

    /**
     * Remove observer
     */
    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    /**
     * Notify observers
     */
    notifyObservers(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.warn('Observer callback failed:', error);
            }
        });
    }

    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics.clear();
        this.sessions = [];
        this.currentSession = null;
    }

    /**
     * Export metrics for analysis
     */
    exportMetrics() {
        return {
            metrics: Object.fromEntries(this.metrics),
            sessions: this.sessions,
            summary: this.getSummary(),
            timestamp: Date.now()
        };
    }
}

// Create singleton instance
export const performanceTracker = new PerformanceTracker();

// Convenience functions
export const measureOperation = (type, name, operation) => {
    return performanceTracker.measure(type, name, operation);
};

export const measureAsync = async (type, name, asyncOperation) => {
    return performanceTracker.measure(type, name, asyncOperation);
};

export const startPerformanceSession = (sessionId) => {
    return performanceTracker.startSession(sessionId);
};

export const endPerformanceSession = () => {
    return performanceTracker.endSession();
};

// Export constants
export { PERFORMANCE_TARGETS, OPERATION_TYPES };

// Development helper to log performance stats
if (process.env.NODE_ENV === 'development') {
    window.lexiaPerformance = {
        tracker: performanceTracker,
        summary: () => performanceTracker.getSummary(),
        export: () => performanceTracker.exportMetrics(),
        clear: () => performanceTracker.clearMetrics()
    };
}