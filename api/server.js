const express=require("express");//连接第三方模块
const fs=require("fs");//连接模块fs
const formidable=require("formidable");//接受formdate的数据
const help=require("./module/help");//连接自定义模块 正确信息和错误信息的返回值
const db=require("./module/db");//数据库的连接
const bangEnum=require("./module/enum")
//静态资源
app=express();
app.use(express.static("../manage"));//静态资源的调取
app.use(express.static("./uplode"));//图片静态资源的调取
app.use(express.static("../html"));
app.use(express.static("../css"));
app.use(express.static("../images"));
app.use(express.static("../manage/js"))

//广告部分
app.post("/adv",function(req,res){
    //console.log("lll")
    //formidable可以上传文件
    var form=new formidable.IncomingForm()//表单对象
    form.encoding="utf-8";//设置编码格式
    form.uploadDir="./uplode";//设置传输路径
    form.keepExtensions=true;//是否保留扩展名
    form.parse(req,function(err,params,file){//将req转换  params上传的项  file上传的文件
        //console.log(params);

    //    res.end("lalal")
        if(file["advPic"].size>0){//判断是否上传图片
            var path=file["advPic"].path;//图片路径
            var index=path.lastIndexOf(".");//找到.的下标
            var extens=path.substr(index).toLowerCase();//截取扩展名


            var picExtensions=[".png",".gif",".jpg","jpeg"];//图片扩展名的数组
            if(picExtensions.includes(extens)){//判断是否符合图片格式
                var newName=new Date().getTime();//一当前时间命名
                newName=newName+extens;//修改后的文件名
                //console.log(newName)
                fs.rename(path,"./uplode/"+newName,function(err){//对文件重命名

                    if(err){
                        res.json({
                            ok:-1,
                            msg:"网络连接失败"
                        })
                    } else{
                        delete params._id;
                        params.advType=params.advType/1;//l类型转为数字
                        params.orderNum=params.orderNum/1;//
                        params.addTime=help.getNowTime();
                        params.upTime=help.getNowTime();
                        params.advPic = newName;
                        //console.log(params.advPic)
                        db.insertOne("advList",params,function(err,results){
                            if(err){
                                res.json({
                                    ok:-1,
                                    msg:"网络连接错误"
                                })
                            }else{
                                res.json({
                                    ok:1,
                                    msg:"图片上传成功"
                                })
                            }
                        })
                    }
                })
            } else{
                fs.unlink(path,function(err){
                    if(err){
                        res.json({
                            ok:-1,
                            msg:"网络连接错误"
                        })
                    }else{
                        res.json({
                            ok:-1,
                            msg:"请选择正确格式的图片上传"
                        })
                    }
                })
            }
        }
    })

})
app.get("/adv",function(req,res){
    var pageIndex=req.query.pageIndex;//当前页
    var pageSum=1;//总页数
    var pageNum=2;//每页显示的条数

    var advType=req.query.advType/1;
    var keyWord=req.query.keyWord;
    //console.log(keyWord);
    var sortType=req.query.sortType;
    var whereObj={};
    if(advType>0)//根据类型搜索
        whereObj.advType=advType;//{}
    if(keyWord.length>0)
        whereObj.advName=new RegExp(keyWord)//;

    //var sort={orderNum:-1,upTime:-1};
    //if(sortType==1)
    //    sort={addTime:-1}


    db.count("advList",whereObj,function(count){
        pageSum=Math.ceil(count/pageNum);
        if(pageSum<1){
            pageSum=1;
        }
        if(pageIndex>pageSum){
            pageIndex=pageSum;
        }
        if(pageIndex<1){
            pageIndex=1;
        }
        db.find("advList",{
            whereObj:whereObj,//修改了的地方
            limit:pageNum,
            skip:(pageIndex-1)*pageNum,
            sort:{orderNum:-1,upTime:-1}
        },function(err,advList){
            res.json({
                ok:1,
                advList:advList,
                advTypeEnum:bangEnum.advTypeEnum,
                pageIndex:pageIndex,
                pageSum:pageSum
            })
        })
    })

})
app.delete("/adv",function(req,res){
    var id=req.query.id;
    db.findOneById("advList",id,function(err,advInfo){
        //console.log(advInfo);
        //console.log(advInfo.advPic)//1534425723647.jpg
        fs.unlink("./uplode/"+advInfo.advPic,function(err){
            if(err){
                res.json({
                    ok:-1,
                    msg:"失败"
                })
            }else{
                db.deleteById("advList",id,function(err){
                    res.json({
                        ok:1,
                        msg:"删除成功"
                    })
                })
            }
        })
    })
})
app.put("/adv",function(req,res){//修改
    var form=new formidable.IncomingForm();
    form.encoding="utf-8";
    form.uploadDir="./uplode";
    form.keepExtensions=true;
    form.parse(req,function(err,params,file){
        /*1、图片未上传，
         * 2、图片已上传*/
        if(file["advPic"].size>0){
            //验证图片是否符合要求
            var picExtensions=[".png",".gif",".jpg",".jpeg"];
            var path=file["advPic"].path;
            var extens=path.substr(path.lastIndexOf("."));
            if(picExtensions.includes(extens)){
                var newName=new Date().getTime()+extens;
                db.findOneById("advList",params._id,function(err,results){
                    fs.unlink("./uplode/"+results.advPic,function(err){
                        fs.rename(path,"./uplode/"+newName,function(err){
                            db.upDateById("advList",params._id,{$set:{
                                advName:params.advName,
                                advUrl:params.advUrl,
                                advType:params.advType/1,
                                upTime:help.getNowTime(),
                                orderNum:params.orderNum/1,
                                advPic:newName
                            }},function(err,reuslts){
                                res.json({
                                    ok:1,
                                    msg:"修改成功"
                                })
                            })
                        })
                    })
                })

            }else{
                res.json({
                    ok:-1,
                    msg:"请上传正确的图片。.png,.gif,.jpg,.jpeg"
                })
            }

        }else{//无
            db.upDateById("advList",params._id,{$set:{
                advName:params.advName,
                advUrl:params.advUrl,
                advType:params.advType/1,
                upTime:help.getNowTime(),
                orderNum:params.orderNum/1
            }},function(err,reuslts){
                res.json({
                    ok:1,
                    msg:"修改成功"
                })
            })
        }
    })

})
//商品部分
app.post("/goods",function(req,res){
    var form=new formidable.IncomingForm();
    form.encoding="utf-8";
    form.uploadDir="./uplode";
    form.keepExtensions=true;
    form.parse(req,function(err,params,file){
        if(file["goodsPic"].size>0){
            var path=file["goodsPic"].path;
            //console.log(file["goodsPic"])
            //console.log(path);//upload\upload_aa2b3341bf7504607a175eb6d45eb23a.jpg
            var index=path.lastIndexOf(".");
            var extens=path.substr(index).toLowerCase();
            var picExtensisions=[".png",".gif",".jpg",".jpeg"];
            if(picExtensisions.includes(extens)){
                var newName=new Date().getTime();
                newName=newName+extens;
                //console.log(newName)//1534402758051.jpg
                fs.rename(path,"./uplode/"+newName,function(err){
                    if(err){
                        res.json({
                            ok:-1,
                            msg:"网络错误"
                        })
                    }else{
                        delete params._id;
                        params.goodsType=params.goodsType/1;
                        params.orderNum=params.orderNum/1;
                        params.addTime=help.getNowTime();
                        params.upTime=help.getNowTime();
                        params.goodsPic=newName;
                        db.insertOne("goodsList",params,function(err,results){
                            if(err){
                                res.json({
                                    ok:-1,
                                    msg:"网络错误"
                                })
                            //else{
                            //        res.json({
                            //            ok:1,
                            //            msg:"上传图片成功"
                            //        })
                            //    }
                            }else{
                                res.json({
                                    ok:1,
                                    msg:"上传图片成功"
                                })
                            }
                        })
                    }
                })
            }else{
                fs.unlink(path,function(err){
                    if(err){
                        res.json({
                            ok:-1,
                            msg:"网络错误"
                        })
                    }else{
                        res.json({
                            ok:-1,
                            msg:"请输入正确格式的图片"
                        })
                    }
                })
            }
        }else{
            fs.unlink(file["goodsPic"].path,function(err){
                if(err){
                    res.json({
                        ok:-1,
                        msg:"网络连接错误！"
                    })
                }else{
                    res.json({
                        ok:-1,
                        msg:"请选择您要上传的图片！"
                    })
                }
            })
        }
    })
})
app.get("/goods",function(req,res){
    var pageIndex=req.query.pageIndex;
    var pageSum=1;
    var pageNum=4;
    var whereObj={};
    var keyWord=req.query.keyWord;
    var goodsType=req.query.goodsType/1;
    //console.log(goodsType);
    if(goodsType>0)//根据类型搜索
        whereObj.goodsType=goodsType;
    if(keyWord.length>0)
        whereObj.goodsName=new RegExp(keyWord)
    //console.log(whereObj.goodsName)
    db.count("goodsList",whereObj,function(count){
        pageSum=Math.ceil(count/pageNum);
        if(pageSum<1)
            pageSum=1;
        if(pageIndex>pageSum)
            pageIndex=pageSum;
        if(pageIndex<1)
            pageIndex=1;
        db.find("goodsList",{
            whereObj:whereObj,
            limit:pageNum,
            skip:(pageIndex-1)*pageNum
        },function(err,goodsList){
            res.json({
                ok:1,
                goodsList:goodsList,
                goodsTypeEnum:bangEnum.goodsTypeEnum,
                pageIndex:pageIndex,
                pageSum:pageSum

            })
        })
    })

})
app.delete("/goods",function(req,res){
    var id=req.query.id;
    db.findOneById("goodsList",id,function(err,goodsInfo){
        fs.unlink("./uplode/"+goodsInfo.goodsPic,function(err){
           if(err){
               res.json({
                   ok:-1,
                   msg:"删除失败"
               })
           }else{
               db.deleteById("goodsList",id,function(err){
                   res.json({
                       ok:1,
                       msg:"删除成功"
                   })
               })
           }
        })
    })
})
app.put("/goods",function(req,res){//修改
    var form=new formidable.IncomingForm();
    form.encoding="utf-8";
    form.uploadDir="./uplode";
    form.keepExtensions=true;
    form.parse(req,function(err,params,file){
        /*1、图片未上传，
         * 2、图片已上传*/
        if(file["goodsPic"].size>0){
            //验证图片是否符合要求
            var picExtensions=[".png",".gif",".jpg",".jpeg"];
            var path=file["goodsPic"].path;
            var extens=path.substr(path.lastIndexOf("."));
            if(picExtensions.includes(extens)){
                var newName=new Date().getTime()+extens;
                db.findOneById("goodsList",params._id,function(err,results){
                    fs.unlink("./uplode/"+results.goodsPic,function(err){
                        fs.rename(path,"./uplode/"+newName,function(err){
                            db.upDateById("advList",params._id,{$set:{
                                goodsName:params.goodsName,
                                goodsUrl:params.goodsUrl,
                                goodsType:params.goodsType/1,
                                upTime:help.getNowTime(),
                                orderNum:params.orderNum/1,
                                goodsPic:newName
                            }},function(err,reuslts){
                                res.json({
                                    ok:1,
                                    msg:"修改成功"
                                })
                            })
                        })
                    })
                })

            }else{
                res.json({
                    ok:-1,
                    msg:"请上传正确的图片。.png,.gif,.jpg,.jpeg"
                })
            }

        }else{//无
            db.upDateById("goodsList",params._id,{$set:{
                goodsName:params.goodsName,
                goodsUrl:params.goodsUrl,
                goodsType:params.goodsType/1,
                upTime:help.getNowTime(),
                orderNum:params.orderNum/1
            }},function(err,reuslts){
                res.json({
                    ok:1,
                    msg:"修改成功"
                })
            })
        }
    })

})
app.get("/advById",function(req,res){
    var id=req.query.id;
    db.findOneById("advList",id,function(err,advInfo){
        res.json({
            ok:1,
            advInfo:advInfo
        })
    })
})
app.get("/goodsById",function(req,res){
    var id=req.query.id;
    db.findOneById("goodsList",id,function(err,goodsInfo){
        res.json({
            ok:1,
            goodsInfo:goodsInfo
        })
    })
})

