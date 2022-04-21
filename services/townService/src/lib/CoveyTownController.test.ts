import { nanoid } from 'nanoid';
import { mock, mockDeep, mockReset } from 'jest-mock-extended';
import { Socket } from 'socket.io';
import TwilioVideo from './TwilioVideo';
import Player from '../types/Player';
import CoveyTownController from './CoveyTownController';
import CoveyTownListener from '../types/CoveyTownListener';
import { UserLocation } from '../CoveyTypes';
import PlayerSession from '../types/PlayerSession';
import { townSubscriptionHandler } from '../requestHandlers/CoveyTownRequestHandlers';
import CoveyTownsStore from './CoveyTownsStore';
import * as TestUtils from '../client/TestUtils';

const mockTwilioVideo = mockDeep<TwilioVideo>();
jest.spyOn(TwilioVideo, 'getInstance').mockReturnValue(mockTwilioVideo);

function generateTestLocation(): UserLocation {
  return {
    rotation: 'back',
    moving: Math.random() < 0.5,
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
  };
}

describe('CoveyTownController', () => {
  beforeEach(() => {
    mockTwilioVideo.getTokenForTown.mockClear();
  });
  it('constructor should set the friendlyName property', () => { 
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    expect(townController.friendlyName)
      .toBe(townName);
  });
  describe('addPlayer', () => { 
    it('should use the coveyTownID and player ID properties when requesting a video token',
      async () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const newPlayerSession = await townController.addPlayer(new Player(nanoid()));
        expect(mockTwilioVideo.getTokenForTown).toBeCalledTimes(1);
        expect(mockTwilioVideo.getTokenForTown).toBeCalledWith(townController.coveyTownID, newPlayerSession.player.id);
      });
  });
  describe('town listeners and events', () => {
    let testingTown: CoveyTownController;
    const mockListeners = [mock<CoveyTownListener>(),
      mock<CoveyTownListener>(),
      mock<CoveyTownListener>()];
    beforeEach(() => {
      const townName = `town listeners and events tests ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
      mockListeners.forEach(mockReset);
    });
    it('should notify added listeners of player movement when updatePlayerLocation is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const newLocation = generateTestLocation();
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.updatePlayerLocation(player, newLocation);
      mockListeners.forEach(listener => expect(listener.onPlayerMoved).toBeCalledWith(player));
    });
    it('should notify added listeners of player disconnections when destroySession is called', async () => {
      const player = new Player('test player');
      const session = await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.destroySession(session);
      mockListeners.forEach(listener => expect(listener.onPlayerDisconnected).toBeCalledWith(player));
    });
    it('should notify added listeners of new players when addPlayer is called', async () => {
      mockListeners.forEach(listener => testingTown.addTownListener(listener));

      const player = new Player('test player');
      await testingTown.addPlayer(player);
      mockListeners.forEach(listener => expect(listener.onPlayerJoined).toBeCalledWith(player));

    });
    it('should notify added listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.disconnectAllPlayers();
      mockListeners.forEach(listener => expect(listener.onTownDestroyed).toBeCalled());

    });
    it('should not notify removed listeners of player movement when updatePlayerLocation is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const newLocation = generateTestLocation();
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.updatePlayerLocation(player, newLocation);
      expect(listenerRemoved.onPlayerMoved).not.toBeCalled();
    });
    it('should not notify removed listeners of player disconnections when destroySession is called', async () => {
      const player = new Player('test player');
      const session = await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.destroySession(session);
      expect(listenerRemoved.onPlayerDisconnected).not.toBeCalled();

    });
    it('should not notify removed listeners of new players when addPlayer is called', async () => {
      const player = new Player('test player');

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      const session = await testingTown.addPlayer(player);
      testingTown.destroySession(session);
      expect(listenerRemoved.onPlayerJoined).not.toBeCalled();
    });

    it('should not notify removed listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.disconnectAllPlayers();
      expect(listenerRemoved.onTownDestroyed).not.toBeCalled();

    });
  });
  describe('townSubscriptionHandler', () => {
    const mockSocket = mock<Socket>();
    let testingTown: CoveyTownController;
    let player: Player;
    let session: PlayerSession;
    beforeEach(async () => {
      const townName = `connectPlayerSocket tests ${nanoid()}`;
      testingTown = CoveyTownsStore.getInstance().createTown(townName, false);
      mockReset(mockSocket);
      player = new Player('test player');
      session = await testingTown.addPlayer(player);
    });
    it('should reject connections with invalid town IDs by calling disconnect', async () => {
      TestUtils.setSessionTokenAndTownID(nanoid(), session.sessionToken, mockSocket);
      townSubscriptionHandler(mockSocket);
      expect(mockSocket.disconnect).toBeCalledWith(true);
    });
    it('should reject connections with invalid session tokens by calling disconnect', async () => {
      TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, nanoid(), mockSocket);
      townSubscriptionHandler(mockSocket);
      expect(mockSocket.disconnect).toBeCalledWith(true);
    });
    describe('with a valid session token', () => {
      it('should add a town listener, which should emit "newPlayer" to the socket when a player joins', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        await testingTown.addPlayer(player);
        expect(mockSocket.emit).toBeCalledWith('newPlayer', player);
      });
      it('should add a town listener, which should emit "playerMoved" to the socket when a player moves', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.updatePlayerLocation(player, generateTestLocation());
        expect(mockSocket.emit).toBeCalledWith('playerMoved', player);

      });
      it('should add a town listener, which should emit "playerDisconnect" to the socket when a player disconnects', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.destroySession(session);
        expect(mockSocket.emit).toBeCalledWith('playerDisconnect', player);
      });
      it('should add a town listener, which should emit "townClosing" to the socket and disconnect it when disconnectAllPlayers is called', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.disconnectAllPlayers();
        expect(mockSocket.emit).toBeCalledWith('townClosing');
        expect(mockSocket.disconnect).toBeCalledWith(true);
      });
      describe('when a socket disconnect event is fired', () => {
        it('should remove the town listener for that socket, and stop sending events to it', async () => {
          TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
          townSubscriptionHandler(mockSocket);

          // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
          if (disconnectHandler && disconnectHandler[1]) {
            disconnectHandler[1]();
            const newPlayer = new Player('should not be notified');
            await testingTown.addPlayer(newPlayer);
            expect(mockSocket.emit).not.toHaveBeenCalledWith('newPlayer', newPlayer);
          } else {
            fail('No disconnect handler registered');
          }
        });
        it('should destroy the session corresponding to that socket', async () => {
          TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
          townSubscriptionHandler(mockSocket);

          // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
          if (disconnectHandler && disconnectHandler[1]) {
            disconnectHandler[1]();
            mockReset(mockSocket);
            TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
            townSubscriptionHandler(mockSocket);
            expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
          } else {
            fail('No disconnect handler registered');
          }

        });
      });
      it('should forward playerMovement events from the socket to subscribed listeners', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        // find the 'playerMovement' event handler for the socket, which should have been registered after the socket was connected
        const playerMovementHandler = mockSocket.on.mock.calls.find(call => call[0] === 'playerMovement');
        if (playerMovementHandler && playerMovementHandler[1]) {
          const newLocation = generateTestLocation();
          player.location = newLocation;
          playerMovementHandler[1](newLocation);
          expect(mockListener.onPlayerMoved).toHaveBeenCalledWith(player);
        } else {
          fail('No playerMovement handler registered');
        }
      });
    });
  });
  describe('addConversationArea', () => {
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `addConversationArea test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should add the conversation area to the list of conversation areas', ()=>{
      const newConversationArea = TestUtils.createConversationForTesting();
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);
      const areas = testingTown.conversationAreas;
      expect(areas.length).toEqual(2);
      expect(areas[1].label).toEqual(newConversationArea.label);
      expect(areas[1].topic).toEqual(newConversationArea.topic);
      expect(areas[1].boundingBox).toEqual(newConversationArea.boundingBox);
    });
  });
  describe('updatePlayerLocation', () =>{
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `updatePlayerLocation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should respect the conversation area reported by the player userLocation.conversationLabel, and not override it based on the player\'s x,y location', async ()=>{
      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: newConversationArea.label };
      testingTown.updatePlayerLocation(player, newLocation);
      expect(player.activeConversationArea?.label).toEqual(newConversationArea.label);
      expect(player.activeConversationArea?.topic).toEqual(newConversationArea.topic);
      expect(player.activeConversationArea?.boundingBox).toEqual(newConversationArea.boundingBox);

      const areas = testingTown.conversationAreas;
      expect(areas[1].occupantsByID.length).toBe(1);
      expect(areas[1].occupantsByID[0]).toBe(player.id);

    }); 
    it('should emit an onConversationUpdated event when a conversation area gets a new occupant', async () =>{

      const newConversationArea = TestUtils.createConversationForTesting({ boundingBox: { x: 10, y: 10, height: 5, width: 5 } });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
      const newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25, conversationLabel: newConversationArea.label };
      testingTown.updatePlayerLocation(player, newLocation);
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(1);
    });
  });
  describe('player car actions', () => {
    let testingTown: CoveyTownController;
    let player: Player;
    const mockListeners = [mock<CoveyTownListener>(),
      mock<CoveyTownListener>(),
      mock<CoveyTownListener>()];
    beforeEach(() => {
      const townName = `player car action tests ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
      player = new Player(nanoid());
      testingTown.addPlayer(player);
      mockListeners.forEach(mockReset);
    });

    describe('playerEnterCar', () => {
      it('should update player to have an active car', () => {
        expect(player.isDriving).toBeFalsy();
        testingTown.playerEnterCar(player);
        expect(player.isDriving).toBeTruthy();
      });
      it('should update listeners that player has entered car', () => {
        mockListeners.forEach(listener => testingTown.addTownListener(listener));
        mockListeners.forEach(l => expect(l.onPlayerEnteredCar).not.toBeCalled());
        testingTown.playerEnterCar(player);
        mockListeners.forEach(l => expect(l.onPlayerEnteredCar).toBeCalled());
      });
    });

    describe('playerExitCar', () => {
      beforeEach(() => {
        player.isDriving = true;
      });

      it('should update player to have an active car', () => {
        expect(player.isDriving).toBeTruthy();
        testingTown.playerExitCar(player);
        expect(player.isDriving).toBeFalsy();
      });
      it('should update listeners that player has entered car', () => {
        mockListeners.forEach(listener => testingTown.addTownListener(listener));
        mockListeners.forEach(l => expect(l.onPlayerExitedCar).not.toBeCalled());
        testingTown.playerExitCar(player);
        mockListeners.forEach(l => expect(l.onPlayerExitedCar).toBeCalled());
      });
    });

    describe('select car types', () => {
      it('creates the correct car object of the player when the car type is selected', async () => {
        const player1 = new Player(nanoid(), 'REGULAR_GREEN');
        const player2 = new Player(nanoid(), 'REGULAR_BLUE');
        const player3 = new Player(nanoid(), 'REGULAR_RED');
        const playerSession1 = await testingTown.addPlayer(player1);
        expect(playerSession1.player.car.type).toBe('REGULAR_GREEN');
        const playerSession2 = await testingTown.addPlayer(player2);
        expect(playerSession2.player.car.type).toBe('REGULAR_BLUE');
        const playerSession3 = await testingTown.addPlayer(player3);
        expect(playerSession3.player.car.type).toBe('REGULAR_RED');
      });
    });
  });
  describe('racetrack', () =>{
    let testingTown: CoveyTownController;
    const mockListeners = [mock<CoveyTownListener>(),
      mock<CoveyTownListener>(),
      mock<CoveyTownListener>()];

    beforeEach(() => {
      const townName = `${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
      mockListeners.forEach(mockReset);
    });

    it('creates the racetrack conversation area when the town is created', async () => {
      const racetrackConversationArea = testingTown.conversationAreas[0];
      expect(racetrackConversationArea.label).toBe('Racetrack Leaderboard');
      expect(racetrackConversationArea.topic).toBe('View and discuss race times!');
      expect(racetrackConversationArea.occupantsByID).toHaveLength(0);
    });

    describe('car race', () => {
      it('updates the racetrack and player correctly when a player starts a race', async () => {
        mockListeners.forEach(listener => testingTown.addTownListener(listener));
        const player = new Player(nanoid(), 'REGULAR_BLUE');
        testingTown.playerStartRace(player, new Date(50000));
        expect(player.isRacing).toBeTruthy();
        expect(player.isDriving).toBeFalsy();
        expect(player.car.type).toBe('RACE');
        expect(player.car.speed).toBe(700);
        expect(testingTown.raceTrack.ongoingRaces[0]).toStrictEqual({ id: player.id, startTime: new Date(50000) });
        mockListeners.forEach(l => expect(l.onRaceStarted).toBeCalled());
      });

      it('updates the racetrack and player correctly when a player finishes a race', async () => {
        mockListeners.forEach(listener => testingTown.addTownListener(listener));
        const player = new Player(nanoid(), 'REGULAR_BLUE');
        await testingTown.playerStartRace(player, new Date(50000));
        await testingTown.playerFinishRace(player, new Date(60000));
        expect(player.isRacing).toBeFalsy();
        expect(player.isDriving).toBeFalsy();
        expect(player.car.type).toBe('REGULAR_BLUE');
        expect(testingTown.raceTrack.ongoingRaces).toHaveLength(0);
        expect(testingTown.raceTrack.scoreBoard[0]).toStrictEqual({ userName: player.userName, time: new Date(10000) });
        mockListeners.forEach(l => expect(l.onRaceFinished).toBeCalled());
      });

      it('sorts the scoreboard correctly', async () => {
        const player1 = new Player(nanoid(), 'REGULAR_BLUE');
        await testingTown.playerStartRace(player1, new Date(50000));
        const player2 = new Player(nanoid(), 'REGULAR_BLUE');
        await testingTown.playerStartRace(player2, new Date(50000));
        const player3 = new Player(nanoid(), 'REGULAR_BLUE');
        await testingTown.playerStartRace(player3, new Date(50000));
        await testingTown.playerFinishRace(player2, new Date(57000));
        expect(testingTown.raceTrack.scoreBoard[0]).toStrictEqual({ userName: player2.userName, time: new Date(7000) });
        await testingTown.playerFinishRace(player1, new Date(60000));
        await testingTown.playerFinishRace(player3, new Date(55000));
        expect(testingTown.raceTrack.ongoingRaces).toHaveLength(0);
        expect(testingTown.raceTrack.scoreBoard[0]).toStrictEqual({ userName: player3.userName, time: new Date(5000) });
        expect(testingTown.raceTrack.scoreBoard[1]).toStrictEqual({ userName: player2.userName, time: new Date(7000) });
        expect(testingTown.raceTrack.scoreBoard[2]).toStrictEqual({ userName: player1.userName, time: new Date(10000) });
      });

      it('does not add race record to score board if no record of this player in ongoingRaces', async () => {
        const player1 = new Player(nanoid(), 'REGULAR_BLUE');
        await testingTown.playerFinishRace(player1, new Date(60000));
        expect(testingTown.raceTrack.scoreBoard).toHaveLength(0);
      });
    });
  });
});
