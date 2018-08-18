var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');

var Chatroom = require('../models/chatroom');
var FriendList = require('../models/friendlist');

var csrfProtection = csrf();
router.use(csrfProtection);


//var mongo = require('mongodb').MongoClient;
//var assert = require('assert');

//var url = 'mongodb://localhost:27017/webchat';


router.get('/webchat', isLoggedIn, function(req, res, next) {
	let chatrooms = [];
	
	Chatroom.find({users: req.user.username})
		.then(docs => {		
			docs.forEach(doc => chatrooms.push({
				id: doc._id,
				title: doc.title
			}));
			
			return FriendList.findOne({ownerUsername: req.user.username});
		})
		.then(doc => {
			res.render('webchat', { 
				username: req.user.username, 
				csrfToken: req.csrfToken(),
				chatrooms: chatrooms,
				friends: doc.friends
			});
		})
	.catch(err => renderError(err, res));
});

router.post('/create-new-chatroom', isLoggedIn, function(req, res, next) {
	const curUsername = req.user.username;
	
	let newChat = new Chatroom({
		title: req.body.newChatTitle,
		owner: curUsername,
		users: [curUsername],
		messages: []
	});
	
	newChat.save().then(doc => 
		res.redirect('/webchat')
	).catch(err => renderError(err, res));
});

router.get('/delete-chatroom/:id', isLoggedIn, function(req, res, next) {
	let roomId = req.params.id;
	
	Chatroom.remove({_id: roomId})
		.exec()
	.catch(err => renderError(err, res));
	
	res.redirect('/webchat');
});


router.use('/', notLoggedIn, function(req, res, next) {
	next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
	let messages = req.flash('error');
	
	res.render('index', { 
		csrfToken: req.csrfToken(), 
		hasErrors: messages.length > 0,
		messages: messages
	});
});



module.exports = router;



function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
	
	res.redirect('/users/signin');
};

function notLoggedIn(req, res, next) { 
	if(!req.isAuthenticated()) {
		return next();
	}
	
	res.redirect('/webchat');
};

function renderError(err, res) {
	res.render('error', {message: err});
};