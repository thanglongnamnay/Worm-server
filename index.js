require('dotenv').config();
const WebSocket = require('ws');
const CircularLinkedList = require('./CircularLinkedList.js');

const wss = new WebSocket.Server({ port: 8000 });

const { DEBUG } = process.env;

const rand = Math.random.bind(Math);
let players = [];
const MAX_PLAYER_PER_ROOM = 2;
const CMD = {
	LOGIN: 1,
	JOIN_ROOM: 2,
	LEAVE_ROOM: 3,
	GAME_ACTION: 4,
	START: 5,
	YOUR_ID: 6,
	NEXT_TURN: 7,
	SYNC_PLAYER: 8,
	END_GAME: 9,

};
const REV_CMD = {};
for (const prop in CMD) REV_CMD[CMD[prop]] = prop;
let id = 0;

/**
 * @return {string}
 */
const OutPacket = function({cmd, params = []}) {
	return [cmd, ...params].join('|');
};

const Params = function(params) {
	let p = 0;
	return {
		getNumber() {
			if (p >= params.length) p = 0;
			return +params[p++];
		},
		getString() {
			if (p >= params.length) p = 0;
			return params[p++] + '';
		},
	}
};

const Message = function(player, raw) {
	const strs = raw.split('|');
	return {
		cmd: +strs[0],
		params: Params(strs.slice(1)),
	}
};

const throwError = function(s) {
	if (DEBUG) throw Error(s);
	else console.error(Error(s));
};

const Player = function(ws) {
	let room = null;
	let _id = ++id, name = (rand() * 10000).toString(36), x = 0, y = 0, hp = 0, mp = 0, angle = 10;
	return {
		get id() { return _id; },
		name,
		get ws() { return ws; },
		get room() { return room; },
		get x() { return x; },
		get y() { return y; },
		get hp() { return hp; },
		get mp() { return mp; },
		get angle() { return angle; },
		init(r) {
			room = r;
			x = 200 + rand() * 600 >> 0;
			y = 400 + rand() * 400 >> 0;
			hp = 100;
			mp = 0;
		},
		leave() {
			RoomMgr.remove(this);
			console.log("Players:" , players);	
		},
		sync({params}) {
			params.getNumber();
			x = params.getNumber();
			y = params.getNumber();
			hp = params.getNumber();
			mp = params.getNumber();
			angle = params.getNumber();
			console.log("sync:", this.toString());
		},
		toString() {
			return JSON.stringify({
				id: _id,
				name,
				x: x,
				y: y,
				hp: hp,
				mp: mp,
				angle: angle,
			});
		}
	}
};


const Start = player => OutPacket({
	cmd: CMD.START,
	params: [player.id],
});
const YourId = player => OutPacket({
	cmd: CMD.YOUR_ID,
	params: [player.id],
});
const NextTurn = player => OutPacket({
	cmd: CMD.NEXT_TURN,
	params: [player.id],
});
const EndGame = player => OutPacket({
	cmd: CMD.END_GAME,
	params: [player.id],
});
const Sync = () => OutPacket({
	cmd: CMD.SYNC_PLAYER,
	params: [],
});

const RoomMgr = (function() {
	let rooms = [];

	const JoinRoom = (seed, player) => OutPacket({
		cmd: CMD.JOIN_ROOM,
		params: [
			seed,
			player.id,
			player.name,
			player.x,
			player.y,
			player.hp,
			player.mp,
			player.angle,
		],
	});

	function Room() {
		const seed = rand() * (1 << 16) >> 0;
		let players = CircularLinkedList();
		let lastTimeWait = Date.now();
		let currentPlayer = null;
		let waitForSync = false;
		return {
			get seed() { return seed; },
			get players() { return players; },
			get currentPlayer() { return currentPlayer; },
			get lastTimeWait() { return lastTimeWait; },
			add(player) {
				players.forEach(other => {
					player.ws.send(JoinRoom(seed, other));
				});

				players.push(player);
				player.init(this);
				this.broadCast(JoinRoom(seed, player));

				if (players.length >= MAX_PLAYER_PER_ROOM) {
					players.forEach(player => player.ws.send(YourId(player)));
					setTimeout(this.startGame.bind(this), 200);
				}
			},
			remove(player) {
				players.remove(player);
			},
			broadCast(message, except) {
				console.log("broadCast:", message);
				players.forEach(player => {
					player.ws.send(message);
					console.log("broadCast to player:", player.toString());
				});
			},
			startGame() {
				currentPlayer = players.head;
				this.broadCast(Start(players.head))
			},
			nextTurn() {
				if (players.filter(p => p.hp > 0).length <= 1) {
					RoomMgr.removeRoom(this);
					return this.broadCast(EndGame(currentPlayer));
				}
				players.forEach(p => console.log("p:", p.toString()));
				const lastPlayer = currentPlayer;
				do {
					currentPlayer = currentPlayer.next;
				} while (currentPlayer.hp <= 0 && currentPlayer !== lastPlayer);
				if (currentPlayer === lastPlayer) throw Error("WTF?");
				this.broadCast(NextTurn(currentPlayer));
			},
		}
	}

	return {
		queue(player) {
			const availableRoom = rooms.sort((r1, r2) => r2.lastTimeWait - r1.lastTimeWait)
					.find(room => room.players.length < MAX_PLAYER_PER_ROOM) || Room();
			if (!availableRoom.players.length) {
				rooms.push(availableRoom);
			}
			availableRoom.add(player);
			console.log('room:', rooms.map(r => r.players.length));
		},
		remove(player) {
			const room = player.room;
			if (room) {
				if (!room.players.length) rooms = rooms.filter(r => r !== room);
				console.log('room:', rooms.map(r => r.players.length));
			}
		},
		removeRoom(room) {
			players = players.filter(p => !room.players.includes(p));
			rooms = rooms.filter(r => r !== room);
			console.log('room:', rooms.map(r => r.players.length));
		},
	}
})();

wss.on('connection', function connection(ws) {
	const player = Player(ws);
	players.push(player);

	ws.on('close', function(e) {
		player.leave();
		players = players.filter(p => p !== this);
	});
    ws.on('message', function incoming(raw) {
        console.log('received: %s', raw);

        const message = Message(player, raw);
        switch (message.cmd) {
        	case CMD.LOGIN:
        		player.name = message.params.getString();
				console.log("Players:" , players.map(p=>p.toString()));
        		player.ws.send(OutPacket({
        			cmd: CMD.LOGIN,
        		}));
        		break;
    		case CMD.JOIN_ROOM:
    			RoomMgr.queue(player);
    			break;
    		case CMD.LEAVE_ROOM:
    			player.leave();
    			break;
    		case CMD.GAME_ACTION:
    			player.room.broadCast(raw);
    			break;
    		case CMD.NEXT_TURN:
    			player.room.nextTurn();
    			break;
    		case CMD.SYNC_PLAYER:
    			player.sync(message);
    			player.ws.send(Sync(player));
    			break;
        }
    });
});
