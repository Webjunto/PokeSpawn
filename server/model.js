// Pulls Mongoose dependency for creating schemas
var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;

// Creates a User Schema. This will be the basis of how user data is stored in the db

var TweetSchema = new Schema({
    id: {type: String, required: true},
    text: {type: String, required: true},
    screen_name: {type: String, required: true},
    profile_image_url: {type: String, required: true},
    media_url_https: {type: String, requied: true},
    coordinates: {type: [Number], required: true}, // [Long, Lat] -- Different than Google Maps (Lat, Long)
    // $channels: {type: [Number], required: true}, // 
    keywords: {type: [String], required: true}, // 
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
});

// Sets the created_at parameter equal to the current time
TweetSchema.pre('save', function(next){
    now = new Date();
    this.updated_at = now;
    if(!this.created_at) {
        this.created_at = now
    }
    next();
});

// Indexes this schema in 2dsphere format (critical for running proximity searches)
TweetSchema.index({location: '2dsphere'});

// Exports the TweetSchema for use elsewhere. Sets the MongoDB collection to be used as: "jedi-users" 
// (Note: jedi-users” isn’t a typo. Mongoose adds an extra letter ‘s’ when creating collections).
module.exports = mongoose.model('jedi-user', TweetSchema);
