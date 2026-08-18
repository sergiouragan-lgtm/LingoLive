export class Tracing {
  static startSpan(name: string) {
    return { end: () => console.log(`TRACE_END: ${name}`) };
  }
}
