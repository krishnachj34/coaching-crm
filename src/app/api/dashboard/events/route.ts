import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { verifyAuth } from "@/utils/auth";
import { serializePrisma } from "@/utils/serialize";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    await verifyAuth();

    // 1. Fetch UpcomingEvents
    const upcomingEvents = await db.upcomingEvent.findMany({
      orderBy: { date: "asc" },
    });

    // 2. Fetch LiveClasses (including their Batch and Teacher details)
    const liveClasses = await db.liveClass.findMany({
      include: {
        batch: {
          include: {
            teacher: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { date: "asc" },
    });

    // 3. Combine into a unified event format
    const unifiedEvents: any[] = [];

    upcomingEvents.forEach((evt) => {
      unifiedEvents.push({
        id: evt.id,
        title: evt.title,
        type: evt.type, // DEMO_CLASS, WORKSHOP, WEBINAR
        date: evt.date,
        time: evt.time,
        instructor: evt.instructor,
        platform: evt.platform,
        link: evt.link || null,
        extra: evt.platform === "ONLINE" ? "Online Room" : "Offline Campus"
      });
    });

    liveClasses.forEach((cls) => {
      unifiedEvents.push({
        id: cls.id,
        title: `${cls.title} (Batch: ${cls.batch.name})`,
        type: "CLASS",
        date: cls.date,
        time: cls.time,
        instructor: cls.batch.teacher?.name || "Faculty",
        platform: "ONLINE",
        link: cls.meetingLink,
        extra: `Batch: ${cls.batch.name}`
      });
    });

    // Sort by date and then time
    unifiedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(serializePrisma(unifiedEvents));
  } catch (err: any) {
    console.error("Failed to fetch dashboard events:", err);
    return NextResponse.json({ error: err.message || "Failed to load events." }, { status: 500 });
  }
}
