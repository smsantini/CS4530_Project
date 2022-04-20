import assert from 'assert';
import { useContext } from 'react';
import RacetrackLeaderboardContext from '../contexts/RacetrackLeaderboardContext';
import RacetrackLeaderboard from '../classes/Racetrack';

export default function useRacetrackLeaderboard(): RacetrackLeaderboard {
  const ctx = useContext(RacetrackLeaderboardContext);
  assert(ctx, 'RacetrackLeaderboard context should be defined.');
  return ctx;
}
