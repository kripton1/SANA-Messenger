const {app, BrowserWindow, Notification, ipcMain, dialog} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const openpgp = require('openpgp');
const crypto = require('crypto');
const yaml = require('js-yaml');

const system = require('./system.js');

openpgp.config.show_version = false;
openpgp.config.show_comment = false;
openpgp.config.aead_protect = true;


/*
 *
 * Check if second window is open or trying to open then close this window and focus first
 *
*/
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
	app.quit();
}else{
  app.on('second-instance', (event, commandLine, workingDirectory) => {
	if (win) {
		if (win.isMinimized()) win.restore();
		win.focus();
    }
  })
}

// Base64 decode via node js Buffer
function btoa(text){
	return Buffer.from(text, 'base64').toString();
}

// Base64 encode via node js Buffer
function atob(text){
	return  Buffer.from(text).toString('base64');
}

// Returns HEX string from array of bytes
function toHexString(byteArray) {
  return Array.prototype.map.call(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

// Returns array of bytes from HEX string
function toByteArray(hexString) {
  var result = [];
  for (var i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16));
  }
  return result;
}

// Async ecryption file using PGP public key, may have callback
async function encryptFilePGP(data, key, fileOut, than){
	const { message } = await openpgp.encrypt({
        message: openpgp.message.fromText(data),
        passwords: [key],
        armor: false
    });
    const encrypted = message.packets.write();
	fs.writeFileSync(__dirname + '/' + fileOut, encrypted);
	return encrypted;
}

// Async decribtion file using PGP private key, may have callback
async function decryptFilePGP(fileIn, key, than){
	const data = fs.readFileSync(fileIn);
	console.log(data);
	const { data: decrypted } = await openpgp.decrypt({
		message: await openpgp.message.read(data),
		passwords: [key],
	});
	return decrypted;
}

// Async encryptiong text using PGP public key
async function encryptText(text, key){
	const ciphertext = await openpgp.encrypt({
        message: await openpgp.message.fromText(text),
        passwords: [key],
        armor: false
    });
    const encrypted = ciphertext.message.packets.write();
	return encrypted;
}

// Async decribtion text using PGP private key
async function decryptText(text, key){
	const { data: decrypted } = await openpgp.decrypt({
		message: await openpgp.message.read(text),
		passwords: [key],
	});
	return decrypted;
}


/*
encryptText(arg.password, keys[1]).then((myPass) => {
	var config = [
		arg.name,
		arg.lastname,
		'',
		arg.email,
		atob(toHexString(myPass)),
		atob(toHexString(myIp)),
		atob(toHexString(myIp)),
		Date.now(),
		Date.now(),
		params
	];
});

decryptText(new Uint8Array(toByteArray(btoa(results[0]['password']))), keys[1]).then((myPass) => {
	if(arg.password == myPass){
		// save session
	}else{
		event.returnValue = JSON.stringify({
			result: 'failed',
			error: 'Password is invalid!'
		});
		return false;
	}
});
*/

/* encryptFilePGP('Hello World', '12345', 'text.txt').then((res)=>{
	console.log(res);
	decryptFilePGP('text.txt', '12345').then((res2)=>{
		console.log(res2);
	});
}); */

/* var options = {
    userIds: [{ name:'Jon Smith', email:'jon@example.com' }],
    curve: "ed25519",
    passphrase: 'super long and hard to guess secret'
};

openpgp.generateKey(options).then(function(key) {
    var privkey = key.privateKeyArmored;
    var pubkey = key.publicKeyArmored;
    var revocationSignature = key.revocationSignature;
	console.log(privkey);
	console.log(pubkey);
}); */

let win;
let currentFile = 'render/index.html';

const keys = [
	'$PCXZgcz67s2DAai}KntO6NS5pnvld5U=pV*/)45=5L.dRjT3xlw~{}JtaqokFTO', // IP's
	'T8uQw-wRH3TGP4hi-/xer%[!YRkY,2]gX/f6gSm%.G[.C@)2UaFRLa{DjcK:X7WU', // Password's
	'XSfc,K383q#8-DaUK#6Vc@vx;fS=rv8]r8A,f@mEecyfZw}e5n)+xK&mfE3{5hf9', // Token's
];

let codeDB = {};

