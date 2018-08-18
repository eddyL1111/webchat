const mongoose = require('mongoose');
const Schema = mongoose.Schema;

schema = new Schema({
	title: String,
	owner: String,
	users: [String],
	messages: [{
		username: String,
		message: String
	}]
});

module.exports = mongoose.model('Chatroom', schema);