var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
const { response } = require('express')

var objectId=require('mongodb').ObjectId
module.exports={
  
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
         userData.password=await bcrypt.hash(userData.password,10)
         db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
        console.log(userData);
            resolve(data.InsertOneResult);
        })

        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
if(user){
   
    bcrypt.compare(userData.password,user.password).then((status)=>{
if(status){
console.log("login succes");
response.user=user
response.status=true

resolve(response)
}else{
    console.log("login failed");
    resolve({status:false})
}
    })

        }else{
            console.log("login failed");
            resolve({status:false})
        }
    })
},
addToCart:(proId,userId)=>{
    let proObj={
        item:objectId(proId),
        quantity:1
    }
    return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(userCart){
            let proExist=userCart.products.findIndex(product=> product.item==proId)
            console.log(proExist);
            if(proExist!==-1){
                db.get().collection(collection.CART_COLLECTION).updateOne({
                 user:objectId(userId),   'products.item':objectId(proId)
                },
                {
                    $inc:{'products.$.quantity':1}
                }).then(()=>{
                    resolve()
                })
            }
            else{
            db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
            {
                $push:{products:proObj}

            }
            ).then(()=>{
                resolve()
            })
        }
        }else{
            let cartobj={
                user:objectId(userId),
                products:[proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response)=>{
                resolve()
            })
        }
    })
},
getCartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       
        let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([{
         
            $match:{user:objectId(userId)

               
            }
           
            },
            {
                $unwind:'$products'
            },{
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            }
         
        ]).toArray()
      console.log(cartItems[0].products);
        resolve(cartItems[0].cartItems)
    })
},
getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let count=0
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart){
            count=cart.products.length
        }
        resolve(count)
    })
}
}