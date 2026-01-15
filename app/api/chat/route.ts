import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { n8nWebhookUrl, chatId, message, route, userId } = body;

    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { error: "n8nWebhookUrl is required", output: "Chatbot is not configured. Please contact support." },
        { status: 400 }
      );
    }

    console.log("Calling n8n webhook:", n8nWebhookUrl);

    // Forward the request to n8n webhook
    // Match the exact format that works in the HTML version
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: chatId,
        message: message,
        route: route || "general",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No response body");
      console.error(`n8n webhook error (${response.status}):`, errorText);
      
      return NextResponse.json(
        { 
          error: `n8n webhook returned ${response.status}`,
          output: "Sorry, I'm having trouble connecting. Please check your n8n webhook URL and ensure the workflow is active."
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
      
      console.log("n8n response text:", textResponse);
      console.log("n8n response length:", textResponse.length);
      
      if (!textResponse || textResponse.trim() === "") {
        console.error("Empty response from n8n");
        return NextResponse.json({
          output: "Sorry, the n8n workflow returned an empty response. Please check that your AI Agent has a prompt configured with {{ $json.chatInput }}"
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
              output: "Sorry, I received an invalid response format from the AI. Please disable streaming in your n8n AI Agent node."
            });
          }
        } else {
          console.error("Non-JSON response from n8n:", textResponse.substring(0, 200));
          return NextResponse.json({
            output: "Sorry, the chatbot returned an invalid response format. Please check your n8n workflow configuration."
          });
        }
      }
    } catch (parseError) {
      console.error("Failed to parse n8n response:", parseError);
      return NextResponse.json({
        output: "Sorry, I'm having trouble processing the response. Please check your n8n workflow configuration."
      });
    }
    
    // Chat Trigger returns response in different formats
    // Try to extract the actual message from various possible response structures
    let output = data.output || data.response || data.text || data.message;
    
    // If data is a string, use it directly
    if (typeof data === 'string') {
      output = data;
    }
    
    // Return in the format expected by ChatWidget
    return NextResponse.json({ output: output || "I received your message." });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message", output: "Sorry, I'm having trouble connecting. Please try again later." },
      { status: 200 } // Return 200 so the error message displays in chat
    );
  }
}
