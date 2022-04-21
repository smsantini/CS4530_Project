import { CarType, CarSpeed, ServerCar, RaceCarType } from './Types';

export default class Car {

  private readonly _speed: CarSpeed;

  private readonly _type: CarType | RaceCarType;

  private _active: boolean;

  // public sprite?: Phaser.GameObjects.Sprite;

  constructor(speed: CarSpeed, type: CarType | RaceCarType, active: boolean) {
    this._speed = speed;
    this._type = type;
    this._active = active;
  }

  get speed(): CarSpeed {
    return this._speed;
  }

  get type(): CarType | RaceCarType {
    return this._type;
  }

  get active(): boolean {
    return this._active;
  }

  set active(status: boolean) {
    this._active = status;
  }

  static fromServerCar(carFromServer: ServerCar): Car {
    return new Car(carFromServer._speed, carFromServer._type, carFromServer._active);
  }
}
