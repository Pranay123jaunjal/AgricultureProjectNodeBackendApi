exports.ResponseSuccess=(res,message,data)=>{
    return res.status(200).json({
        message:message,
        data:data
    })
}
exports.ResponseErr=(res,message,err)=>{
    return res.status(400).json({
        message:message,
        err:err
    })
}