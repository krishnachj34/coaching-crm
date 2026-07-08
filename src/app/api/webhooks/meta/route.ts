import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { logActivity } from "@/utils/activity";
import { sendWhatsAppNotification } from "@/utils/whatsapp";

// GET: Meta Webhook Subscription Verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Read verify token from database settings (defaulting if not configured)
  let dbVerifyToken = "coaching_crm_secret_token";
  try {
    const settings = await db.integrationSettings.findUnique({
      where: { id: "meta" }
    });
    if (settings && settings.verifyToken) {
      dbVerifyToken = settings.verifyToken;
    }
  } catch (err) {
    console.error("Failed to read Meta Verify Token from DB:", err);
  }

  if (mode === "subscribe" && token === dbVerifyToken) {
    console.log("Meta Webhook Subscription Verified.");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// POST: Meta Webhook Lead Event Listener
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received Meta Webhook Payload:", JSON.stringify(body));

    // Check if integration is enabled in database
    const settings = await db.integrationSettings.findUnique({
      where: { id: "meta" }
    });
    if (settings && !settings.enabled) {
      return NextResponse.json({ error: "Meta Integration is disabled." }, { status: 400 });
    }

    let leadData: {
      name: string;
      phone: string;
      email?: string;
      source: string;
      notes?: string;
      interest?: string;
    } | null = null;

    // 1. Check if this is a custom simplified payload for testing
    if (body.phone && body.name) {
      leadData = {
        name: body.name,
        phone: body.phone,
        email: body.email,
        source: body.source || "Facebook",
        notes: body.message || body.notes || "Inquiry submitted via social webhook (test payload).",
        interest: body.interest
      };
    } 
    // 2. Check if this is a standard Meta Lead Ad webhook (payload contains leadgen_id)
    else if (body.entry?.[0]?.changes?.[0]?.value?.leadgen_id) {
      const leadgenId = body.entry[0].changes[0].value.leadgen_id;
      const pageId = body.entry[0].id;
      
      console.log(`Processing Meta Leadgen ID: ${leadgenId}`);

      // If Access Token is configured in integration settings, we call Meta Graph API to resolve lead details
      if (settings?.accessToken) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${settings.accessToken}`
          );
          if (res.ok) {
            const metaLead = await res.json();
            const fieldData = metaLead.field_data || [];
            let name = "";
            let email = "";
            let phone = "";
            let interest = "";
            let message = "";

            const mapping = (settings?.fieldsMapping as Record<string, string> | null) || {};
            const nameField = mapping.name || "full_name";
            const phoneField = mapping.phone || "phone_number";
            const emailField = mapping.email || "email";
            const interestField = mapping.interest || "course_interest";
            const messageField = mapping.message || "message";

            fieldData.forEach((field: any) => {
              const fName = field.name;
              const fValue = field.values?.[0] || "";
              
              if (fName === nameField || fName === "first_name" || fName === "name") {
                name = name ? `${name} ${fValue}` : fValue;
              } else if (fName === emailField) {
                email = fValue;
              } else if (fName === phoneField) {
                phone = fValue;
              } else if (fName === interestField) {
                interest = fValue;
              } else if (fName === messageField) {
                message = message ? `${message}\n${fValue}` : fValue;
              } else {
                message += `${fName}: ${fValue}\n`;
              }
            });

            leadData = {
              name: name || "Meta Lead",
              phone: phone || "No Phone Provided",
              email: email || undefined,
              interest: interest || undefined,
              source: body.object === "instagram" ? "Instagram" : "Facebook",
              notes: `Lead Ad ID: ${leadgenId}\nPage ID: ${pageId}\n${message}`.trim()
            };
          } else {
            console.error("Meta Graph API error:", await res.text());
          }
        } catch (fetchErr) {
          console.error("Error calling Meta Graph API:", fetchErr);
        }
      }

      // If we couldn't resolve details (e.g. no access token), fall back to generating a mock lead entry for testing
      if (!leadData) {
        leadData = {
          name: `Meta Lead Ad Inquiry`,
          phone: `Meta-ID-${leadgenId}`,
          source: body.object === "instagram" ? "Instagram" : "Facebook",
          notes: `Meta Lead Ad webhook received (Leadgen ID: ${leadgenId}). Details could not be fetched (Verify Page Token is set).`
        };
      }
    }

    if (!leadData) {
      return NextResponse.json({ error: "Invalid webhook payload or unresolvable lead." }, { status: 400 });
    }

    // 3. Deduplication Check (match by phone or email)
    let existingLead = null;
    if (leadData.email) {
      existingLead = await db.lead.findFirst({
        where: {
          OR: [
            { phone: leadData.phone },
            { email: leadData.email }
          ]
        }
      });
    } else {
      existingLead = await db.lead.findFirst({
        where: { phone: leadData.phone }
      });
    }

    if (existingLead) {
      console.log(`Duplicate lead found: ${existingLead.name}. Updating notes...`);
      const updatedNotes = `${existingLead.notes || ""}\n\n[Meta Hook ${new Date().toLocaleDateString()}]: New inquiry from ${leadData.source}. ${leadData.notes || ""}`;
      
      const updatedLead = await db.lead.update({
        where: { id: existingLead.id },
        data: {
          status: "NEW", // Reset status to alert agents
          notes: updatedNotes
        }
      });

      // Log system activity
      await logActivity({
        userId: "system-webhook",
        userName: "Meta Webhook Integration",
        userRole: "SYSTEM",
        actionType: "UPDATED",
        module: "LEADS",
        entityId: updatedLead.id,
        description: `Webhook: Updated existing lead notes for ${updatedLead.name} due to new social inquiry (${leadData.source})`
      });

      return NextResponse.json({ success: true, status: "UPDATED", lead: updatedLead });
    } else {
      console.log(`Creating new lead: ${leadData.name} via ${leadData.source}...`);
      
      const newLead = await db.lead.create({
        data: {
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email || null,
          interest: leadData.interest || null,
          source: leadData.source,
          status: "NEW",
          notes: leadData.notes || null,
        }
      });

      // Log system activity
      await logActivity({
        userId: "system-webhook",
        userName: "Meta Webhook Integration",
        userRole: "SYSTEM",
        actionType: "CREATED",
        module: "LEADS",
        entityId: newLead.id,
        description: `Webhook: Auto-captured new lead ${newLead.name} from ${newLead.source}`
      });

      // Automatically send welcome message for Meta Lead Ad Capture
      try {
        await sendWhatsAppNotification({
          phone: newLead.phone,
          templateName: "lead_generation_welcome",
          variables: [newLead.name, newLead.interest || "General Inquiry"],
        });
      } catch (whatsappErr) {
        console.error("Failed to send automated WhatsApp welcome to Meta Lead Ad:", whatsappErr);
      }

      return NextResponse.json({ success: true, status: "CREATED", lead: newLead });
    }
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
