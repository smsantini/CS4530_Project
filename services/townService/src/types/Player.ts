import { nanoid } from 'nanoid';
import { ServerConversationArea } from '../client/TownsServiceClient';
import { UserLocation } from '../CoveyTypes';
import BlueCar from './car/BlueCar';
import BaseCar from './car/Car';
import GreenCar from './car/GreenCar';
import RaceCar from './car/RaceCar';
import RedCar from './car/RedCar';
import { CarType } from './car/Types';

/**
 * Each user who is connected to a town is represented by a Player object
 */
export default class Player {
  /** The current location of this user in the world map * */
  public location: UserLocation;

  /** The unique identifier for this player * */
  private readonly _id: string;

  /** The player's username, which is not guaranteed to be unique within the town * */
  private readonly _userName: string;

  /** The current ConversationArea that the player is in, or undefined if they are not located within one */
  private _activeConversationArea?: ServerConversationArea;

  private _isRacing: boolean;

  private _raceCar: BaseCar;

  private _car: BaseCar;

  constructor(userName: string, carType?: CarType) {
    this.location = {
      x: 0,
      y: 0,
      moving: false,
      rotation: 'front',
    };
    this._userName = userName;
    this._id = nanoid();
    this._isRacing = false;
    this._raceCar = new RaceCar();

    switch (carType) {
      case 'REGULAR_BLUE':
        this._car = new BlueCar();
        break;
      case 'REGULAR_RED':
        this._car = new RedCar();
        break;
      default:
        this._car = new GreenCar();
    }
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  get activeConversationArea(): ServerConversationArea | undefined {
    return this._activeConversationArea;
  }

  set activeConversationArea(conversationArea: ServerConversationArea | undefined) {
    this._activeConversationArea = conversationArea;
  }

  get car(): BaseCar {
    if (this._isRacing) {
      return this._raceCar;
    }
    return this._car;
  }

  /* We don't need this setter at this moment */
  // set car(car: BaseCar) {
  //   this._car = car;
  // }

  get isDriving(): boolean {
    return this.car.active;
  }

  set isDriving(status: boolean) {
    this.car.active = status;
  }

  get isRacing(): boolean {
    return this._isRacing;
  }

  set isRacing(status: boolean) {
    this._isRacing = status;
  }

  /**
   * Checks to see if a player's location is within the specified conversation area
   *
   * This method is resilient to floating point errors that could arise if any of the coordinates of
   * `this.location` are dramatically smaller than those of the conversation area's bounding box.
   * @param conversation
   * @returns
   */
  isWithin(conversation: ServerConversationArea): boolean {
    return (
      this.location.x > conversation.boundingBox.x - conversation.boundingBox.width / 2 &&
      this.location.x < conversation.boundingBox.x + conversation.boundingBox.width / 2 &&
      this.location.y > conversation.boundingBox.y - conversation.boundingBox.height / 2 &&
      this.location.y < conversation.boundingBox.y + conversation.boundingBox.height / 2
    );
  }
}
