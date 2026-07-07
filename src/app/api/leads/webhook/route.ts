import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { sendWhatsAppNotification } from "@/utils/whatsapp";

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
      name,
      phone,
      email,
      interest,
      source = "WEBHOOK",
      notes,
      trialStartDate,
      trialEndDate,
      branchId,
    } = body;

    // 3. Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and Phone are required fields." },
        { status: 400 }
      );
    }

    // Sanitize phone number (remove spaces, dashes, etc.)
    const sanitizedPhone = phone.replace(/[^0-9+]/g, "");

    // 4. Check for existing lead by phone
    const existingLead = await db.lead.findFirst({
      where: {
        phone: sanitizedPhone,
      },
    });

    let lead;
    let isNew = false;

    const parsedTrialStart = trialStartDate ? new Date(trialStartDate) : null;
    const parsedTrialEnd = trialEndDate ? new Date(trialEndDate) : null;

    if (existingLead) {
      // Append to notes of existing lead
      const timestamp = new Date().toISOString().split("T")[0];
      const appendedNote = `[Re-submitted via ${source} on ${timestamp}] ${notes || ""}`;
      const newNotes = existingLead.notes
        ? `${existingLead.notes}\n${appendedNote}`
        : appendedNote;

      lead = await db.lead.update({
        where: { id: existingLead.id },
        data: {
          name, // update name if changed
          email: email || existingLead.email,
          interest: interest || existingLead.interest,
          status: "NEW", // Reset status to NEW on new ad form query submission
          source,
          trialStartDate: parsedTrialStart || existingLead.trialStartDate,
          trialEndDate: parsedTrialEnd || existingLead.trialEndDate,
          notes: newNotes,
        },
      });
    } else {
      isNew = true;
      // Fetch default branch if branchId is not provided
      let finalBranchId = branchId;
      if (!finalBranchId) {
        const firstBranch = await db.branch.findFirst();
        if (firstBranch) {
          finalBranchId = firstBranch.id;
        }
      }

      lead = await db.lead.create({
        data: {
          name,
          phone: sanitizedPhone,
          email: email || null,
          interest: interest || null,
          status: trialStartDate ? "TRIAL" : "NEW",
          source,
          trialStartDate: parsedTrialStart,
          trialEndDate: parsedTrialEnd,
          notes: notes || null,
          branchId: finalBranchId || null,
        },
      });
    }

    // 5. Send automated WhatsApp message
    try {
      if (parsedTrialStart) {
        // Send trial welcome message
        await sendWhatsAppNotification({
          phone: sanitizedPhone,
          templateName: "free_trial_welcome",
          variables: [
            name,
            interest || "Trial Course",
            parsedTrialStart.toLocaleDateString(),
          ],
        });
      } else {
        // Send standard ad lead welcome
        await sendWhatsAppNotification({
          phone: sanitizedPhone,
          templateName: "lead_generation_welcome",
          variables: [name, interest || "General Inquiry"],
        });
      }
    } catch (whatsappErr) {
      console.error("Failed to send automated WhatsApp webhook notification:", whatsappErr);
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      action: isNew ? "created" : "updated",
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error occurred" },
      { status: 500 }
    );
  }
}
