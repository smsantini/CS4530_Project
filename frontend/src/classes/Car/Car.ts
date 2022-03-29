import { CarType, CarSpeed, ServerCar } from './Types';

export default class Car {

  private readonly _speed: CarSpeed;

  private readonly _type: CarType;

  private _active: boolean;

  // public sprite?: Phaser.GameObjects.Sprite;

  constructor(speed: CarSpeed, type: CarType) {
    this._speed = speed;
    this._type = type;
    this._active = false;
  }

  get speed(): CarSpeed {
    return this._speed;
  }

  get type(): CarType {
    return this._type;
  }

  get active(): boolean {
    return this._active;
  }

  set active(status: boolean) {
    this._active = status;
  }

  static fromServerCar(carFromServer: ServerCar): Car {
    return new Car(carFromServer._speed, carFromServer._type);
  }
}
