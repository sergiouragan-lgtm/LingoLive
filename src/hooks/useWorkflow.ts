import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Workflow {
  workflowId: string;
  name: string;
  definition: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
}

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface WorkflowTask {
  taskId: string;
  executionId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: Record<string, any>;
  output?: Record<string, any>;
}

export function useWorkflow(workflowId: string) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWorkflow = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<Workflow>(`/workflows/${workflowId}`);
      if (res.error) {
        setError(res.error);
      } else {
        setWorkflow(res.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  const executeWorkflow = useCallback(
    async (input: Record<string, any>) => {
      setIsLoading(true);
      try {
        const res = await apiClient.post<WorkflowExecution>(
          `/workflows/${workflowId}/execute`,
          { input }
        );
        if (res.error) {
          throw new Error(res.error);
        }
        return res.data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to execute workflow';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [workflowId]
  );

  const updateWorkflow = useCallback(
    async (updates: Partial<Workflow>) => {
      try {
        const res = await apiClient.put<Workflow>(`/workflows/${workflowId}`, updates);
        if (res.error) {
          throw new Error(res.error);
        }
        setWorkflow(res.data || null);
        return res.data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update workflow';
        setError(errorMsg);
        throw err;
      }
    },
    [workflowId]
  );

  return { workflow, isLoading, error, getWorkflow, executeWorkflow, updateWorkflow };
}

export function useWorkflowExecution(executionId: string) {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExecution = useCallback(async () => {
    setIsLoading(true);
    try {
      const execRes = await apiClient.get<WorkflowExecution>(`/workflows/executions/${executionId}`);
      if (execRes.error) {
        setError(execRes.error);
      } else {
        setExecution(execRes.data || null);

        // Load tasks for this execution
        const tasksRes = await apiClient.get<WorkflowTask[]>(
          `/workflows/executions/${executionId}/tasks`
        );
        if (!tasksRes.error) {
          setTasks(tasksRes.data || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load execution');
    } finally {
      setIsLoading(false);
    }
  }, [executionId]);

  const pollExecution = useCallback(async () => {
    const poll = async () => {
      const execRes = await apiClient.get<WorkflowExecution>(
        `/workflows/executions/${executionId}`
      );
      if (execRes.data) {
        setExecution(execRes.data);

        if (execRes.data.status === 'completed' || execRes.data.status === 'failed') {
          return false; // Stop polling
        }
      }
      return true; // Continue polling
    };

    let shouldContinue = true;
    const interval = setInterval(async () => {
      shouldContinue = await poll();
      if (!shouldContinue) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [executionId]);

  return { execution, tasks, isLoading, error, loadExecution, pollExecution };
}

export function useWorkflowBuilder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkflow = useCallback(
    async (name: string, definition: Record<string, any>) => {
      setIsLoading(true);
      try {
        const res = await apiClient.post<Workflow>('/workflows/create', {
          name,
          definition,
        });
        if (res.error) {
          throw new Error(res.error);
        }
        return res.data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create workflow';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, error, createWorkflow };
}
