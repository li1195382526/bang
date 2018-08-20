module.exports.errorJson=function(res,ok=-1,msg="网络连接错误"){
    res.json({
        ok,
        msg
    })
}
module.exports.successJson=function(res,successAttr,successV){
    res.json({
        ok:1,
        [successAttr]:successV
    })
}
module.exports.getNowTime=function(){
    function _fn(num){
        if(num<10)
            return "0"+num;
        return num;
    }
    var date=new Date();
    return date.getFullYear()+"-"+
        _fn((date.getMonth()+1))+"-"+
        _fn(date.getDate())+" "+
        _fn(date.getHours())+":"+
        _fn(date.getMinutes())+":"+
        _fn(date.getSeconds());
}