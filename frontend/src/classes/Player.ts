import Car from './Car/Car';
import { ServerCar, CarType, RaceCarType } from './Car/Types';

const PLAYER_WALKING_SPEED = 175;

export default class Player {
  public location?: UserLocation;

  private readonly _id: string;

  private readonly _userName: string;

  public sprite?: Phaser.GameObjects.Sprite;

  public label?: Phaser.GameObjects.Text;

  public car: Car;

  private raceCar: Car;

  private _isRacing: boolean;

  constructor(id: string, userName: string, location: UserLocation, car: Car) {
    this._id = id;
    this._userName = userName;
    this.location = location;
    this.car = car;
    this._isRacing = false;
    this.raceCar = new Car(700, 'RACE', false);
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  get isDriving(): boolean {
    return this.car.active;
  }

  set isDriving(isDriving: boolean) {
    this.car.active = isDriving;
  }

  get isRacing(): boolean {
    return this._isRacing;
  }

  set isRacing(isRacing: boolean) {
    this._isRacing = isRacing;
    this.raceCar.active = isRacing;
  }

  get carType(): CarType | RaceCarType {
    if (this.isRacing) {
      return this.raceCar.type;
    }
    return this.car.type;
  }

  get speed(): number {
    if (this.isRacing) {
      return this.raceCar.speed;
    }
    return this.isDriving ? this.car.speed : PLAYER_WALKING_SPEED;
  }

  static fromServerPlayer(playerFromServer: ServerPlayer): Player {
    const car = Car.fromServerCar(playerFromServer._car);
    return new Player(playerFromServer._id, playerFromServer._userName, playerFromServer.location, car);
  }
}

export type ServerPlayer = { _id: string, _userName: string, location: UserLocation, _car: ServerCar };

export type Direction = 'front'|'back'|'left'|'right';

export type UserLocation = {
  x: number,
  y: number,
  rotation: Direction,
  moving: boolean,
  conversationLabel?: string
};

export type PlayerProperties = {
  carType: CarType
}
