"use server";

import { db } from "@/utils/db";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";

async function verifyAuth() {
  return await centralVerifyAuth();
}

export async function getReportsData() {
  await verifyAuth();

  // 1. Leads Conversion Metrics
  const totalLeads = await db.lead.count();
  const enrolledLeads = await db.lead.count({
    where: { status: "ENROLLED" },
  });
  const lostLeads = await db.lead.count({
    where: { status: "LOST" },
  });
  const conversionRate = totalLeads > 0 ? (enrolledLeads / totalLeads) * 100 : 0;

  // 2. Attendance Metrics
  const totalAttendance = await db.attendance.count();
  const presentAttendance = await db.attendance.count({
    where: { status: "PRESENT" },
  });
  const lateAttendance = await db.attendance.count({
    where: { status: "LATE" },
  });
  const absentAttendance = await db.attendance.count({
    where: { status: "ABSENT" },
  });
  
  // Treat "Late" and "Present" as present for rate calculation
  const attendanceRate =
    totalAttendance > 0
      ? ((presentAttendance + lateAttendance) / totalAttendance) * 100
      : 0;

  const totalStudents = await db.student.count();

  return {
    leadsFunnel: {
      totalLeads,
      enrolledLeads,
      lostLeads,
      conversionRate,
    },
    attendance: {
      totalAttendance,
      presentAttendance,
      lateAttendance,
      absentAttendance,
      attendanceRate,
    },
    totalStudents,
  };
}
