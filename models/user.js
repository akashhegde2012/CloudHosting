var mongoose=require('mongoose');
var passportLocalMongoose=require('passport-local-mongoose');

var UserSchema=new mongoose.Schema({
    username:String,
    password:String,
    containers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Container"
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model('User',UserSchema);