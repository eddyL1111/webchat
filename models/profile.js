var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	user: {type: Schema.Types.ObjectId, ref: 'User'},
	status: String,
	friendlist: {}
});

module.exports = mongoose.model('Profile', schema);