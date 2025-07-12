import * as winston from 'winston'

export default function loggerInstance(verbose = false){
    const transports = [new winston.transports.File({ filename: 'app.log' })]
    if (verbose) {
        transports.push(new winston.transports.Console())
    }

    const logger = winston.createLogger({
        level: 'info', // can be 'error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message }) => {
                return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
            })
        ),

        transports: transports,
    });
    return logger
}
