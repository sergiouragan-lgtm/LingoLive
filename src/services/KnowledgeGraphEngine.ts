import { doc, getDoc, setDoc, query, where, collection, getDocs, and } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { GraphNode, GraphEdge, NodeType } from '../graph/types';
import { eventBus } from '../analytics/bus/EventBus';
import { BaseEvent } from '../analytics/events/types';

export class KnowledgeGraphEngine {
  constructor() {
    this.setupEventSubscriptions();
  }

  private setupEventSubscriptions() {
    eventBus.subscribeGlobal(async (event: BaseEvent) => {
      if (auth.currentUser) {
        await this.sync(event);
      } else {
        console.log('KnowledgeGraphEngine: Skipping sync, user not authenticated');
      }
    });
  }

  async sync(event: BaseEvent) {
    console.log('KnowledgeGraphEngine: Syncing event', event.eventName, event);
    
    switch (event.eventName) {
      case 'LESSON_COMPLETED':
        await this.handleLessonCompleted(event);
        break;
      // Add more event handlers here
      default:
        console.log('KnowledgeGraphEngine: No handler for event', event.eventName);
    }
  }

  private async handleLessonCompleted(event: BaseEvent) {
    const { userId, payload } = event;
    const lessonId = payload.lessonId;
    if (!userId || !lessonId) return;

    // Create edge 'Completed' from User to Lesson
    const edge: GraphEdge = {
        id: `completed_${userId}_${lessonId}`,
        source: userId,
        target: lessonId,
        type: 'Completed',
        metadata: { timestamp: event.timestamp },
        createdAt: new Date().toISOString()
    };
    await this.createEdge(edge);
    console.log('KnowledgeGraphEngine: Synced LESSON_COMPLETED');
  }

  // --- Node Operations ---
  async createNode(node: GraphNode): Promise<void> {
    const nodeRef = doc(db, 'graph_nodes', node.id);
    await setDoc(nodeRef, { ...node, createdAt: new Date().toISOString() });
  }

  async getNode(nodeId: string): Promise<GraphNode | null> {
    const nodeRef = doc(db, 'graph_nodes', nodeId);
    const snap = await getDoc(nodeRef);
    return snap.exists() ? (snap.data() as GraphNode) : null;
  }

  async getNodesByType(type: NodeType): Promise<GraphNode[]> {
    const nodesRef = collection(db, 'graph_nodes');
    const q = query(nodesRef, where('type', '==', type));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as GraphNode);
  }

  // --- Edge Operations ---
  async createEdge(edge: GraphEdge): Promise<void> {
    const edgeRef = doc(db, 'graph_edges', edge.id);
    await setDoc(edgeRef, { ...edge, createdAt: new Date().toISOString() });
  }

  async getEdgesFromSource(sourceNodeId: string): Promise<GraphEdge[]> {
    const edgesRef = collection(db, 'graph_edges');
    const q = query(edgesRef, where('source', '==', sourceNodeId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as GraphEdge);
  }

  async getEdgesToTarget(targetNodeId: string): Promise<GraphEdge[]> {
    const edgesRef = collection(db, 'graph_edges');
    const q = query(edgesRef, where('target', '==', targetNodeId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as GraphEdge);
  }

  // --- Traversal / Query Operations ---
  async getRelatedNodes(nodeId: string, edgeType: string, direction: 'source' | 'target' = 'source'): Promise<GraphNode[]> {
    const edgesRef = collection(db, 'graph_edges');
    const q = direction === 'source' 
        ? query(edgesRef, and(where('source', '==', nodeId), where('type', '==', edgeType)))
        : query(edgesRef, and(where('target', '==', nodeId), where('type', '==', edgeType)));
    
    const snap = await getDocs(q);
    const relatedIds = snap.docs.map(doc => direction === 'source' ? doc.data().target : doc.data().source);
    
    if (relatedIds.length === 0) return [];
    
    const nodes: GraphNode[] = [];
    for (const id of relatedIds) {
        const node = await this.getNode(id);
        if (node) nodes.push(node);
    }
    return nodes;
  }
}

export const knowledgeGraphEngine = new KnowledgeGraphEngine();
