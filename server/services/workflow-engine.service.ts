import { getFirestore } from 'firebase-admin/firestore';
export interface Workflow { workflowId: string; name: string; steps: string[]; status: string; }
class WorkflowEngineService {
  private db = getFirestore();
  async createWorkflow(name: string, steps: string[]): Promise<Workflow> {
    const workflowId = `wf_${Date.now()}`;
    const workflow: Workflow = { workflowId, name, steps, status: 'draft' };
    await this.db.collection('workflows').doc(workflowId).set(workflow);
    return workflow;
  }
}
export const workflowEngineService = new WorkflowEngineService();
