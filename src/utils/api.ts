export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_odd: number;
  draw_odd: number;
  away_odd: number;
  status: 'pending' | 'completed';
  home_score?: number;
  away_score?: number;
}

interface Outcome {
  name: string;
  price: number;
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

interface OddsApiResponseItem {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export function generateMockMatches(): Match[] {
  const now = new Date();
  const day = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'mock-match-1',
      home_team: 'Arjantin',
      away_team: 'Fransa',
      commence_time: day(0), // Today
      home_odd: 2.10,
      draw_odd: 3.20,
      away_odd: 3.50,
      status: 'pending'
    },
    {
      id: 'mock-match-2',
      home_team: 'Brezilya',
      away_team: 'Almanya',
      commence_time: day(1), // Tomorrow
      home_odd: 1.85,
      draw_odd: 3.60,
      away_odd: 4.20,
      status: 'pending'
    },
    {
      id: 'mock-match-3',
      home_team: 'İspanya',
      away_team: 'İtalya',
      commence_time: day(2), // In 2 days
      home_odd: 2.30,
      draw_odd: 3.10,
      away_odd: 3.20,
      status: 'pending'
    }
  ];
}

export async function fetchMatchesFromAPI(apiKey: string): Promise<Match[]> {
  if (!apiKey) {
    return generateMockMatches();
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${apiKey}&regions=eu&markets=h2h`
    );
    if (!response.ok) {
      throw new Error('API fetch failed');
    }
    const data = await response.json() as OddsApiResponseItem[];

    return data.map((item: OddsApiResponseItem) => {
      const h2h = item.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
      const homeOdd = h2h.find((o: Outcome) => o.name === item.home_team)?.price || 2.0;
      const awayOdd = h2h.find((o: Outcome) => o.name === item.away_team)?.price || 2.0;
      const drawOdd = h2h.find((o: Outcome) => o.name === 'Draw')?.price || 3.0;

      return {
        id: item.id,
        home_team: item.home_team,
        away_team: item.away_team,
        commence_time: item.commence_time,
        home_odd: homeOdd,
        draw_odd: drawOdd,
        away_odd: awayOdd,
        status: 'pending'
      };
    });
  } catch (error) {
    console.error('API fetch failed, falling back to mock data:', error);
    return generateMockMatches();
  }
}
