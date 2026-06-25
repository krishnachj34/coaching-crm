"use server";

import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

async function verifyAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  return user;
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

  // 2. Financial Metrics
  const payments = await db.payment.findMany();
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRevenueAttempted = totalPaid + totalPending;
  const collectionRate =
    totalRevenueAttempted > 0 ? (totalPaid / totalRevenueAttempted) * 100 : 0;

  // 3. Attendance Metrics
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

  // 4. Course Enrollment & Revenue Metrics
  const courses = await db.course.findMany({
    include: {
      enrollments: true,
    },
  });

  const courseStats = courses.map((course) => {
    const studentCount = course.enrollments.length;
    const monthlyRevenue = studentCount * Number(course.feeAmount);
    return {
      id: course.id,
      title: course.title,
      feeAmount: Number(course.feeAmount),
      studentCount,
      monthlyRevenue,
    };
  });

  const totalStudents = await db.student.count();

  return {
    leadsFunnel: {
      totalLeads,
      enrolledLeads,
      lostLeads,
      conversionRate,
    },
    financials: {
      totalPaid,
      totalPending,
      collectionRate,
    },
    attendance: {
      totalAttendance,
      presentAttendance,
      lateAttendance,
      absentAttendance,
      attendanceRate,
    },
    courses: courseStats,
    totalStudents,
  };
}
