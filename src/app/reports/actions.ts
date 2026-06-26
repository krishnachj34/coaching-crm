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

  // 5. Calculate student signup growth trend (last 6 months)
  const studentsRaw = await db.student.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyCounts: Record<string, number> = {};
  const today = new Date();
  const last6MonthsList: { name: string; count: number; cumulative: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
    monthlyCounts[monthLabel] = 0;
    last6MonthsList.push({ name: monthLabel, count: 0, cumulative: 0 });
  }

  studentsRaw.forEach((student) => {
    const date = new Date(student.createdAt);
    const monthLabel = `${months[date.getMonth()]} ${date.getFullYear().toString().substr(-2)}`;
    if (monthLabel in monthlyCounts) {
      monthlyCounts[monthLabel]++;
    }
  });

  let cumulativeCount = 0;
  if (last6MonthsList.length > 0) {
    const firstMonthDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    cumulativeCount = studentsRaw.filter(s => new Date(s.createdAt) < firstMonthDate).length;
  }

  const growthTrend = last6MonthsList.map((m) => {
    const count = monthlyCounts[m.name] || 0;
    cumulativeCount += count;
    return {
      name: m.name,
      count,
      cumulative: cumulativeCount,
    };
  });

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
    growthTrend,
  };
}
