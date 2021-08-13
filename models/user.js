const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');


const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
});

// this line is very important in order for authentication to work. (See authenticate() in documentation)
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);