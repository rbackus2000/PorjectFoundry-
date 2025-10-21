import { SystemEvent } from "../zodSchemas";
import { prisma } from "../db/prisma";

type EventHandler = (event: SystemEvent) => Promise<void> | void;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to a specific event type
   */
  on(eventType: string, handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler) {
    this.on("*", handler);
  }

  /**
   * Emit an event
   * Persists to DB and triggers handlers
   */
  async emit(projectId: string, event: SystemEvent) {
    // Persist to database
    await prisma.event.create({
      data: {
        projectId,
        type: event.type,
        payload: JSON.stringify(event),
      },
    });

    // Trigger type-specific handlers
    const typeHandlers = this.handlers.get(event.type) || [];
    const anyHandlers = this.handlers.get("*") || [];
    const allHandlers = [...typeHandlers, ...anyHandlers];

    for (const handler of allHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }

  /**
   * Get event history for a project
   */
  async getHistory(projectId: string, limit = 100) {
    const events = await prisma.event.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return events.map((e) => ({
      ...e,
      payload: JSON.parse(e.payload),
    }));
  }
}

export const eventBus = new EventBus();
