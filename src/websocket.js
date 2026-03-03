

var websockets = []


var wsConnected = false

function startWebsocket(url, id)
{
    console.log('Trying to open a WebSocket connection...' + id + ' ' + url);
    websockets[id] = new WebSocket(url);
    websockets[id].id = id
    websockets[id].onopen    = onOpen;
    websockets[id].onclose   = onClose;
    websockets[id].onmessage = onMessage;
}


var onMessageCallback = null
var onClosedCallback = null
var onOpenCallback = null





function setOnMessageCallback(callback)
{
    onMessageCallback = callback
}

function setOnClosedCallback(callback)
{
    onClosedCallback = callback
}

function setOnOpenCallback(callback)
{
    onOpenCallback = callback
}




function onOpen(event)
{
    console.log('Connection opened' + event.currentTarget.id);
    if(onOpenCallback != null)
    {
        onOpenCallback(event)
    }
}


function onClose(event)
{
    console.log('Connection closed ' + event.currentTarget.url + ' ID: ' + event.currentTarget.id);
    if(findIP(event.currentTarget.url))
    {
        // If this URL has been removed from the list
         setTimeout(startWebsocket, 100, event.currentTarget.url, event.currentTarget.id);
    }         
    if(onClosedCallback != null)
    {
        onClosedCallback(event)
    }
}

function sendPacket(obj, wsID)
{
    if(websockets[id] != null && websockets[id].readyState == OPEN)
    {
        websockets[id].send(obj)
    }       
}

function onMessage(event)
{
    if(onMessageCallback != null)
    {
        onMessageCallback(event);
    }  
}

function findIP(ip)
{
    var found = false
    websockets.some((ws) => 
    {
        var r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/; //http://www.regular-expressions.info/examples.html

        var t = ws.url.match(r);    // Extract just the ip tp t
        if(t != null && t[0].length && t[0]==ip)
        {
            found = true
            return true
        }
    })
    return found;
}

function getConnections()
{
    var count = 0
    websockets.forEach((ws)=>
    {
        if(ws.readyState == WebSocket.OPEN)
        {
            count++
        }
    } )
    return count
}


function removeDisconnected()
{
    var count = 0
    websockets.forEach((ws)=>
    {
        if(ws.readyState != WebSocket.OPEN)
        {
            websockets.splice(count,1)
        }
        count++
    } )

}


export {startWebsocket, setOnMessageCallback, setOnOpenCallback, setOnClosedCallback, findIP, getConnections, removeDisconnected}