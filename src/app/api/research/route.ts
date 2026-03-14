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

export async function POST() {
  // In a real app, this would trigger the actual research logic.
  // For now, we return the same data to simulate a successful refresh.
  try {
    const filePath = path.join(process.cwd(), "src", "data", "items.json");
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to refresh data" }, { status: 500 });
  }
}
