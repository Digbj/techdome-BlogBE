const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const user=require('./schema/user')
const bcrypt=require("bcrypt")
const jwt=require('jsonwebtoken')
const cookieParser=require('cookie-parser')
const multer=require('multer');
const fs=require("fs");
const blog=require('./schema/blog');
const { info } = require('console');
const uploadMiddleware=multer({dest:'uploads/'})

const app=express();

const salt = bcrypt.genSaltSync(10);
const secret='jhuhebfcueb78687sd7c7s6t76t6';
//if we include the credentials in frontend we get a cors error to solve that we write {credentials:true,origin:http://localhost:3000/} 
app.use(cors({credentials:true,origin:'http://localhost:3000'} ));
app.use(express.json());
//cookie parser is to make the cookies readable for the frontend use
app.use(cookieParser());

app.use('/uploads', express.static(__dirname + '/uploads'));




mongoose.connect('mongodb+srv://mern:11223344@cluster0.tvlj3l0.mongodb.net/mern', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });


  app.post('/reg', async (req, res) => {
    const { rname, remail, rpassword } = req.body;
    try {
      const existingUser = await user.findOne({ email:remail });
  
      if (existingUser) {
        res.status(400).json('User already exists');
      } else {
        const userDet = await user.create({ name:rname, email:remail, password:bcrypt.hashSync(rpassword,salt), });
        res.json(userDet);
      }
    } catch (error) {
      res.status(400).json(error);
    }
  });
  

  //Login

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const userDet = await user.findOne({ email });
  
      if (!userDet) {
        res.status(400).json('User not found');
        return;
      }
  
      const pass = bcrypt.compareSync(password, userDet.password);
  
      if (pass) {
        jwt.sign({name:userDet.name, email, id: userDet._id}, secret, {}, (error, token) => {
          if (error) throw error;
  
          // Set the cookie in the response header
          res.cookie('token', token).json({ message: 'Cookie set successfully',id:userDet._id,name:userDet.name });
        });
      } else {
        res.status(400).json('Wrong credentials');
      }
    } catch (error) {
      res.status(400).json(error);
    }
  });
  
  
  app.get('/myprofile', (req, res) => {
    const { token } = req.cookies;
  
    if (!token) {
      // Handle the case when the token is missing or not provided
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  
    jwt.verify(token, secret, {}, (error, details) => {
      if (error) {
        // Handle the case when the token is invalid or expired
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
  
      // Send the user details as the response
      res.json(details);
    });
  });
  

app.post('/logout',(req,res)=>{
  res.cookie('token','').json('Loged Out')
})






app.post('/createBlog', uploadMiddleware.single('file'), async (req, res) => {
  const { originalname } = req.file;
  const part = originalname.split('.');
  const ext = part[part.length - 1];
  const filePath = req.file.path;
  const newPath = filePath + '.' + ext;
  fs.renameSync(filePath, newPath);

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;

    const { title, content } = req.body;
    const postDoc = await blog.create({
      title,
      content,
      cover: newPath,
      author:info.id
    });
    res.json(postDoc);
  });
});





app.get('/post', async(req,res)=>{
  const post=await blog.find().populate('author',['name']).sort({createdAt:-1});
  res.json(post)
})





app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  const singleDoc = await blog.findById(id).populate("author", ['name']);
  res.json(singleDoc);
});








app.listen(8000,()=>{
    console.log("app is listning at 8000")
})

