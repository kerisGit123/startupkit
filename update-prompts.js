// Quick script to update imagePrompt and videoPrompt for testing
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("./convex/_generated/api.js");

const client = new ConvexHttpClient({
  url: "https://shocking-hound-526.convex.cloud",
});

async function updatePrompts() {
  try {
    // Update the item with your ID
    await client.mutation(api.storyboard.storyboardItems.update, {
      id: "sd74qr7h592eq1dbq1gp79ppxh8389qs",
      imagePrompt: "A detailed animated graph showing interest rates with smooth transitions and professional financial visualization",
      videoPrompt: "Cinematic video animation of interest rate fluctuations with dynamic charts and smooth camera movements"
    });
    
    console.log("✅ Successfully updated prompts!");
  } catch (error) {
    console.error("❌ Error updating prompts:", error);
  }
}

updatePrompts();
