export function response(command,response){
    return {
        command:command,
        payload:response
    }
}

export function createMessage(command,data){
    return JSON.stringify({
        command:command,
        payload:data})
}

export function parseMessage(raw){

    try {
        return JSON.parse(raw.toString())
    } catch (err) {
        return null
    }
}

// module.exports = {createMessage,parseMessage}
