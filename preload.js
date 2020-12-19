const { ipcRenderer } = require('electron');
const openpgp = require('openpgp');
const path = require('path');
const sound = require('sound-play')
const sqlite3 = require('sqlite3').verbose();

// gets name of the current file using
const currentFile = ipcRenderer.sendSync('get-current-file', null);

// connection to the local SQLite3 Database with all data
const db = new sqlite3.Database(path.resolve(__dirname, 'session.db'), (err) => {
	if (err){
		console.error(err.message);
	}
	console.log('Connected to local DB ('+path.resolve(__dirname, 'session.db')+')');
});

openpgp.config.show_version = false;
openpgp.config.show_comment = false;
openpgp.config.aead_protect = true;

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

// Async decryptiong text using PGP private key
async function decryptText(text, key){
	const { data: decrypted } = await openpgp.decrypt({
		message: await openpgp.message.read(text),
		passwords: [key],
	});
	return decrypted;
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

// Function returns current hours and minutes
function getNowTime(){
	let now = new Date();
	return now.getHours()+':'+( now.getMinutes() > 9 ? now.getMinutes() : 0+''+now.getMinutes() );
}

// Function returns the name of current month
function getNowTextMonth(){
	let now = new Date();
	let months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
	return months[now.getMonth()];
}

// Makes connection to the server with ID. May have callback functions
// Returns P2P connection class (variable "b")
let b = false;
function connectToChat(id, callbackObj = false){
	const Bugout = require("bugout");
	if(b){
		$('.app .chat-dialog .chat-messages').html('');
		b.close();
	}
	
	ipcRenderer.send('getCurrentPeer', id);
	
	// trying to find sessiong seed from local database
	db.get('SELECT `user_seed` FROM `user`', [], (err, rows) => {
		if(err) throw err;
		
		let seed = null;
		if(rows && rows['user_seed']){
			seed = rows['user_seed'];
		}
		
		// connecting using Bugout lib with ID server, seed if it sets, and special trackers
		b = new Bugout(id,{"seed": seed,"announce": [
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
		
		console.log("My address is " + b.address());
		console.log("My seed is " + b.seed);
		console.log("Connecting to the server...\n(this can take a minute)");
		
		changeDescribtionChat('Connecting...');
		changeNameChat('Uknown Chat');
		
		// if seed isn't set - add new session to local database
		if(!seed){
			db.run('INSERT INTO `session` (`session_token`, `session_password`, `session_params`) VALUES(?, ?, ?)', [
				b.seed,
				'null',
				JSON.stringify([])
			], (err)=>{
				if (err) throw err;
			});
		}
		
		// calls the callback onConnecting if it sets
		if(callbackObj && callbackObj.onConnecting) callbackObj.onConnecting();
		let now = new Date();
		addMessageTime(getNowTextMonth()+' '+now.getDate()+', '+now.getFullYear());
		
		// adds message to chat about to connecting to the server
		addMessage({
			image: "https://cdn.onlinewebfonts.com/svg/img_207595.png", 
			name: "System",
			surname: "Message",
			time: getNowTime(),
			text: "Your address is: "+b.address()+" ----- Connecting to the "+id+" ... (this can take a minute or more)"
		});
		
		// hide start message and show chat interface
		$('.app .chat-dialog div').show(1);
		$('.app .chat-dialog p.start-message').hide(1);
		
		// calls when connected to the server
		b.on("server", function() {
			console.log("Connected to the server.");
			sound.play(path.join(__dirname, 'assets/audio/notification.ogg'))
			// calls the callback onConnected if it sets
			if(callbackObj && callbackObj.onConnected) callbackObj.onConnected();
		  
			// adds ability to type message in chat box and focus on it
			$('.app .chat-dialog .chat-panel textarea').removeAttr('disabled');
			$('.app .chat-dialog .chat-panel textarea').focus();
		  
			// sends request to get data about chat from server
			b.rpc("getData", null, (data)=>{
				const res = {
					image: JSON.parse(data.user_params)['img'] ? JSON.parse(data.user_params)['img'] : path.resolve(__dirname, 'assets/image/no_avatar.webp'), 
					name: data.user_name,
					surname: data.user_lastname,
					text: 'Online',
					peer: data.user_address
				};
				changeDescribtionChat(res.text);
				changeNameChat(res.name + ' ' + res.surname);
				let li = $('.app .chat-list .list-chat li[peer-id = "'+res.peer+'"]');
				// add new chat in column if it isn't set
				if(li.length == 0){
					addChat(res);
					li = $('.app .chat-list .list-chat li[peer-id = "'+res.peer+'"]');
					// check if this chat already in database
					db.get('SELECT chat_token FROM chats WHERE chat_token = ?', [res.peer], (err, rows)=>{
						if(err) throw err;
						// if chat is not in database
						if(!rows || !rows.chat_token){
							// add chat to database
							db.run("INSERT INTO `chats` (`chat_name`, `chat_lastname`, `chat_image`, `chat_token`, `chat_lastmessage`, `chat_params`) VALUES(?, ?, ?, ?, ?, ?)", [
								res.name,
								res.surname,
								res.image,
								res.peer,
								res.text,
								JSON.stringify({})
							], (err)=>{
								if(err) throw err;
							});
						}
					});
				}
				// remove active class from all and add to this chat
				$('.app .chat-list .list-chat li').removeClass('active');
				li.addClass('active');
			});
		});

		// on new user connected - anounce in chat about it
		b.on("seen", (address)=>{
			console.log("seen:"+address);
			addMessage({
				image: "https://cdn.onlinewebfonts.com/svg/img_207595.png", 
				name: "System",
				surname: "Message",
				time: getNowTime(),
				text: "Connected: "+address
			});
		});
		
		// on user disconnected - anounce in chat about it
		b.on("left", (address)=>{
			console.log("left:"+address);
			addMessage({
				image: "https://cdn.onlinewebfonts.com/svg/img_207595.png", 
				name: "System",
				surname: "Message",
				time: getNowTime(),
				text: "Disconected: "+address
			});
		});
		
		// on user sent message - add it in chat
		b.on("message", (address, message)=>{
			console.log("left:"+address);
			addMessage({
				image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmHBnSgj9coHZSJS3L5Yo27lhoZpRLyHrYXQ&usqp=CAU", 
				name: "From",
				surname: address == b.address() ? "You" : address,
				time: getNowTime(),
				text: message
			});
			// scroll to bottom of chat dialog
			$('.app .chat-dialog .chat-messages').animate({ scrollTop: $('.app .chat-dialog .chat-messages')[0].scrollHeight }, 1000);
		});
	});
}











window.onload = ()=>{
	
	// fade out the loading screen and remove it then
	$('.loading').fadeOut(500, ()=>$('.loading').remove());
	
	// main application page
	if(currentFile == 'render/index.html'){
		// add test chat to the system
		addChat({
			image: "https://cdn.onlinewebfonts.com/svg/img_207595.png", 
			name: "Public",
			surname: "Chat",
			text: "Public chat with all users",
			peer: "bWtERgpY2jBj4mJo2mCYyrSBMZ8hQoq1fm"
		});

		// gets all chats from local database
		ipcRenderer.on('addChat', (event, arg) => {
			for(var i = 0; i < arg.length; i++){
				addChat(arg[i])
			}
			
			// runs when use clicked on any chat in left column
			chatClick((e)=>{
				$('.app .chat-list .list-chat li').removeClass('active');
				e.addClass('active');
				
				// send request to connect to the server
				connectToChat(e.attr('peer-id'),{
					// when starts connecting
					onConnecting: ()=>{
						changeDescribtionChat('Connecting...');
						changeNameChat($('.chat-info h4', e).text());
					},
					// when connected
					onConnected: ()=>{
						changeDescribtionChat($('.chat-info p', e).text());
					}
				});
			});
		});
		ipcRenderer.send('replyAddChat', true)
		
		// hide start message and show chat interface
		$('.app .chat-dialog div').hide(1);
		$('.app .chat-dialog p.start-message').show(1);
		
		// click the button send when user enter key ENTER (#13) without SHIFT
		$('.app .chat-dialog .chat-panel textarea').on('keydown', (e)=>{
			if (e.keyCode == 13 && !e.shiftKey) {
				if (b.lastwirecount) { // if has connected user - click send button
					$('.app .chat-dialog .chat-panel button.send-button').click();
				}
				e.preventDefault();
			}
		});
		
		// send message when clicked send button
		$('.app .chat-dialog .chat-panel button.send-button').on('click', (e)=>{
			e.preventDefault();
			if (!b.lastwirecount) return false; // if no connected users - do nothing 
			
			const text = $('.app .chat-dialog .chat-panel textarea').val();
			$('.app .chat-dialog .chat-panel textarea').val('');
			ipcRenderer.send('send-message', {id: 1, did: 1, text: text, time: getNowTime()});
			b.send(text); // send to P2P
		});
		
		// open connection when user clicked add chat and filled in input required ID of the chat in left column
		$('.app .chat-list .list-personal .list-search .button-search').on('click', (e)=>{
			e.preventDefault();
			
			const id = $('.app .chat-list .list-personal .list-search .input-search').val();
			$('.app .chat-list .list-personal .list-search .input-search').val('');
			connectToChat(id); // send request to connect
		});

		
		
		
		
		
		
		
		
		
		
	}else if(currentFile == 'render/auth.html'){
		$('input[type="submit"]').click(()=>{
			$('.login').addClass('body-a')
			setTimeout(()=>{
				$('.login').addClass('body-b')
			},300);
			setTimeout(()=>{
				$(".authent").show().animate({right:-320},{easing : 'easeOutQuint' ,duration: 600, queue: false });
				$(".authent").animate({opacity: 1},{duration: 200, queue: false }).addClass('visible');

				var password = $('div.login_fields__password input[name="password"]');

				if(password.val() == ''){
					closeLogin();
					$('.login_error').fadeIn(123);
					$('.login_error').text('Enter your password!');
					return false;
				}
				encryptText(password.val(), '7rxN(9e%{rSA.Df{KT4Fdaak+/NNM4x-VuE-_.n8e)DN+zF95YbkF%J}npM$TL[.').then((pass) => {
					let body = ipcRenderer.sendSync('check-password-login', pass);
					if(JSON.parse(body)){
						body = JSON.parse(body);
					}
					console.log(body);
					if(body.result == 'success'){
						closeLogin(true);
						return true;
					}else{
						closeLogin();
						$('.login_error').fadeIn(123);
						if(body.error != ''){
							$('.login_error').text(body.error);
						}else{
							$('.login_error').text('Error connection!');
						}
						$('input[name="email"]').focus();
						return false;
					}
				});
				
			},500);
		});
		$('*[sana-event]').on('click', (e)=>{
			let ev = $(e.currentTarget).attr('sana-event');
			e.preventDefault();
			if(ev == 'new-account'){
				let res = ipcRenderer.sendSync('create-new-account', true);
				if(res){
					window.location.href="index.html";
				}else{
					$('.login_error').fadeIn(123);
					$('.login_error').text(res);
				}
			}
		});
	}
	console.log(currentFile);
}

ipcRenderer.on('get-sent-message', (event, arg) => {
	console.log(arg) // prints "pong"
})