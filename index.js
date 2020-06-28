require('dotenv').config();
const WebSocket = require('ws');
const CircularLinkedList = require('CircularLinkedList.js');

const wss = new WebSocket.Server({ port: 8000 });

const { DEBUG } = process.env;
const players = [];
const MAX_PLAYER_PER_ROOM = 2;
const CMD = {
	LOGIN: 1,
	JOIN_ROOM: 2,
	LEAVE_ROOM: 3,
	GAME_ACTION: 4,
}

const Message = function(player, raw) {
	
};

const throwError = function(s) {
	if (DEBUG) throw Error(s);
	else console.error(Error(s));
}

const Player = function(ws) {
	let room = null;
	let hp = 0;
	let mp = 0;
	return {
		get ws() { return ws },
		get room() { return room; },
		get hp() { return hp; },
		get mp() { return mp; },
		init() {
			hp = 100;
			mp = 0;
		}
		leave() {
			if (room) {
				room.remove(this);
				room = null;
			}
		},
	}
}

const RoomMgr = function() {
	const rooms = [];

	function Room() {
		let players = CircularLinkedList();
		let lastTimeWait = Date.now();
		let currentPlayer = null;
		return {
			get players() { return players; };
			get currentPlayer() { return currentPlayer; },
			get lastTimeWait() { return lastTimeWait; },
			add(player) {
				players.push(player);
				player.room = this;
			},
			remove(player) {
				players.remove(player);
				player.room = null;
			},
			broadCast(message, except) {
				players.forEach(player => {
					player.ws.send(message);
				});
			},
			startGame() {
				players.forEach(player => player.init());
				currentPlayer = players[0];
			}
			nextTurn() {
				let nextPlayer = currentPlayer.next;
				while (nextPlayer.hp <= 0 && nextPlayer !== currentPlayer) { nextPlayer = nextPlayer.next; }
				if (nextPlayer === currentPlayer) return false;
				return currentPlayer = nextPlayer;
			},
		}
	}

	return {
		queue: function(player) {
			const availableRoom = rooms.sort((r1, r2) => r2.lastTimeWait - r1.lastTimeWait)
					.find(room => room.players.length < MAX_PLAYER_PER_ROOM) || Room();
			if (!availableRoom.players.length) {
				rooms.push(availableRoom);
			}
			availableRoom.add(player);
		},
	}
}

wss.on('connection', function connection(ws) {
	const player = Player(ws);
	players.push(player);

	ws.on('close', function(e) {
		player.leave();
	});
    ws.on('message', function incoming(raw) {
        console.log('received: %s', raw);

        const message = Message(player, raw);
        switch (message.cmd) {
        	case CMD.LOGIN:
        		break;
    		case CMD.JOIN_ROOM:
    			RoomMgr.join(player);
    			break;
    		case CMD.LEAVE_ROOM:
    			player.leave();
    			break;
    		case CMD.GAME_ACTION:
    			player.room.broadCast(message);
    			break;

        }
    });
});