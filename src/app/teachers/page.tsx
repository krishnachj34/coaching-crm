import React from "react";
import TeachersManagerClient from "@/components/TeachersManagerClient";
import { getTeachers, getTeacherLeaves } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const [teachers, leaves] = await Promise.all([
    getTeachers(),
    getTeacherLeaves(),
  ]);

  return <TeachersManagerClient teachers={teachers} leaves={leaves} />;
}
