import BaseCar from './Car';

/**
 * A class that represents Cars used for movements by Players.
 */
export default class RaceCar extends BaseCar {
  constructor() {
    super(700, 'RACE');
  }
}
