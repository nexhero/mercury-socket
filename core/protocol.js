function createMessage(route,data){
    return JSON.stringify({
        route:route,
        payload:data})
}

function parseMessage(raw){
    try {
        return JSON.parse(raw.toString())
    } catch (err) {
        return null
    }
}

module.exports = {createMessage,parseMessage}
