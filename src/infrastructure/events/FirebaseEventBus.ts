import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { DomainEvent } from "../../shared/events/Event";

export class FirebaseEventBus {
  private readonly eventsCollection = collection(db, "events");
  private readonly dlqCollection = collection(db, "dead_letter_queue");

  async publish(event: DomainEvent): Promise<void> {
    try {
      await addDoc(this.eventsCollection, {
        ...event,
        occurredOn: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to publish event, moving to DLQ:", error);
      await this.moveToDLQ(event, error);
    }
  }

  private async moveToDLQ(event: DomainEvent, error: any): Promise<void> {
    await addDoc(this.dlqCollection, {
      event,
      error: error.message,
      failedAt: serverTimestamp(),
    });
  }
}
