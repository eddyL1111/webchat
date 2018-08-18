let socket = io.connect('http://192.168.1.231:3000');

let chatMsg = $('#chat-msg');
let curUsername = $('#display-username').data('value');
let chatTitle = $('#chat-title');
let chatbox = $('#chatbox');


$(function() {
	let roomTitle;
	
	if($('.chatrooms').length > 0) {
		// get chatrooms list and select the last one as active by default
		$('.chatrooms').last().addClass('active');
		// Set
		roomTitle = $.trim($('.active').clone().children().remove().end().text());
		$('#chat-title').text(roomTitle);
		
		socket.emit('chat-startup', {
			roomId: $('.active p').text()
		});
	}
});

socket.on('chat-userlist', data => {
	$('#chat-userlist').text('');
	
	data.forEach(i => {
		$('#chat-userlist').append(`<li class="list-group-item">${i}</li>`);
	});
});


socket.on('chat-output', data => {
	if($('.active p').text() === data.roomId) {	
		data.messages.forEach(i => {
			chatbox.append(`<p><strong>${i.username}:</strong> ${i.message}</p>`);
		});
	}
});

$('#chat-send').on('click', ()=> {
	console.log(chatTitle.text());	
	socket.emit('chat-input', {
		roomId: $('.active p').text(),
		message: chatMsg.val(),
		username: curUsername
	});
	
	chatMsg.val('');
});

$('#chat-msg').keypress(key => {
	if(key.which == 13) {
		//console.log($.trim(chatTitle.text()));	
		socket.emit('chat-input', {
			roomId: $('.active p').text(),
			message: chatMsg.val(),
			username: curUsername
		});
		
		chatMsg.val('');
	}
});

$('.chatrooms').on('click', function(e) {
	let title = $.trim($(e.target).clone().children().remove().end().text());
	
	$('.chatrooms').removeClass('active');
	$(this).addClass('active');
	chatTitle.text(title);
	chatbox.html('');
	
	// Emit a room change and get corresponding messages
	socket.emit('room-change', {
		roomId: $('.active p').text()
	});
});









$('#signin-form').submit(function() {
	socket.emit('login', {
		username: $('#username').val()
	});
});

$('#logout').on('click', function() {
	socket.emit('logout', {
		username: $('#display-username').val()
	});
});


// Start up: select last room, set the chatbox 

$('#new-chat-title').keyup(function() {
	return $(this).val() == "" ? $('#new-chat-btn').prop('disabled', true) : $('#new-chat-btn').prop('disabled', false);
});

$('.invite-btn').on('click', function(e) {
	let user = $(this).val();
	
	//console.log(username);
	socket.emit('invite-to-chat', {
		roomId: $('.active p').text(),
		user: user
	});
});