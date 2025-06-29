export interface ValidationError {
    rowIndex: number;
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: {
        Clients: ValidationError[];
        Workers: ValidationError[];
        Tasks: ValidationError[];
    };
}

export function validateAllData(
    clients: any[],
    workers: any[],
    tasks: any[]
): ValidationResult {
    const errors: ValidationResult["errors"] = {
        Clients: [],
        Workers: [],
        Tasks: []
    };

    const taskIDs = new Set(tasks.map(t => t["Task ID"]));
    console.log("✅ Task IDs:", tasks);
    const clientIDs = new Set<string>();
    const workerIDs = new Set<string>();

    // --- Clients ---
    clients.forEach((client, idx) => {
        const requiredFields = ["ClientID", "ClientName", "PriorityLevel"];

        // Missing fields
        requiredFields.forEach(field => {
            if (!client[field]) {
                errors.Clients.push({ rowIndex: idx, field, message: `${field} is required` });
            }
        });

        // Duplicate ID
        if (clientIDs.has(client.ClientID)) {
            errors.Clients.push({ rowIndex: idx, field: "ClientID", message: "Duplicate ClientID" });
        } else {
            clientIDs.add(client.ClientID);
        }

        // Priority out of range
        const priority = parseInt(client.PriorityLevel);
        if (isNaN(priority) || priority < 1 || priority > 5) {
            errors.Clients.push({ rowIndex: idx, field: "PriorityLevel", message: "Priority must be 1-5" });
        }

        // Broken JSON
        try {
            const parsed = JSON.parse(client.AttributesJSON || '{}');
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error();
        } catch {
            errors.Clients.push({ rowIndex: idx, field: "AttributesJSON", message: "Invalid JSON format" });
        }

        // Unknown task IDs
        const requested = (client.RequestedTaskIDs || '').split(',');
        requested.forEach(taskId => {
            if (taskId && !taskIDs.has(taskId.trim())) {
                errors.Clients.push({ rowIndex: idx, field: "RequestedTaskIDs", message: `Unknown TaskID: ${taskId}` });
            }
        });
    });

    // --- Workers ---
    workers.forEach((worker, idx) => {
        if (workerIDs.has(worker.worker_id)) {
            errors.Workers.push({ rowIndex: idx, field: "worker_id", message: "Duplicate Worker ID" });
        } else {
            workerIDs.add(worker.worker_id);
        }

        // Check available_slots
        try {
            const slots = JSON.parse(worker.available_slots || '[]');
            if (!Array.isArray(slots) || !slots.every((n: any) => !isNaN(parseInt(n)))) {
                throw new Error();
            }

            const maxLoad = parseInt(worker.max_load_per_phase);
            if (slots.length < maxLoad) {
                errors.Workers.push({ rowIndex: idx, field: "available_slots", message: "Slots < Max Load" });
            }
        } catch {
            errors.Workers.push({ rowIndex: idx, field: "available_slots", message: "Malformed slot list" });
        }
    });

    // --- Tasks ---
    tasks.forEach((task, idx) => {
        const requiredFields = ["Task ID", "Task Name", "Duration"];

        // Missing fields
        requiredFields.forEach(field => {
            if (!task[field]) {
                errors.Tasks.push({ rowIndex: idx, field, message: `${field} is required` });
            }
        });

        // Duplicate ID
        const all = tasks.filter(t => t["Task ID"] === task["Task ID"]);
        if (all.length > 1) {
            errors.Tasks.push({ rowIndex: idx, field: "Task ID", message: "Duplicate Task ID" });
        }

        // Duration check
        const dur = parseInt(task.Duration);
        if (isNaN(dur) || dur < 1) {
            errors.Tasks.push({ rowIndex: idx, field: "Duration", message: "Invalid duration (< 1)" });
        }
    });

    return {
        isValid: Object.values(errors).every(arr => arr.length === 0),
        errors
    };
}