//店铺部分
app.post("/shop",function(req,res){
    var form=new formidable.IncomingForm();
    form.encoding="utf-8";
    form.uploadDir="./uplode";
    form.keepExtensions=true;
    form.parse(req,function(err,params,file){
        if(file["shopPic"].size>0){
            var path=file["shopPic"].path;
            //console.log(file["goodsPic"])
            //console.log(path);//upload\upload_aa2b3341bf7504607a175eb6d45eb23a.jpg
            var index=path.lastIndexOf(".");
            var extens=path.substr(index).toLowerCase();
            var picExtensisions=[".png",".gif",".jpg",".jpeg"];
            if(picExtensisions.includes(extens)){
                var newName=new Date().getTime();
                newName=newName+extens;
                //console.log(newName)//1534402758051.jpg
                fs.rename(path,"./uplode/"+newName,function(err){
                    if(err){
                        res.json({
                            ok:-1,
                            msg:"网络错误"
                        })
                    }else{
                        delete params._id;
                        params.shopNum=params.orderNum/1;
                        params.addTime=help.getNowTime();
                        params.upTime=help.getNowTime();
                        params.shopPic=newName;
                        db.insertOne("shopList",params,function(err,results){
                            if(err){
                                res.json({
                                    ok:-1,
                                    msg:"网络错误"
                                })
                            }else{
                                res.json({
                                    ok:1,
                                    msg:"上传图片成功"
                                })
                            }
                        })
                    }
                })
            }else{
                fs.unlink(path,function(err){
                    if(err){
                        res.json({
                            ok:-1,
                            msg:"网络错误"
                        })
                    }else{
                        res.json({
                            ok:-1,
                            msg:"请输入正确格式的图片"
                        })
                    }
                })
            }
        }else{
            fs.unlink(file["shopPic"].path,function(err){
                if(err){
                    res.json({
                        ok:-1,
                        msg:"网络连接错误！"
                    })
                }else{
                    res.json({
                        ok:-1,
                        msg:"请选择您要上传的图片！"
                    })
                }
            })
        }
    })
})
app.get("/shop",function(req,res){
    var pageIndex=req.query.pageIndex;//当前页
    var pageSum=1;//总页数
    var pageNum=2;//每页显示的条数

    var shopType=req.query.shopType/1;
    var keyWord=req.query.keyWord;
    //console.log(keyWord);
    var sortType=req.query.sortType;
    var whereObj={};
    if(keyWord.length>0)
        whereObj.shopName=new RegExp(keyWord)//;
    db.count("shopList",whereObj,function(count){
        pageSum=Math.ceil(count/pageNum);
        if(pageSum<1){
            pageSum=1;
        }
        if(pageIndex>pageSum){
            pageIndex=pageSum;
        }
        if(pageIndex<1){
            pageIndex=1;
        }
        db.find("shopList",{
            whereObj:whereObj,//修改了的地方
            limit:pageNum,
            skip:(pageIndex-1)*pageNum,
            sort:{orderNum:-1,upTime:-1}
        },function(err,shopList){
            res.json({
                ok:1,
                shopList:shopList,
                pageIndex:pageIndex,
                pageSum:pageSum
            })
        })
    })

})
app.delete("/shop",function(req,res){
    var id=req.query.id;
    db.findOneById("shopList",id,function(err,shopInfo){
        fs.unlink("./uplode/"+shopInfo.shopPic,function(err){
            if(err){
                res.json({
                    ok:-1,
                    msg:"失败"
                })
            }else{
                db.deleteById("shopList",id,function(err){
                    res.json({
                        ok:1,
                        msg:"删除成功"
                    })
                })
            }
        })
    })
})
app.put("/shop",function(req,res){//修改
    var form=new formidable.IncomingForm();
    form.encoding="utf-8";
    form.uploadDir="./uplode";
    form.keepExtensions=true;
    form.parse(req,function(err,params,file){
        /*1、图片未上传，
         * 2、图片已上传*/
        if(file["shopPic"].size>0){
            //验证图片是否符合要求
            var picExtensions=[".png",".gif",".jpg",".jpeg"];
            var path=file["shopPic"].path;
            var extens=path.substr(path.lastIndexOf("."));
            if(picExtensions.includes(extens)){
                var newName=new Date().getTime()+extens;
                db.findOneById("shopList",params._id,function(err,results){
                    fs.unlink("./uplode/"+results.shopPic,function(err){
                        fs.rename(path,"./uplode/"+newName,function(err){
                            db.upDateById("shopList",params._id,{$set:{
                                shopName:params.shopName,
                                shopUrl:params.shopUrl,
                                shopType:params.shopType/1,
                                upTime:help.getNowTime(),
                                orderNum:params.orderNum/1,
                                shopPic:newName
                            }},function(err,reuslts){
                                res.json({
                                    ok:1,
                                    msg:"修改成功"
                                })
                            })
                        })
                    })
                })

            }else{
                res.json({
                    ok:-1,
                    msg:"请上传正确的图片。.png,.gif,.jpg,.jpeg"
                })
            }

        }else{//无
            db.upDateById("shopList",params._id,{$set:{
                shopName:params.shopName,
                shopUrl:params.shopUrl,
                shopType:params.shopType/1,
                upTime:help.getNowTime(),
                orderNum:params.orderNum/1
            }},function(err,reuslts){
                res.json({
                    ok:1,
                    msg:"修改成功"
                })
            })
        }
    })

})
app.get("/shopById",function(req,res){
    var id=req.query.id;
    db.findOneById("shopList",id,function(err,shopInfo){
        res.json({
            ok:1,
            shopInfo:shopInfo
        })
    })
})

//前端页面获取接口
app.get("/advByType",function(req,res){
    var advType=req.query.advType || 1;
    var limit=req.query.limit || 1;
    //advType  limit
    db.find("advList",{
        // whereObj:{advType},
        // advType:1,
        limit:4,
        //sort:{orderNum:-1,addTime:-1}
    },function(err,advList){
        res.json({
            ok:1,
            advList:advList
        })
    })
})
app.get("/advThird",function(req,res){
    // var advType=req.query.advType||1;
    // var limit=req.query.limit||1;
    db.find("advList",{
        skip:4,
        limit:5
    },function(err,advList){
        res.json({
            ok:1,
            advList:advList
        })
    })
})
app.get("/advFore",function(req,res){
    // var advType=req.query.advType||1;
    // var limit=req.query.limit||1;
    db.find("advList",{
        skip:9
    },function(err,advList){
        res.json({
            ok:1,
            advList:advList
        })
    })
})
app.get("/shopAll",function(req,res){
    db.find("shopList",{
    },function(err,shopList){
        res.json({
            ok:1,
            shopList:shopList
        })

    })
})
app.listen(80,function(){
    console.log("连接成功")
})
