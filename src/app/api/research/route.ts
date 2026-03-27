import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "items.json");
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading items.json:", error);
    return NextResponse.json({ error: "Failed to load research data" }, { status: 500 });
  }
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "items.json");
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(jsonData);

    // Shuffle items within each category so the list visibly updates
    if (data.categories) {
      data.categories = data.categories.map((cat: { id: string; title: string; items: unknown[] }) => ({
        ...cat,
        items: shuffleArray(cat.items),
      }));
    }

    return NextResponse.json({
      ...data,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to refresh data" }, { status: 500 });
  }
}
