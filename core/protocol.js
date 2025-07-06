function createMessage(command,data){
    return JSON.stringify({
        command:command,
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
