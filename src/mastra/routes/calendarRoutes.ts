import { db } from '../../db/client.js';
import { cryptoEvents, tokenUnlocks, airdropTracking, userEventReminders } from '../../db/schema';
import { desc, eq, gte, lte, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const calendarRoutes = [
  {
    path: "/api/calendar/events",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');
        const eventType = c.req.query('type');

        let query = db.select().from(cryptoEvents);
        
        if (startDate) {
          query = query.where(gte(cryptoEvents.eventDate, new Date(startDate))) as any;
        }
        if (endDate) {
          query = query.where(lte(cryptoEvents.eventDate, new Date(endDate))) as any;
        }
        
        const events = await query.orderBy(cryptoEvents.eventDate).limit(100);

        return c.json({ events });
      } catch (error: any) {
        logger?.error('Calendar events error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/calendar/unlocks",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const days = parseInt(c.req.query('days') || '30');
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const unlocks = await db.select()
          .from(tokenUnlocks)
          .where(and(
            gte(tokenUnlocks.unlockDate, now),
            lte(tokenUnlocks.unlockDate, futureDate)
          ))
          .orderBy(tokenUnlocks.unlockDate)
          .limit(50);

        return c.json({ unlocks });
      } catch (error: any) {
        logger?.error('Token unlocks error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/calendar/airdrops",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const status = c.req.query('status') || 'upcoming';

        const airdrops = await db.select()
          .from(airdropTracking)
          .where(eq(airdropTracking.status, status))
          .orderBy(desc(airdropTracking.updatedAt))
          .limit(50);

        return c.json({ airdrops });
      } catch (error: any) {
        logger?.error('Airdrops error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/calendar/reminders",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');
        if (!userId) return c.json({ error: 'userId required' }, 400);

        const reminders = await db.select()
          .from(userEventReminders)
          .where(eq(userEventReminders.userId, userId))
          .orderBy(userEventReminders.reminderTime);

        return c.json({ reminders });
      } catch (error: any) {
        logger?.error('Reminders error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/calendar/reminders",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { userId, eventId, eventType, reminderTime } = await c.req.json();
        if (!userId || !eventId || !eventType || !reminderTime) {
          return c.json({ error: 'Missing required fields' }, 400);
        }

        const reminder = {
          id: uuidv4(),
          userId,
          eventId,
          eventType,
          reminderTime: new Date(reminderTime),
          notified: false,
          createdAt: new Date()
        };

        await db.insert(userEventReminders).values(reminder);
        return c.json({ success: true, reminder });
      } catch (error: any) {
        logger?.error('Create reminder error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  }
];
