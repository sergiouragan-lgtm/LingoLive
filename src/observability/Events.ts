export class Events {
  static emit(eventName: string, payload: Record<string, any>) {
    console.log(`EVENT: ${eventName}`, payload);
  }
}
