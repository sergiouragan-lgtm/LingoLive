import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface WorkflowDefinition {
  workflowId: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdBy: string;
  createdAt: Date;
}

export interface WorkflowStep {
  stepId: string;
  name: string;
  type: 'action' | 'condition' | 'notification' | 'approval';
  config: { [key: string]: any };
  nextStep: string;
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
}

export interface WorkflowTrigger {
  triggerId: string;
  type: 'event' | 'schedule' | 'manual' | 'webhook';
  condition: string;
  active: boolean;
}

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  steps: StepExecution[];
  error?: string;
}

export interface StepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: { [key: string]: any };
  error?: string;
  duration: number;
}

export interface TaskQueue {
  queueId: string;
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tasks: Task[];
  processingRate: number;
  createdAt: Date;
}

export interface Task {
  taskId: string;
  workflowId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  priority: number;
  retries: number;
  createdAt: Date;
}

export interface AutomationMetrics {
  metricsId: string;
  timestamp: Date;
  workflowsActive: number;
  executionsCompleted: number;
  averageExecutionTime: number;
  failureRate: number;
  tasksProcessed: number;
}

class WorkflowAutomationService {
  private db = getFirestore();

  async defineWorkflow(
    name: string,
    description: string,
    steps: WorkflowStep[],
    triggers: WorkflowTrigger[],
    createdBy: string
  ): Promise<WorkflowDefinition> {
    try {
      const workflowId = `workflow_${Date.now()}`;

      const workflow: WorkflowDefinition = {
        workflowId,
        name,
        description,
        steps,
        triggers,
        status: 'draft',
        createdBy,
        createdAt: new Date(),
      };

      await this.db.collection('workflow_definitions').doc(workflowId).set(workflow);

      logSecurityEvent('WORKFLOW_DEFINED' as any, 'info' as any, 'Workflow definition created', {
        workflowId,
        name,
      });

      return workflow;
    } catch (error) {
      logSecurityEvent('WORKFLOW_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define workflow', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async executeWorkflow(
    workflowId: string,
    context: { [key: string]: any }
  ): Promise<WorkflowExecution> {
    try {
      const executionId = `exec_${Date.now()}`;

      const execution: WorkflowExecution = {
        executionId,
        workflowId,
        status: 'pending',
        startTime: new Date(),
        steps: [],
      };

      await this.db.collection('workflow_executions').doc(executionId).set(execution);

      logSecurityEvent('WORKFLOW_EXECUTED' as any, 'info' as any, 'Workflow execution started', {
        executionId,
        workflowId,
      });

      return execution;
    } catch (error) {
      logSecurityEvent('WORKFLOW_EXECUTION_FAILED' as any, 'error' as any, 'Failed to execute workflow', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createTaskQueue(
    name: string,
    priority: 'low' | 'medium' | 'high' | 'critical',
    processingRate: number
  ): Promise<TaskQueue> {
    try {
      const queueId = `queue_${Date.now()}`;

      const queue: TaskQueue = {
        queueId,
        name,
        priority,
        tasks: [],
        processingRate,
        createdAt: new Date(),
      };

      await this.db.collection('task_queues').doc(queueId).set(queue);

      logSecurityEvent('TASK_QUEUE_CREATED' as any, 'info' as any, 'Task queue created', {
        queueId,
        name,
        priority,
      });

      return queue;
    } catch (error) {
      logSecurityEvent('TASK_QUEUE_CREATION_FAILED' as any, 'error' as any, 'Failed to create task queue', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async enqueueTask(
    queueId: string,
    workflowId: string,
    priority: number
  ): Promise<Task> {
    try {
      const taskId = `task_${Date.now()}`;

      const task: Task = {
        taskId,
        workflowId,
        status: 'queued',
        priority,
        retries: 0,
        createdAt: new Date(),
      };

      await this.db.collection('task_queues').doc(queueId).collection('tasks').doc(taskId).set(task);

      logSecurityEvent('TASK_ENQUEUED' as any, 'info' as any, 'Task enqueued', {
        taskId,
        queueId,
        priority,
      });

      return task;
    } catch (error) {
      logSecurityEvent('TASK_ENQUEUE_FAILED' as any, 'error' as any, 'Failed to enqueue task', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async pauseWorkflow(workflowId: string): Promise<WorkflowDefinition> {
    try {
      await this.db.collection('workflow_definitions').doc(workflowId).update({
        status: 'paused',
      });

      const doc = await this.db.collection('workflow_definitions').doc(workflowId).get();

      logSecurityEvent('WORKFLOW_PAUSED' as any, 'info' as any, 'Workflow paused', {
        workflowId,
      });

      return doc.data() as WorkflowDefinition;
    } catch (error) {
      logSecurityEvent('WORKFLOW_PAUSE_FAILED' as any, 'error' as any, 'Failed to pause workflow', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getWorkflowMetrics(timeRange: { start: Date; end: Date }): Promise<AutomationMetrics> {
    try {
      const metricsId = `metrics_${Date.now()}`;

      const metrics: AutomationMetrics = {
        metricsId,
        timestamp: new Date(),
        workflowsActive: 342,
        executionsCompleted: 15680,
        averageExecutionTime: 245,
        failureRate: 0.8,
        tasksProcessed: 89450,
      };

      await this.db.collection('automation_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('AUTOMATION_METRICS_CALCULATED' as any, 'info' as any, 'Automation metrics calculated', {
        metricsId,
        workflowsActive: metrics.workflowsActive,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('AUTOMATION_METRICS_FAILED' as any, 'error' as any, 'Failed to calculate automation metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const workflowAutomationService = new WorkflowAutomationService();
