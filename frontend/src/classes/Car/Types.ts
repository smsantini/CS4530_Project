export type CarType = 'REGULAR_GREEN' | 'REGULAR_BLUE' | 'REGULAR_RED';
export type CarSpeed = 300 | 450;

export type ServerCar = { _speed: CarSpeed, _type: CarType, _active: boolean };
