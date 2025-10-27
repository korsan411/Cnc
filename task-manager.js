/**
 * Task Manager for handling asynchronous operations with queuing
 */
class TaskManager {
    constructor() {
        this.queue = [];
        this.isRunning = false;
        this.currentTask = null;
        this.completedTasks = 0;
        this.failedTasks = 0;
        this.taskHistory = [];
        this.maxHistory = 50;
    }

    /**
     * Add a task to the queue
     */
    async addTask(taskFn, description = 'مهمة') {
        return new Promise((resolve, reject) => {
            const task = {
                id: Date.now() + Math.random(),
                taskFn,
                description,
                resolve,
                reject,
                added: Date.now(),
                status: 'pending'
            };
            
            this.queue.push(task);
            this.taskHistory.push({ ...task, status: 'queued' });
            
            if (!this.isRunning) {
                this.processQueue();
            }
            
            console.log(`📋 تمت إضافة مهمة: ${description} (${this.queue.length} في قائمة الانتظار)`);
        });
    }

    /**
     * Process the next task in the queue
     */
    async processQueue() {
        if (this.queue.length === 0) {
            this.isRunning = false;
            return;
        }

        this.isRunning = true;
        const task = this.queue.shift();
        this.currentTask = task;

        try {
            task.status = 'running';
            task.started = Date.now();
            
            showProgress(task.description);
            console.log(`▶️ بدء المهمة: ${task.description}`);
            
            const result = await task.taskFn();
            
            task.status = 'completed';
            task.completed = Date.now();
            task.duration = task.completed - task.started;
            
            this.completedTasks++;
            task.resolve(result);
            
            console.log(`✅ اكتملت المهمة: ${task.description} (${task.duration}ms)`);
            showToast(`تم إكمال ${task.description}`);
            
        } catch (error) {
            task.status = 'failed';
            task.completed = Date.now();
            task.duration = task.completed - task.started;
            task.error = error.message;
            
            this.failedTasks++;
            console.error(`❌ فشلت المهمة: ${task.description}:`, error);
            showToast(`فشل في ${task.description}: ${error.message}`, 5000);
            
            task.reject(error);
        } finally {
            this.currentTask = null;
            hideProgress();
            
            // Clean up history
            if (this.taskHistory.length > this.maxHistory) {
                this.taskHistory = this.taskHistory.slice(-this.maxHistory);
            }
            
            // Process next task after a short delay
            setTimeout(() => this.processQueue(), 50);
        }
    }

    /**
     * Clear all pending tasks
     */
    clear() {
        const pendingCount = this.queue.length;
        this.queue.forEach(task => {
            task.status = 'cancelled';
            task.reject(new Error('تم إلغاء المهمة'));
        });
        this.queue = [];
        this.isRunning = false;
        this.currentTask = null;
        
        console.log(`🗑️ تم مسح ${pendingCount} مهمة معلقة`);
        showToast(`تم إلغاء ${pendingCount} مهمة`);
    }

    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            pending: this.queue.length,
            running: this.isRunning ? 1 : 0,
            completed: this.completedTasks,
            failed: this.failedTasks,
            currentTask: this.currentTask ? this.currentTask.description : null,
            history: this.taskHistory.slice(-10) // Last 10 tasks
        };
    }

    /**
     * Wait for all tasks to complete
     */
    async waitForAll() {
        while (this.isRunning || this.queue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Check if task manager is busy
     */
    isBusy() {
        return this.isRunning || this.queue.length > 0;
    }

    /**
     * Get queue length
     */
    getQueueLength() {
        return this.queue.length;
    }

    /**
     * Prioritize a task (move to front of queue)
     */
    prioritizeTask(taskId) {
        const index = this.queue.findIndex(task => task.id === taskId);
        if (index > 0) {
            const [task] = this.queue.splice(index, 1);
            this.queue.unshift(task);
            console.log(`⬆️ تمت أولوية المهمة: ${task.description}`);
            return true;
        }
        return false;
    }

    /**
     * Remove a specific task from queue
     */
    removeTask(taskId) {
        const index = this.queue.findIndex(task => task.id === taskId);
        if (index >= 0) {
            const [task] = this.queue.splice(index, 1);
            task.status = 'removed';
            task.reject(new Error('تمت إزالة المهمة'));
            console.log(`❌ تمت إزالة المهمة: ${task.description}`);
            return true;
        }
        return false;
    }
}

// Create global instance
const taskManager = new TaskManager();

// Convenience function for adding tasks
function addTask(taskFn, description) {
    return taskManager.addTask(taskFn, description);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TaskManager, taskManager, addTask };
}
