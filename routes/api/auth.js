const express=require('express');
const router=express.Router();
const auth=require("../../middleware/auth")
const User=require('../../models/User')
const {check , validationResult, } = require('express-validator');
const config=require("config")
const jwt=require('jsonwebtoken')
const bycrypt=require("bcryptjs")
// @route GET api/auth
//@desc Test Route
// @access Public

router.get('/',auth ,async(req,res)=>{
    try {
        const user=await User.findById(req.user.id).select("-password")
        res.json(user);
    } catch (error) {
        return res.status(500).send("Server error")
    }
}); 
// @route POST api/auth
//@desc Autheticate User and GEt token
// @access Public
router.post('/',[

    check('email','Please enter a valid email').not().isEmpty(),
    check("password",'Password is Required').isLength({min:6}),  
],async (req,res)=>{ 
    const errors=validationResult(req);
    if(!errors.isEmpty()){
         return res.status(400).json({errors:errors.array()})
    }
    const {email,password}=req.body;
    try {
        // see if user exist
        let user=await User.findOne({email});
        if(!user){
            return res.status(400).json({errors:[{msg:"Invalid Credentials"}]});
        }

        const isMatch=await bycrypt.compare(password,user.password)

        if(!isMatch){
            return res.status(400).json({errors:[{msg:"Invalid Credentials"}]});
        }

       
         
       
        const payload={
            user:{
                id:user.id
            }
        }

        jwt.sign(
            payload,
            config.get("jwtSecret"),
            {expiresIn:360000},
            (error,token)=>{
                if(error){
                    throw error;
                    
                }
                res.json({token});
            }
            );

         

    } catch (error) {
        return res.status(500).send("server error")
    }
    

   
}); 


module.exports=router; 