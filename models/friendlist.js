var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	ownerId: {type: Schema.Types.ObjectId, ref: 'User'},
	ownerUsername: String,
	pendings: [{
		username: String
	}],
	friends: [{
		username: String
	}],
	accepting: [{
		username: String
	}]
});

schema.statics.removeFromAccepting = function(owner, other) {
	return this.findOneAndUpdate({ownerUsername: owner}, {$pull: {accepting: {username: other}}})
};

schema.statics.removeFromPendings = function(owner, other) {
	return this.findOneAndUpdate({ownerUsername: owner}, {$pull: {pendings: {username: other}}});
};

schema.statics.addToFriends = function(owner, other) {
	return this.findOneAndUpdate({ownerUsername: owner}, {$push: {friends: {username: other}}});
}

module.exports = mongoose.model('FriendList', schema);