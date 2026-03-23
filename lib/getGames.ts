export type Game = {
    id: number;
    opponent: string;
    date: string;
  };
  
  export async function getFsuBaseballGames(): Promise<Game[]> {
    const res = await fetch("https://seminoles.com/sports/baseball/schedule/text", {
      next: { revalidate: 60 * 60 * 12 }, // refresh every 12 hours
    });
  
    const text = await res.text();
  
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  
    const monthRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+/i;
  
    const games: Game[] = [];
    let id = 1;
  
    for (const line of lines) {
      // Only keep lines that look like schedule rows
      if (!monthRegex.test(line)) continue;
  
      // Example line shape from the FSU text schedule page:
      // Mar 27 (Fri)6:00 PM Home Duke Tallahassee, Fla. (Mike Martin Field at Dick Howser Stadium) -
      const isHomeGame =
        line.includes(" Home ") &&
        line.includes("Dick Howser Stadium");
  
      if (!isHomeGame) continue;
  
      const dateMatch = line.match(
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+\s+\([A-Za-z]{3}\)/i
      );
  
      const homeIndex = line.indexOf(" Home ");
      const tallahasseeIndex = line.indexOf(" Tallahassee");
  
      if (!dateMatch || homeIndex === -1 || tallahasseeIndex === -1) continue;
  
      const date = dateMatch[0].replace(/\s+\([A-Za-z]{3}\)/, "");
      const opponent = line
        .slice(homeIndex + " Home ".length, tallahasseeIndex)
        .trim()
        .replace(/^#\d+\s*/, "");
  
      games.push({
        id: id++,
        opponent,
        date,
      });
    }
  
    return games;
  }