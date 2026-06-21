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

export interface ScoreItem {
  name: string;
  score: string;
}

export interface ScoresApiResponseItem {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: ScoreItem[] | null;
}

export async function fetchMatchesFromAPI(apiKey: string): Promise<Match[]> {
  if (!apiKey) {
    console.warn('The Odds API key is missing. Cannot fetch matches.');
    return [];
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
    console.error('API fetch matches failed:', error);
    return [];
  }
}

export async function fetchScoresFromAPI(apiKey: string): Promise<ScoresApiResponseItem[]> {
  if (!apiKey) {
    console.warn('The Odds API key is missing. Cannot fetch scores.');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=${apiKey}&daysFrom=3`
    );
    if (!response.ok) {
      throw new Error('API fetch scores failed');
    }
    return await response.json() as ScoresApiResponseItem[];
  } catch (error) {
    console.error('API fetch scores failed:', error);
    return [];
  }
}
