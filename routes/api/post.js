const express=require('express');
const router=express.Router();
const {check,validationResult}=require('express-validator');
const auth=require('../../middleware/auth');

const Post=require('../../models/Post');
const Profile=require('../../models/Profile');
const User=require('../../models/User');

// @route POST api/post
//@desc Create post
// @access Private
router.post('/',[auth,[
    check('text',"Text is Required").not().isEmpty()
]],async (req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({errors :errors.array()});

     try {
        const user= await User.findById(req.user.id).select('-password');
        const newPost = new Post({
            text:req.body.text,
            name:user.name,
            avatar:user.avatar,
            user:req.user.id
        })

        const post= await newPost.save();
        res.json(post);
     } catch (error) {
        console.error(error.message);
        return res.status(500).json("server error");
     }
}); 
   
 //@route GET api/posts
 //@desc GET all posts
 //@access Private
 router.get('/',auth,async(req,res)=>{
    try {
        const posts=await Post.find().sort({Date:-1});
        res.json(posts);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('server error');
    }
 });
  //@route GET api/posts/:id
 //@desc GET all posts by id
 //@access Private
 router.get('/:id',auth,async(req,res)=>{
    try {
        const post=await Post.findById(req.params.id).sort({Date:-1});
        if(!post)
        {
           
            return res.status(404).json({msg:"post not found"});
        }
        res.json(post);
    } catch (error) {
        console.log(error.message);
        if(error.kind==='ObjectId')
        {
            return res.status(404).json({msg:"post not found"});
        }
        return res.status(500).send('server error');
    }
 });

 //@route GET api/posts/user/:user_id
 //@desc GET all posts by user
 //@access Private
 router.get('/user/:user_id',auth,async(req,res)=>{
    try {
        const post = await Post.find({user:req.params.user_id}).sort({Date:-1});
        if(!post)
        {   
            
            return res.status(404).json({msg:"post not found"});
        }

        res.json(post);
    } catch (error) {
        console.log(error.message);
        if(error.kind==='ObjectId')
        {
            
            return res.status(404).json({msg:"post not found"});
        }
        return res.status(500).send('server error');
    }
 });

  //@route DELETE api/posts/:id
 //@desc Delete a post
 //@access Private
 router.delete('/:id',auth,async(req,res)=>{
    try {
        const post=await Post.findById(req.params.id);
        if(!post)
        {
            return res.status(404).json({msg:"post not found"});
        }
        
        if(post.user.toString()!== req.user.id)
        {
            return res.status(401).json({msg:"User not authorized"});   
        }
        await Post.findByIdAndRemove(req.params.id);
        res.json({msg:"Post removed"});
    } catch (error) {
        console.log(error.message);
        if(error.kind==='ObjectId')
        {
            return res.status(404).json({msg:"post not found"});
        }
        return res.status(500).send('server error');
    }
 });

 //@route PUT api/posts/like/:id
 //@desc Like a post
 //@access Private

 router.put('/like/:id',auth,async(req,res)=>{
    try {
        const post= await Post.findById(req.params.id);

        if(post.likes.filter(like => like.user.toString()===req.user.id).length>0)
        {
            return res.status(400).json({msg:"post is already liked"});
        }
        post.likes.unshift({user:req.user.id});
        await post.save();
        res.json(post.likes);
    } catch (error) { 
        console.log(error.message);
        return res.status(500).send("server error")
    }
 });
 //@route PUT api/posts/unlike/:id
 //@desc UnLike a post
 //@access Private

 router.put('/unlike/:id',auth,async(req,res)=>{
    try {
        const post= await Post.findById(req.params.id);

        if(post.likes.filter(like => like.user.toString()===req.user.id).length==0)
        {
            return res.status(400).json({msg:"post has not been liked yet"});
        }
       
        const removeIndex= await post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex,1);

        await post.save();
        res.json(post.likes);
    } catch (error) { 
        console.log(error.message);
        return res.status(500).send("server error")
    }
 });

 // @route POST api/post/comment/:id
//@desc Comment on post
// @access Private
router.post('/comment/:id',[auth,[
    check('text',"Text is Required").not().isEmpty()
]],async (req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({errors :errors.array()});

     try {
        const user= await User.findById(req.user.id).select('-password');
        const post= await Post.findById(req.params.id);
        const newComment={
            text:req.body.text,
            name:user.name,
            avatar:user.avatar,
            user:req.user.id
        }

       post.comments.unshift(newComment);
       await post.save();
        res.json(post.comments);
} catch (error) {
        console.error(error.message);
        return res.status(500).json("server error");
     }
}); 

//@route DELETE api/post/comments/:id/:comments_id
 //@desc Delete a comment on post
 //@access Private
 router.delete('/:id/comment/:comment_id',auth,async(req,res)=>{
    try {
        const post=await Post.findById(req.params.id);
        const comment= post.comments.find(comment=>comment.id===req.params.comment_id);
       
        if(!comment){
            return res.status(404).json({msg:"Comment does not exist"});
        }
       
        if(comment.user.toString()!==req.user.id)
        {
            return res.status(401).json({msg:"User not authorised"});
        }

        const removeIndex =  post.comments.map(comment=>comment.id).indexOf(req.params.comment_id);
        post.comments.splice(removeIndex,1);
        await post.save();
         res.json(post.comments);
        

    } catch (error) {
        console.log(error.message);
        if(error.kind==='ObjectId')
        {
            return res.status(404).json({msg:"post not found"});
        }
        return res.status(500).send('server error');
    }
 });

module.exports=router;