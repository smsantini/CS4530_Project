import BaseCar from './Car';

/**
 * A class that represents Cars used for movements by Players.
 */
export default class BlueCar extends BaseCar {
  constructor() {
    super(300, 'REGULAR_BLUE');
  }
}
