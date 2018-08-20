const mongodb =require("mongodb");
const mongoClient=mongodb.MongoClient;
// module.exports.connect=function(cb){
//     mongoClient.connect("mongodb://127.0.0.1:27017",function(err,client){
//         if(err)
//             console.log("连接数据库失败")
//         else{
//             var db=client.db("weibo");
//             cb(db);
//         }
//     })
// }

function _conncet(cb){
    mongoClient.connect("mongodb://127.0.0.1:27017",function(err,client){
        if(err)
            console.log("连接数据库失败")
        else{
            var db=client.db("bang");
            cb(db);
        }
    })
}



/*
* 获得符合条件的文档数量
* collName:集合的名字
* whereObj:条件
* cb:回调函数，将文档数量通过该函数进行返回 */
module.exports.count=function(collName,whereObj,cb){
    _conncet(function(db){
        db.collection(collName).count(whereObj).then(cb)
        // db.collection(collName).count(whereObj).then(function(count){
        //     cb(count);
        // })
    })
}
/*
* 插入一条文档
* collName:集合名字
* insertObj:插入的内容
* cb:回调函数，将插入的结果进行返回*/
module.exports.insertOne=function(collName,insertObj,cb){
    _conncet(function(db){
        db.collection(collName).insertOne(insertObj,cb)
    })
}
/*
* 查找多条记录
* collName:集合名
* params:
*   whereObj:条件
*   sort:排序
*   limit:显示条数
*   skip:跳过条数
* cb:回调函数。*/
module.exports.find=function(collName,params,cb){
    _conncet(function(db){
        params.whereObj = params.whereObj||{};
        params.sort = params.sort||{};
        params.limit = params.limit||0;
        params.skip = params.skip||0;
        db.collection(collName).find(params.whereObj).sort(params.sort).limit(params.limit).skip(params.skip).toArray(cb)
    })
}
/*根据ID来删除记录
* collName:集合名字
* id:文档ID
* cb:回调函数*/
module.exports.deleteById=function(collName,id,cb){
    _conncet(function(db){
        db.collection(collName).deleteOne({
            _id:mongodb.ObjectId(id)
        },cb)
    })
}
/*根据ID来对文档进行修改
* collName:文档名字
* id
* upObj:修改的内容
* cb:回调函数*/
module.exports.upDateById=function(collName,id,upObj,cb){
    _conncet(function(db){
        db.collection(collName).updateOne({_id:mongodb.ObjectId(id)},upObj,cb);
    })
}

/*
 * 根据ID来查找记录
 * collName:集合名
 * id:标识
 * cb*/
module.exports.findOneById=function(collName,id,cb){
    _conncet(function(db){
        db.collection(collName).findOne({_id:mongodb.ObjectId(id)},cb)
    })
}


