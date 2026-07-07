import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate using API Key
    const apiKey = req.headers.get("X-API-Key");
    const configuredKey = process.env.CRM_WEBHOOK_KEY;

    if (!configuredKey || apiKey !== configuredKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse payload
    const body = await req.json();
    const {
      mockTestId,
      email,
      rollNo,
      scores,
      feedback,
    } = body;

    // 3. Validate parameters
    if (!mockTestId) {
      return NextResponse.json({ error: "mockTestId is required." }, { status: 400 });
    }

    if (!email && !rollNo) {
      return NextResponse.json(
        { error: "Either email or rollNo is required to identify the student." },
        { status: 400 }
      );
    }

    if (!scores) {
      return NextResponse.json({ error: "Scores object is required." }, { status: 400 });
    }

    // 4. Verify mock test exists
    const mockTest = await db.mockTest.findUnique({
      where: { id: mockTestId },
    });

    if (!mockTest) {
      return NextResponse.json(
        { error: `MockTest with ID ${mockTestId} not found.` },
        { status: 404 }
      );
    }

    // 5. Find Student by email or rollNo
    let student = null;
    if (email) {
      student = await db.student.findUnique({
        where: { email },
      });
    }

    if (!student && rollNo) {
      student = await db.student.findUnique({
        where: { rollNo },
      });
    }

    if (!student) {
      return NextResponse.json(
        { error: "Student not found with the provided email or rollNo." },
        { status: 404 }
      );
    }

    // 6. Calculate overall score (average rounded to nearest 0.5)
    const lVal = parseFloat(scores.listening || "0");
    const rVal = parseFloat(scores.reading || "0");
    const wVal = parseFloat(scores.writing || "0");
    const sVal = parseFloat(scores.speaking || "0");

    const average = (lVal + rVal + wVal + sVal) / 4;
    const overall = Math.round(average * 2) / 2;

    // 7. Check if student result already exists for this mock test
    const existingResult = await db.testResult.findFirst({
      where: {
        mockTestId,
        studentId: student.id,
      },
    });

    let result;
    if (existingResult) {
      result = await db.testResult.update({
        where: { id: existingResult.id },
        data: {
          listeningScore: lVal,
          readingScore: rVal,
          writingScore: wVal,
          speakingScore: sVal,
          overallScore: overall,
          feedback: feedback || existingResult.feedback,
          submittedAt: new Date(),
        },
      });
    } else {
      result = await db.testResult.create({
        data: {
          mockTestId,
          studentId: student.id,
          listeningScore: lVal,
          readingScore: rVal,
          writingScore: wVal,
          speakingScore: sVal,
          overallScore: overall,
          feedback: feedback || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      resultId: result.id,
      action: existingResult ? "updated" : "created",
      overallScore: overall,
    });
  } catch (error: any) {
    console.error("Exam sync webhook error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error occurred" },
      { status: 500 }
    );
  }
}
