var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');
var FriendList = require('../models/friendlist');

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id, (error, user) => {
		done(error, user);
	});
});

passport.use('local.signup', new LocalStrategy({
	usernameField: 'username',
	passwordField: 'password',
	passReqToCallback: true
}, (req, username, password, done) => {
	// Not gonna callback if empty fields (missing credentials)
	
	// Validations
	req.checkBody('username', 'Username must have at least 4 characters').isLength({min: 4});
	req.checkBody('password', 'Password must have at least 4 characters').isLength({min: 4})
		.equals(req.body.confirmPassword).withMessage('Confirmation password is not the same as the password');
	
	let errors = req.validationErrors();
	
	if(errors) {
		let messages = [];
		
		errors.forEach((error) => {
			messages.push(error.msg);
		});
		
		return done(null, false, req.flash('error', messages));
	}
	
	// Take actions depending whether the username exists in the database.
	User.findOne({username: username}, (error, user) => {
		if(error) {
			return done(error);
		}
		
		// Don't want duplicate user
		if(user) {
			return done(null, false, {message: 'Username is already taken'});
		}
		
		// Create new User 
		let newUser = new User();
		newUser.username = username;
		newUser.password = newUser.encryptPassword(password);
		newUser.save((error, user) => {
			if(error) return done(error);
			
			let newFlist = new FriendList();
			newFlist.ownerId = user._id;
			newFlist.ownerUsername = user.username;
			newFlist.save(function(err, flist) {
				if(err) return done(error);
			});
			
			return done(null, newUser);
		});
	});
}));

passport.use('local.signin', new LocalStrategy({ 
	usernameField: 'username',
	passwordField: 'password',
	passReqToCallback: true
}, (req, username, password, done) => {
	User.findOne({username: username}, (err, user) => {
		if(err) {
			return done(err);
		}
		if(!user) {
			return done(null, false, {message: 'Username not found'});
		}
		if (!user.validPassword(password)) {
            return done(null, false, {message: 'Wrong password.'});
        }
		
		return done(null, user);
	});
}));