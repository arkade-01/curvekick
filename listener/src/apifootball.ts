/**
 * Thin wrapper around API-Football v3.
 * Free tier: 100 requests/day — we only call during active match windows.
 *
 * Docs: https://www.api-football.com/documentation-v3
 */

const BASE_URL = "https://v3.football.api-sports.io";

export type FixtureStatus =
  | "NS"   // Not Started
  | "1H"   // First Half
  | "HT"   // Half Time
  | "2H"   // Second Half
  | "ET"   // Extra Time
  | "BT"   // Break Time (before ET)
  | "P"    // Penalty Shootout
  | "SUSP" // Suspended
  | "INT"  // Interrupted
  | "FT"   // Full Time
  | "AET"  // After Extra Time
  | "PEN"  // After Penalties
  | "PST"  // Postponed
  | "CANC" // Cancelled
  | "ABD"  // Abandoned
  | "AWD"  // Technical Loss
  | "WO"   // WalkOver
  | "LIVE";

export interface FixtureResult {
  fixtureId: number;
  status: FixtureStatus;
  homeGoals: number | null;
  awayGoals: number | null;
  homeTeam: string;
  awayTeam: string;
}

interface ApiResponse {
  errors: Record<string, string> | string[];
  results: number;
  response: ApiFixture[];
}

interface ApiFixture {
  fixture: {
    id: number;
    status: { short: string; long: string };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

async function apiFetch(path: string): Promise<ApiResponse> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY not set");

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": key,
    },
  });

  if (!res.ok) throw new Error(`API-Football HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<ApiResponse>;
}

/** Fetch the current status of a single fixture by its API-Football ID. */
export async function getFixture(fixtureId: number): Promise<FixtureResult | null> {
  const data = await apiFetch(`/fixtures?id=${fixtureId}`);

  if (data.results === 0 || data.response.length === 0) return null;

  const f = data.response[0];
  return {
    fixtureId: f.fixture.id,
    status: f.fixture.status.short as FixtureStatus,
    homeGoals: f.goals.home,
    awayGoals: f.goals.away,
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
  };
}

/** Returns true if the match is definitely over (goals are final). */
export function isMatchFinished(status: FixtureStatus): boolean {
  return ["FT", "AET", "PEN", "AWD", "WO"].includes(status);
}

/**
 * Derive the on-chain outcome (0=HOME, 1=DRAW, 2=AWAY) from final scores.
 * Returns null if scores are unavailable.
 */
export function deriveOutcome(home: number | null, away: number | null): 0 | 1 | 2 | null {
  if (home === null || away === null) return null;
  if (home > away) return 0;
  if (home === away) return 1;
  return 2;
}
