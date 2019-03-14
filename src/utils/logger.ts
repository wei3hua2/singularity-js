import {CONFIG} from '../configs/config';

class Logger {

    level: number;
    specLevel: string;
    static _logger:Logger;

    constructor(logLevel?:number){
        if(!logLevel) this.level = CONFIG.DEFAULT_LOG_LEVEL;
    }

    info(...params) {
        if(this.specLevel === 'info') console.info(...params);
        else if(!this.specLevel && this.level < 3) console.info(...params);
    }
    debug(...params) {
        if(this.specLevel === 'debug') console.debug('[DEBUG] '+ (Date.now() / 1000) + ' ' + params);
        else if(!this.specLevel && this.level < 2) console.debug('[DEBUG] '+ (Date.now() / 1000) + ' ' + params);
    }
    error(...params) {
        if(this.specLevel === 'error') console.error(...params);
        else if(!this.specLevel && this.level < 1) console.error(...params);
    }
    trace(...params) {
        if(this.specLevel === 'trace') console.trace(...params);
        else if(!this.specLevel && this.level < 5) console.trace(...params);
    }
    warn(...params) {
        if(this.specLevel === 'warn') console.warn(...params);
        else if(!this.specLevel && this.level < 4) console.warn(...params);
    }


    static logger() {
        if(!this._logger) this._logger = new Logger();

        return this._logger;
    }

    static setLogLevel(level: number): void {
        if(!this._logger) this._logger = new Logger(level);
        else this._logger.level = level;
    }
    static setSpecificLevel(specLevel: string): void {
        if(!this._logger) this._logger = new Logger();
        else this._logger.specLevel = specLevel;
    }
}

export {Logger}