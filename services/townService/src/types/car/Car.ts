import { CarType, CarSpeed } from './Types';

/**
 * A class that represents Cars used for movements by Players.
 */
export default abstract class BaseCar {
  /** The speed of this Car instance */
  private readonly _speed: CarSpeed;

  /** The type of this Car instance (used for visual presentation purposes) */
  private readonly _type: CarType;

  private _active: boolean;

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
}