/*
 *
 *	Function to create main windows
 *
 *	
*/
function createWindow(){
	win = new BrowserWindow({
		title: 'SANA Messenger',
		width: 1000,
		height: 700,
		icon: path.join(__dirname, 'assets/image/favicon.png'),
		autoHideMenuBar: true,
		titleBarStyle: 'hidden',
		backgroundColor: '#333',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			webSecurity: false
		}
	});
	
	win.loadURL(url.format({
		pathname: path.join(__dirname, currentFile),
		protocol: 'file:',
		slashes: true
	}));
	
	//win.webContents.openDevTools();
	win.removeMenu();
	win.setContentProtection(true);
	
	system.initFilesystem(()=>{
		system.initStart(win);
	});
	
	win.on('closed', ()=>{
		win = null;
	});
	
};

/*
 *
 *	Event listener to return current file direction
 *
 *	
*/
ipcMain.on('get-current-file', (event, arg) => {
	event.returnValue = currentFile;
});

/*
 *
 *	Event listener to send message
 *
 *	
*/
ipcMain.on('send-message', (event, arg) => {
	console.log(arg);
	event.reply('get-sent-message', 'true');
});

/*
 *
 *	Event listener to generate authrization keys and return them
 *
 *	
*/
ipcMain.on('auth-generate-keys', (event, arg) => {
	
});

ipcMain.on('check-password-login', (event, arg) => {
	if(codeDB.name && codeDB.lastname && codeDB.pid){
		
	}
	db.all('SELECT `session`.`session_password`, `session`.`session_token`, `user`.`user_name`, `user`.`user_lastname`, `user`.`user_seed` FROM `session`, `user`', [], (err, rows) => {
		if(rows[0] && rows[0].session_password && rows[0].session_token){
			console.log(1);
			if(rows[0].session_token != rows[0].user_seed){
				event.returnValue = JSON.stringify({
					result: 'failed',
					error: 'Local base error: Token invalid!'
				});
				return false;
			}
			decryptText(new Uint8Array(toByteArray(btoa(rows[0].session_password))), keys[1]).then((myPass0) => {
				decryptText(new Uint8Array(toByteArray(myPass0)), '7rxN(9e%{rSA.Df{KT4Fdaak+/NNM4x-VuE-_.n8e)DN+zF95YbkF%J}npM$TL[.').then((pass) => {
					decryptText(arg, '7rxN(9e%{rSA.Df{KT4Fdaak+/NNM4x-VuE-_.n8e)DN+zF95YbkF%J}npM$TL[.').then((myPass) => {
						if(pass == myPass){
							event.returnValue = JSON.stringify({
								result: 'success',
								error: 0
							});
							codeDB = {
								name: 'Anonymous',
								lastname: 'User',
								pid: rows[0].session_token
							};
							return true;
						}else{
							event.returnValue = JSON.stringify({
								result: 'failed',
								error: 'Password is invalid!'
							});
							return false;
						}
					});
				});
			});
		}else{
			console.log(2);
			encryptText(toHexString(arg), keys[1]).then((myPass) => {
				const pid = crypto.randomBytes(32).toString('hex').toUpperCase();
				db.all('INSERT INTO `session` (`session_token`, `session_password`, `session_params`) VALUES(?, ?, ?)', 
				[
					pid,
					atob(toHexString(myPass)),
					JSON.stringify({
						// null
					})
				], (err) => {
					if (err) {
						console.error(err);
						event.returnValue = JSON.stringify({
							result: 'failed',
							error: err
						});
						return false;
						throw err;
					}
				});
				
				db.all('INSERT INTO `user` (`user_name`, `user_lastname`, `user_image`, `user_seed`, `user_params`) VALUES(?, ?, ?, ?, ?)', 
				[
					'Anonymous',
					'User',
					path.resolve(__dirname, 'assets/image/no_avatar.webp'),
					pid,
					JSON.stringify({})
				], (err) => {
					if (err) {
						console.error(err);
						event.returnValue = JSON.stringify({
							result: 'failed',
							error: err
						});
						return false;
						throw err;
					}
				});
				event.returnValue = JSON.stringify({
					result: 'success',
					error: 0
				});
				codeDB = {
					name: 'Anonymous',
					lastname: 'User',
					pid: pid
				};
				return true;
			});
		}
	});
});

/*
 *
 *	If app is ready then create window and make other events
 *
 *	
*/
app.on('ready', ()=>{
	createWindow();
	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

/*
 *
 *	If window closed then close app
 *
 *	
*/
app.on('window-all-closed', ()=>{
	if (process.platform !== 'darwin') app.quit();
});