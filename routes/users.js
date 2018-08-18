var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');

var User = require('../models/user');
var FriendList = require('../models/friendlist');

var csrfProtection = csrf();
router.use(csrfProtection);


/*

router.use('/', isLoggedIn, function(req, res, next) {
	next();
});*/

router.get('/friends', isLoggedIn, function(req, res, next) {
	// Retrieve friends from db 	
	// Retrieve pending from db
	FriendList.findOne({ownerUsername: req.user.username}, function(err, doc) {
		if(err) res.write("Error");
		
		res.render('user/friendlist', {
			username: req.user.username, 
			accepting: doc.accepting,
			friends: doc.friends
		});
	});	
});

router.get('/add-to-friendlist/:otherUsername', isLoggedIn, function(req, res, next) {
	let otherUsername = req.params.otherUsername;
	let curUsername = req.user.username;
	
	// Remove the other username from the current user's accepting list
	FriendList.removeFromAccepting(curUsername, otherUsername)
	//FriendList.findOneAndUpdate({ownerUsername: curUsername}, {$pull: {accepting: {username: otherUsername}}})
		.then(doc => {
			// Remove from pending list from the other user
			// return FriendList.findOneAndUpdate({ownerUsername: otherUsername}, {$pull: {pendings: {username: curUsername}}});
			return FriendList.removeFromPendings(otherUsername, curUsername);
		})
		.then(doc => {
			// Add other user to friend list
			//return FriendList.findOneAndUpdate({ownerUsername: curUsername}, {$push: {friends: {username: otherUsername}}});
			return FriendList.addToFriends(curUsername, otherUsername);
		})
		.then(doc => {
			// Add curUser to friend list from the other user perspective 
			//return FriendList.findOneAndUpdate({ownerUsername: otherUsername}, {$push: {friends: {username: curUsername}}});
			return FriendList.addToFriends(otherUsername, curUsername);
		})
		.then(doc => {
			res.redirect('/users/friends');
		})
	.catch(err => renderError(err, res));
});

router.get('/remove-from-accepting/:otherUsername', isLoggedIn, function(req, res, next) {
	let otherUsername = req.params.otherUsername;
	let curUsername = req.user.username;
	
	// Remove the other username from the current user's accepting list
	FriendList.removeFromAccepting(curUsername, otherUsername)
		.then(doc => {
			// Remove from pending list from the other user
			return FriendList.removeFromPendings(otherUsername, curUsername);
		})
		.then(doc => {
			res.redirect('/users/friends');
		})
	.catch(err => renderError(err, res));
});

router.get('/search', isLoggedIn, function(req, res, next) {
	let otherUsername = req.query['search-user'];
	let afterSearchMsg = req.flash('afterSearchMsg');
	let result = "";
	let warning = false; // For not found and same user
	
	if(afterSearchMsg.length > 0) {
		return res.render('user/search', {
			display: true,
			username: req.user.username, 
			warning: true,
			results: afterSearchMsg
		});
	}
	
	if(otherUsername !== "" && otherUsername != null) {
		User.findOne({username: otherUsername}, function(err, user) {
			
			if(err) {
				res.write('Error');
			}
			
			if(!user) {
				warning = true;
				result = `${otherUsername} doesn't exist!`;
			} else {
				if(user.username === req.user.username) {
					warning = true;
					result = 'Cannot add yourself';
				} else {
					result = user.username;
				}
			}
			
			res.render('user/search', {
				display: true,
				username: req.user.username, 
				warning: warning,
				results: result
			});
		});
	} else {
		res.render('user/search', {
			display: false,
			username: req.user.username, 
			warning: false,
			results: ""
		});
	}
});

router.get('/add-user/:otherUser', isLoggedIn, function(req, res, next) {
	// Create list if user doesn't have one 
	
	// Check if other user is not in the friends and pendings 
	
	FriendList.findOne({ownerId: req.user._id}, function(err, data) {
		let thisUsername = req.user.username;
		let otherUsername = req.params.otherUser;
		let msg = "";
		
		if(err) {
			res.write('Error');
		}
	
		if(!data) {
			console.log(`Couldn't find ${thisUsername} friend list.`);
		} else {
			// Checking if the user is already in the friend list
			let checkFriends = data.friends.find(i => i.username === otherUsername);
			
			if(checkFriends == null) {
				// Checking if the user is in the pending list.		
				let checkPendings = data.pendings.find(i => i.username === otherUsername);

				if(checkPendings == null) {
					data.pendings.push({username: otherUsername});
					data.save(function(err) { 
						if(err) res.write('Error');
						
						// Find other user friend list and store the user requesting to the accepting list 
						FriendList.findOne({ownerUsername: otherUsername}, function(err, data) {
							if(err) res.write('Error');

							if(!data) {
								console.log(`Couldn't find ${otherUsername} friend list.`);
							} else {
								data.accepting.push({username: thisUsername});
								data.save(function(err) {
									if(err) res.write('Error');
								});
							}
						});
					});
					msg = `Added ${otherUsername} to the pending list.`;
				} else {
					msg = `${otherUsername} is awaiting to be accepted.`;
				} // if checkPendings
			} else {
				msg = `${otherUsername} is already in the friend list.`;
			} // end if checkFriends
		}
		
		req.flash('afterSearchMsg', msg);
		res.redirect('/users/search');
	});
});
/*
router.get('/search-user/:username', isLoggedIn, function(req, res, next) {
	
	User.findOne({username: req.body.username}, function(err, user) {
		if(err) {
			return res.write('Error');
		}
	});
	
	res.redirect('/users/search');
});	
*/
router.get('/logout', isLoggedIn, function(req, res, next) {
	console.log(req.user.username + " has logout.");
	req.logout();
	res.redirect('/');
});



router.use('/', notLoggedIn, function(req, res, next) {
	next();
});



router.post('/signup', passport.authenticate('local.signup', {
	successRedirect: '../webchat',
	failureRedirect: '/',
	failureFlash: true
}));

router.get('/signin', function(req, res, next) {
	let messages = req.flash('error');
	
	res.render('user/signin', {
		csrfToken: req.csrfToken(),
		hasErrors: messages.length > 0,
		messages: messages
	});
});

router.post('/signin', passport.authenticate('local.signin', {
	successRedirect: '../webchat',
	failureRedirect: '/users/signin',
	failureFlash: true
}));




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
}