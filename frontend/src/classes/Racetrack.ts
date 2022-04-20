export type RaceResult = {
    userName: string,
    time: Date
};

export type OngoingRace = {
  id: string,
  startTime: Date
};

export type Racetrack = {
  scoreBoard: RaceResult[];
  ongoingRaces: OngoingRace[];
};

export default class RacetrackLeaderboard {

    public data: RaceResult[];

    constructor(data: RaceResult[]) {
        this.data = data;
    }

    update(data: RaceResult[]): void {
        this.data = data;
    }

    toString(): string {
        const formattedResults = this.data.map((rr: RaceResult) => `${rr.userName}: ${rr.time.getMinutes()}:${rr.time.getSeconds()}:${rr.time.getMilliseconds()}`).join('\n');
        return `Racetrack Leaderboard scores:\n${formattedResults}`;
    }
}