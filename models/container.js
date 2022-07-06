
  
var mongoose=require('mongoose');

var containerSchema =new mongoose.Schema({
    github_link:String,
    container_name:String,
    container_id:String,
    image_name:String,
    port:Number,
    deployed_url: String,
    // image_id:String,
    owner :{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        username:String
    },
    
});

module.exports =mongoose.model('Container',containerSchema);