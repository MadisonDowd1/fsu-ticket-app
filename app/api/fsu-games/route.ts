import { NextResponse } from "next/server";

type Game = {
  id: number;
  opponent: string;
  date: string;
};

export async function GET() {
  try {
    const response = await fetch(
      "https://seminoles.com/sports/baseball/schedule/text",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not load FSU baseball schedule." },
        { status: 500 }
      );
    }

    const text = await response.text();

    const regex =
      /([A-Z][a-z]{2}\s+\d{1,2})\s+\([A-Za-z]{3}\)\s*(?:DH\s*Game\s*\d+\s*)?(?:\d{1,2}(?::\d{2})?\s*(?:AM|PM)(?:\s*ET)?)\s*Home\s*(#\d+\s*)?(.+?)\s*Tallahassee,\s*Fla\./g;

    const games: Game[] = [];
    let match;
    let id = 1;

    while ((match = regex.exec(text)) !== null) {
      const date = match[1].trim();
      const opponent = match[3].trim();

      games.push({
        id: id++,
        opponent,
        date,
      });
    }

    return NextResponse.json(games);
  } catch (error) {
    console.error("FSU games route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch FSU games." },
      { status: 500 }
    );
  }
}