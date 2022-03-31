import Car from './Car/Car';
import { ServerCar } from './Car/Types';

const PLAYER_WALKING_SPEED = 175;

export default class Player {
  public location?: UserLocation;

  private readonly _id: string;

  private readonly _userName: string;

  public sprite?: Phaser.GameObjects.Sprite;

  public label?: Phaser.GameObjects.Text;

  public car: Car;

  constructor(id: string, userName: string, location: UserLocation, car: Car) {
    this._id = id;
    this._userName = userName;
    this.location = location;
    this.car = car;
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

  get speed(): number {
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
