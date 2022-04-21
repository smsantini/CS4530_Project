export type CarType = 'REGULAR_GREEN' | 'REGULAR_BLUE' | 'REGULAR_RED';
export type RaceCarType = 'RACE';
export type CarSpeed = 300 | 700;

export type ServerCar = { _speed: CarSpeed, _type: CarType | RaceCarType, _active: boolean };
