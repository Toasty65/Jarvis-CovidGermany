const mongoose = require('mongoose');

const stringReqType = {
	type: String,
	required: true,
};

const prefixSchema = mongoose.Schema({
    _id: stringReqType,
    prefix: stringReqType,
});

module.exports = mongoose.model('prefixSchema', prefixSchema);