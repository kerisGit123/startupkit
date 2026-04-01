const { api } = require("./convex/_generated/api.js");

async function updateItem() {
  const result = await api.storyboard.storyboardItems.update({
    id: "sd74qr7h592eq1dbq1gp79ppxh8389qs",
    imagePrompt: "A detailed animated graph showing interest rates with smooth transitions and professional financial visualization",
    videoPrompt: "Cinematic video animation of interest rate fluctuations with dynamic charts and smooth camera movements"
  });
  console.log("✅ Updated successfully:", result);
}

updateItem().catch(console.error);
