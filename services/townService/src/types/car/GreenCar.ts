import BaseCar from './Car';

/**
 * A class that represents Cars used for movements by Players.
 */
export default class GreenCar extends BaseCar {
  constructor() {
    super(1.25, 'REGULAR_GREEN');
  }
}
