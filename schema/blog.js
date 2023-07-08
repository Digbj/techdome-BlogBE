const mongoose=require('mongoose')
const {Schema,model}=mongoose;
const userSchema= new Schema({
    title:{type:String},
    content:{type:String},
    cover:{type:String},
    author:{type:Schema.Types.ObjectId,ref:"User"}
},{
    timestamps:true,
})
const blog= model('Blog',userSchema);
module.exports=blog;