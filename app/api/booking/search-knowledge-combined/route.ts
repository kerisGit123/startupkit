import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || query.trim() === "") {
      return NextResponse.json(
        { 
          success: false,
          message: "Query parameter is required",
          results: [],
          count: 0 
        },
        { status: 400 }
      );
    }

    // Search both frontend and user_panel knowledge bases
    const frontendArticles = await convex.query(api.knowledgeBase.searchArticles, {
      type: "frontend",
      query,
    });

    const userPanelArticles = await convex.query(api.knowledgeBase.searchArticles, {
      type: "user_panel",
      query,
    });

    // Combine results - return more articles so AI can analyze and pick the right ones
    const allArticles = [...frontendArticles, ...userPanelArticles];
    const topArticles = allArticles.slice(0, 15);

    // Concatenate all articles into one big chunk with better formatting for AI analysis
    const concatenatedContent = topArticles
      .map((article: any, index: number) => 
        `Article ${index + 1}: ${article.title}\nSource: ${article.type}\nCategory: ${article.category}\nTags: ${article.tags.join(', ')}\nKeywords: ${article.keywords?.join(', ') || 'N/A'}\n\nContent:\n${article.content}`
      )
      .join('\n\n---\n\n');

    return NextResponse.json({
      success: true,
      content: concatenatedContent,
      count: topArticles.length,
      source: "combined",
      breakdown: {
        frontend: frontendArticles.length,
        user_panel: userPanelArticles.length,
      },
    });
  } catch (error) {
    console.error("Knowledge base search error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to search knowledge base", 
        message: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
