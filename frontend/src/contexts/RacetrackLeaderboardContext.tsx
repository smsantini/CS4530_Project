import React from 'react';
import RacetrackLeaderboard from '../classes/Racetrack';

/**
 * Hint: You will never need to use this directly. Instead, use the
 * `useConversationAreas` hook.
 */
const Context = React.createContext<RacetrackLeaderboard>(new RacetrackLeaderboard([]));

export default Context;
