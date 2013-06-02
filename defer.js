/*
defer
*/"use strict"

var deferred = {
    timeout: {},
    frame: {},
    immediate: {}
}

var UID = 0

var _defer = function(type, callback, arg){

    var collection = deferred[type],
        method     = functions[type]

    var empty = true
    for (var p in collection){
        empty = false;
        break;
    }
    var uid = (UID++).toString(36)
    if (empty) method(arg)
    collection[uid] = callback
    return function(){
        delete collection[uid]
    }

}

var iterate = function(collection){
    var time = new Date().getTime()

    var exec = {}
    for (var p in collection){
        exec[p] = collection[p]
        delete collection[p]
    }
    for (var p in exec) exec[p](time)
}

var immediate = function(){
    iterate(deferred.immediate)
}

var functions = {}

if (global.process && process.nextTick){
    functions.immediate = function(){
        process.nextTick(immediate)
    }
} else if (global.setImmediate){
    functions.immediate = function(){
        setImmediate(immediate)
    }
} else if (global.postMessage && global.addEventListener){

    addEventListener("message", function(event){
        if (event.source === global && event.data === "@deferred"){
            event.stopPropagation()
            immediate()
        }
    }, true)

    functions.immediate = function(){
        postMessage("@deferred", "*")
    }

} else {
    functions.immediate = function(){
        setTimeout(immediate, 0)
    }
}

var requestAnimationFrame = global.requestAnimationFrame ||
    global.webkitRequestAnimationFrame ||
    global.mozRequestAnimationFrame ||
    global.oRequestAnimationFrame ||
    global.msRequestAnimationFrame ||
    function(callback) {
        setTimeout(callback, 1e3 / 60)
    }

functions.frame = function(){
    requestAnimationFrame(function(){
        iterate(deferred.frame)
    })
}

functions.timeout = function(ms){
    var timeout = deferred.timeout
    var collection = timeout[ms] || (timeout[ms] = {})
    setTimeout(function(){
       iterate(collection)
    }, ms)
}

/*
export!
*/

var defer = function(callback, ms){
    return (ms) ? _defer("timeout", callback, ms) : _defer("immediate", callback)
}

defer.immediate = function(callback){
    return _defer("immediate", callback)
}

defer.timeout = function(callback, ms){
    if (!ms) ms = 0
    return _defer("timeout", callback, ms)
}

defer.frame = function(callback){
    return _defer("frame", callback)
}

module.exports = defer