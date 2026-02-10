import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";

export async function POST(req: NextRequest) {
  console.log("🚀 API ROUTE CALLED - /api/chat");
  
  try {
    const body = await req.json();
    const { n8nWebhookUrl, chatId, message, route, userId, type = "frontend", userEmail, userName } = body;

    console.log("📥 Request body:", { chatId, message, type, hasUserId: !!userId, hasWebhookUrl: !!n8nWebhookUrl, userEmail, userName });

    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { error: "Webhook URL is required", output: "Chatbot is not configured. Please contact support." },
        { status: 400 }
      );
    }

    console.log("Calling webhook:", n8nWebhookUrl);

    // Forward the request to webhook
    // Chat Trigger expects chatInput and sessionId
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatInput: message,
        sessionId: chatId,
        message: message, // Keep for backward compatibility
        chatId: chatId,
        route: route || "general",
        // Pass logged-in user info so AI won't ask for email/name
        ...(userEmail && { userEmail }),
        ...(userName && { userName }),
        isLoggedInUser: type === "user_panel" && !!userEmail,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No response body");
      console.error(`Webhook error (${response.status}):`, errorText);
      
      // Still store the user message even if webhook fails
      try {
        let convexUserId = undefined;
        if (userId && type === "user_panel") {
          const user = await fetchQuery(api.users.getUserByClerkId, { clerkUserId: userId });
          if (user) convexUserId = user._id;
        }
        await fetchMutation(api.chatbot.storeConversation, {
          sessionId: chatId,
          type: type,
          userMessage: message,
          aiResponse: "[webhook unavailable]",
          userId: convexUserId,
        });
        console.log("✅ User message stored despite webhook failure");
      } catch (storeErr) {
        console.error("❌ Failed to store message on webhook failure:", storeErr);
      }
      
      return NextResponse.json(
        { 
          error: `Webhook returned ${response.status}`,
          output: "Sorry, I'm having trouble connecting. Please check your webhook URL and ensure the workflow is active."
        },
        { status: 200 } // Return 200 so the error message displays in chat
      );
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    let data;
    
    try {
      // Get response as text first to handle both JSON and streaming
      const textResponse = await response.text();
      
      console.log("Webhook response text:", textResponse);
      console.log("Webhook response length:", textResponse.length);
      
      if (!textResponse || textResponse.trim() === "") {
        console.error("Empty response from webhook");
        return NextResponse.json({
          output: "Sorry, the webhook returned an empty response. Please check that your AI Agent has a prompt configured correctly."
        });
      }
      
      // Try to parse as JSON
      try {
        data = JSON.parse(textResponse);
        console.log("Parsed JSON data:", JSON.stringify(data));
      } catch (jsonError) {
        // If not valid JSON, it might be streaming response or multiple JSON objects
        // Try to extract JSON objects from the text
        const jsonMatches = textResponse.match(/\{[^}]+\}/g);
        if (jsonMatches && jsonMatches.length > 0) {
          // Get the last JSON object (usually contains the final output)
          try {
            data = JSON.parse(jsonMatches[jsonMatches.length - 1]);
          } catch {
            console.error("Failed to parse extracted JSON:", jsonMatches[jsonMatches.length - 1]);
            return NextResponse.json({
              output: "Sorry, I received an invalid response format from the AI. Please disable streaming in your AI Agent node."
            });
          }
        } else {
          console.error("Non-JSON response from webhook:", textResponse.substring(0, 200));
          return NextResponse.json({
            output: "Sorry, the chatbot returned an invalid response format. Please check your workflow configuration."
          });
        }
      }
    } catch (parseError) {
      console.error("Failed to parse webhook response:", parseError);
      return NextResponse.json({
        output: "Sorry, I'm having trouble processing the response. Please check your workflow configuration."
      });
    }
    
    // Chat Trigger returns response in different formats
    // Try to extract the actual message from various possible response structures
    console.log("Data type:", typeof data);
    console.log("Data keys:", Object.keys(data));
    console.log("Data.output:", data.output);
    
    let output = data.output || data.response || data.text || data.message;
    
    // If data is a string, use it directly
    if (typeof data === 'string') {
      output = data;
    }
    
    // If output is a JSON string, parse it to get the actual reply
    if (typeof output === 'string' && (output.startsWith('{') || output.startsWith('['))) {
      try {
        const parsedOutput = JSON.parse(output);
        // Extract reply from various AI response formats
        output = parsedOutput.reply || 
                 parsedOutput.response || 
                 parsedOutput.text || 
                 parsedOutput.message || 
                 parsedOutput.output ||
                 output; // fallback to original if no known field found
      } catch (e) {
        // If parsing fails, use the string as-is
        console.log("Could not parse output as JSON, using as-is");
      }
    }
    
    console.log("Final output being sent:", output);
    
    // Extract quick replies if present in webhook response
    let quickReplies = undefined;
    if (data.quickReplies && Array.isArray(data.quickReplies)) {
      quickReplies = data.quickReplies;
      console.log("Quick replies found:", JSON.stringify(quickReplies));
    } else {
      console.log("No quick replies in response. Data structure:", JSON.stringify(data));
    }

    // Store conversation in Convex after successful webhook response
    try {
      console.log("Attempting to store conversation:", {
        sessionId: chatId,
        type,
        hasUserId: !!userId,
        hasQuickReplies: !!quickReplies,
      });
      
      // If userId is provided (Clerk ID), look up the Convex user ID
      let convexUserId = undefined;
      if (userId && type === "user_panel") {
        console.log("Looking up Convex user ID for Clerk ID:", userId);
        const user = await fetchQuery(api.users.getUserByClerkId, { clerkUserId: userId });
        if (user) {
          convexUserId = user._id;
          console.log("Found Convex user ID:", convexUserId);
        } else {
          console.warn("⚠️ No Convex user found for Clerk ID:", userId);
        }
      }
      
      await fetchMutation(api.chatbot.storeConversation, {
        sessionId: chatId,
        type: type,
        userMessage: message,
        aiResponse: output || "I received your message.",
        userId: convexUserId,
        quickReplies: quickReplies || undefined,
      });
      
      console.log("✅ Conversation stored successfully in Convex");
    } catch (convexError) {
      console.error("❌ Failed to store conversation in Convex:", convexError);
      console.error("Error details:", JSON.stringify(convexError, null, 2));
      // Don't fail the request if storage fails - user still gets response
    }
    
    // Return in the format expected by ChatWidget
    return NextResponse.json({ 
      output: output || "I received your message.",
      quickReplies: quickReplies,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message", output: "Sorry, I'm having trouble connecting. Please try again later." },
      { status: 200 } // Return 200 so the error message displays in chat
    );
  }
}
