const { ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const http = require('http');
const fs = require('fs');
const yaml = require('js-yaml');
const sqlite3 = require('sqlite3').verbose();
const WebTorrent = require("webtorrent");
const Bugout = require("bugout");
const wrtc = require("wrtc");
const sound = require('sound-play')

let db = null;

// Должен быть подключен сам к себе, а потом же подключатся к остальным ------------------------------------------------------------------------------

// Returns string with upper first letter
function capFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Returns random number from min to max
function randomInteger(min, max) {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

// Returns random elements from array
function randomFromArray(arr){
	return arr[randomInteger(0,arr.length)];
}

/*
 *
 * Function returns random capitalised object with name and lastname
 *
*/
exports.generateName = ()=>{
	const names = ["Adam", "Alex", "Aaron", "Ben", "Carl", "Dan", "David", "Edward", "Fred", "Frank", "George", "Hal", "Hank", "Ike", "John", "Jack", "Joe", "Larry", "Monte", "Matthew", "Mark", "Nathan", "Otto", "Paul", "Peter", "Roger", "Roger", "Steve", "Thomas", "Tim", "Ty", "Victor", "Walter"];
	const lastnames = ["Anderson", "Ashwoon", "Aikin", "Bateman", "Bongard", "Bowers", "Boyd", "Cannon", "Cast", "Deitz", "Dewalt", "Ebner", "Frick", "Hancock", "Haworth", "Hesch", "Hoffman", "Kassing", "Knutson", "Lawless", "Lawicki", "Mccord", "McCormack", "Miller", "Myers", "Nugent", "Ortiz", "Orwig", "Ory", "Paiser", "Pak", "Pettigrew", "Quinn", "Quizoz", "Ramachandran", "Resnick", "Sagar", "Schickowski", "Schiebel", "Sellon", "Severson", "Shaffer", "Solberg", "Soloman", "Sonderling", "Soukup", "Soulis", "Stahl", "Sweeney", "Tandy", "Trebil", "Trusela", "Trussel", "Turco", "Uddin", "Uflan", "Ulrich", "Upson", "Vader", "Vail", "Valente", "Van Zandt", "Vanderpoel", "Ventotla", "Vogal", "Wagle", "Wagner", "Wakefield", "Weinstein", "Weiss", "Woo", "Yang", "Yates", "Yocum", "Zeaser", "Zeller", "Ziegler", "Bauer", "Baxster", "Casal", "Cataldi", "Caswell", "Celedon", "Chambers", "Chapman", "Christensen", "Darnell", "Davidson", "Davis", "DeLorenzo", "Dinkins", "Doran", "Dugelman", "Dugan", "Duffman", "Eastman", "Ferro", "Ferry", "Fletcher", "Fietzer", "Hylan", "Hydinger", "Illingsworth", "Ingram", "Irwin", "Jagtap", "Jenson", "Johnson", "Johnsen", "Jones", "Jurgenson", "Kalleg", "Kaskel", "Keller", "Leisinger", "LePage", "Lewis", "Linde", "Lulloff", "Maki", "Martin", "McGinnis", "Mills", "Moody", "Moore", "Napier", "Nelson", "Norquist", "Nuttle", "Olson", "Ostrander", "Reamer", "Reardon", "Reyes", "Rice", "Ripka", "Roberts", "Rogers", "Root", "Sandstrom", "Sawyer", "Schlicht", "Schmitt", "Schwager", "Schutz", "Schuster", "Tapia", "Thompson", "Tiernan", "Tisler"];
	
	return {
		'name': capFirst(randomFromArray(names)), 
		'lastname': capFirst(randomFromArray(lastnames))
	};
}

/*
 *
 * Function runing after filesystem function in start application
 *
*/
exports.initStart = (win)=>{
	const wt = new WebTorrent({tracker: {wrtc: wrtc}});
	let chats = [];
	let currentPeer = null;
	db.get('SELECT * FROM `chats`', [], (err, rows) => {
		if(err) throw err;
		if(rows){
			chats.push({
				image: rows.chat_image,
				name: rows.chat_name,
				surname: rows.chat_lastname,
				text: rows.chat_lastmessage == '' ? 'Online' : rows.chat_lastmessage,
				peer: rows.chat_token
			});
		}
	});
	
	ipcMain.on('replyAddChat', (event, arg) => {				
		event.reply('addChat', chats);
	});
	
	ipcMain.on('getCurrentPeer', (event, arg) => {
		currentPeer = arg;
	});
	
	// check if user peer already in sessin (sync)
	db.get('SELECT `user_seed` FROM `user`', [], (err, rows) => {
		let seed = null;
		if(rows && rows['user_seed']){
			seed = rows['user_seed'];
		}
		// create p2p connection
		const b = Bugout({seed: seed, wt: wt, "announce": [
			'wss://hub.bugout.link', 
			'wss://tracker.openwebtorrent.com', 
			'wss://tracker.openwebtorrent.com', 
			'wss://tracker.btorrent.xyz', 
			'wss://tracker.fastcast.nz',
			'wss://tracker.magnetoo.io:443/announce',
			'wss://open.tube:443/tracker/socket',
			'wss://hub.bugout.link:443/announce',
			'wss://tube.privacytools.io:443/tracker/socket'
		]});

		b.on("announce", console.log.bind(console, "Announced:"));
		b.on("connections", console.log.bind(console, "Connections:"));
		b.on("seen", console.log.bind(console, "Seen:"));
		b.on("rpc", console.log.bind(console, "RPC:"));
		b.on("message", (from, message, params)=>{
			db.get('SELECT `chat_token` FROM `chats` WHERE `chat_token` = ?', [from], (err, rows)=>{
				if(err) throw err;
				if(rows && rows.chat_token){
					if(currentPeer != rows.chat_token){
						if(Notification.isSupported()){
							const mess = new Notification({
								title: 'SANA - New message',
								body: message,
								silent: true,
								icon: path.join(__dirname, 'assets/image/favicon.png'),
							});
							mess.on('click', ()=>{
								if (win.isMinimized()) win.restore();
								win.focus();
							})
						}
						sound.play(path.join(__dirname, 'assets/audio/notification.ogg'))
					}
				}
			});
		});
		
		// register callback function getData returns user information from local database
		b.register("getData", function(pk, args, callback) {
			db.get('SELECT `user_name`, `user_lastname`, `user_address`, `user_params` FROM `user` LIMIT 1', [], (err, rows)=>{
				if(err) throw err;
				if(rows) callback(rows);
				else console.error('Can\'t get user data from local DB to chat');
			});
		});

		console.log("Connect to this Bugout instance:\n");
		
		console.log("Address:", b.address());
		console.log("Seed:", b.seed);
		console.log("Announcing to trackers...");
		
		// if seed isn't set - add new user to local database
		if(!seed){
			db.run('INSERT INTO `user` (`user_name`, `user_lastname`, `user_address`, `user_seed`, `user_params`) VALUES(?, ?, ?, ?, ?)', [
				exports.generateName()['name'], 
				exports.generateName()['lastname'],
				b.address(),
				b.seed,
				JSON.stringify({'img':null })
			], (err)=>{
				if (err) throw err;
			});
		}
	});
	
}

exports.initFilesystem = (callback)=>{
	/*
	 *
	 * Create modules folder and make 'SimpleModule' module
	 * Uses when app starting to check all folders and files
	 *
	*/
	console.log(process.env['HOME']);
	__dirname = process.env['HOME'] + '/Documents';
	if(!fs.existsSync(path.resolve(__dirname, 'SANA Messenger Data'))){
		console.log('Creating new filesystem...');
		fs.mkdir(path.resolve(__dirname, 'SANA Messenger Data'), { recursive: true }, (err) => {
			if (err) throw err;
			if (!fs.existsSync(path.resolve(__dirname, 'SANA Messenger Data/modules'))) {
				fs.mkdir(path.resolve(__dirname, 'SANA Messenger Data/modules'), { recursive: true }, (err) => {
					if (err) throw err;
					fs.mkdir(path.resolve(__dirname, 'SANA Messenger Data/modules/SimpleModule'), { recursive: true }, (err) => {
						if (err) throw err;
						
						fs.appendFile(path.resolve(__dirname, 'SANA Messenger Data/modules/SimpleModule/Config.yaml'), `--- # Module configuration
		  name: "SimpleModule"
		  description: "Simple module to use system"
		  author: "SANA Messenger Player"
		  mainFile: "Module.js"
		  license: "LTS"`, function (err) {
							if (err) throw err;
						});
						
						fs.mkdir(path.resolve(__dirname, 'SANA Messenger Data/assets'), { recursive: true }, (err) => {
							if (err) throw err;
							console.log('Filesystem created successful');
							// NEED TO BE FINISHED!!!!!!!!! Made in November 27 2020 at 22:01 PM
							// NEED TO BE FINISHED!!!!!!!!!
							// NEED TO BE FINISHED!!!!!!!!!
							// NEED TO BE FINISHED!!!!!!!!!
							// NEED TO BE FINISHED!!!!!!!!!
							// NEED TO BE FINISHED!!!!!!!!!
							// NEED TO BE FINISHED!!!!!!!!!
							// NEED TO BE FINISHED!!!!!!!!!
						});
					});
				});
			}
		});
	}
	
	/*
	 *
	 * Creating SQLITE3 database for saving information about users and current user
	 * Uses once when session.db is not exists or one of main tables so
	 *
	*/
	db = new sqlite3.Database(path.resolve(__dirname, 'SANA Messenger Data/session.db'), (err) => {
		if (err){
			console.error(err.message);
		}
		console.log('Connected to local DB ('+path.resolve(__dirname, 'SANA Messenger Data/session.db')+')');
	});
	
	db.get('SELECT `session_token` FROM `session`', [], (err, rows) => {
		if(err){
			console.log('Creating session table...');
			db.run(`
			CREATE TABLE session (
				session_token LONGTEXT NOT NULL,
				session_password LONGTEXT NOT NULL,
				session_params LONGTEXT NOT NULL
			);`, [], (err) => {
				if (err) {
					console.error(err);
					throw err;
				}
				console.log('Session table created successful');
			});
		}
	});

	db.get('SELECT `user_seed` FROM `user`', [], (err, rows) => {
		if(err){
			console.log('Creating user table...');
			db.run(`
			CREATE TABLE user (
				user_name TEXT NOT NULL,
				user_lastname TEXT NOT NULL,
				user_image TEXT NUT NULL,
				user_address TEXT NOT NULL,
				user_seed LONGTEXT NOT NULL,
				user_params LONGTEXT NOT NULL
			);`, [], (err) => {
				if (err) {
					console.error(err);
					throw err;
				}
				console.log('User table created successful');
			});
		}
	});

	db.get('SELECT `message_chat_token` FROM `messages`', [], (err, rows) => {
		if(err){
			console.log('Creating messages table...');
			db.run(`
			CREATE TABLE messages (
				message_chat_token TEXT NOT NULL,
				message_time TEXT NOT NULL,
				message_text LONGTEXT NOT NULL,
				message_params LONGTEXT NOT NULL
			);`, [], (err) => {
				if (err) {
					console.error(err);
					throw err;
				}
				console.log('Messages table created successful');
			});
		}
	});

	db.get('SELECT `chat_token` FROM `chats`', [], (err, rows) => {
		if(err){
			console.log('Creating chats table...');
			db.run(`
			CREATE TABLE chats (
				chat_name TEXT NOT NULL,
				chat_lastname TEXT NOT NULL,
				chat_image LONGTEXT NOT NULL,
				chat_token LONGTEXT NOT NULL,
				chat_lastmessage TEXT NOT NULL,
				chat_params LONGTEXT NOT NULL
			);`, [], (err) => {
				if (err) {
					console.error(err);
					throw err;
				}
				console.log('Chats table created successful');
				callback();
			});
		}else callback();
	});
	
}