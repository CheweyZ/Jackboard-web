/**
 * @author CheweyZ
 */

const EventMgr=require("./eventManager")

class JackBord extends EventMgr{    
    /**
     * 
     * @param {String} boardID 
     * @param {import("mqtt")} mqttHandle 
     */
    constructor(boardID,mqttHandle){
        super()
        this.timeoutWait=5000 //ms to wait for pin update to occur
        this.maxProgramStorage=10 //max number of program slots
        this.boardID=boardID
        this.mqttHandle=mqttHandle
        /** @type {Map<String,Number>} */
        this.chanMap=new Map()
        mqttHandle.subscribe(boardID+"/chan/+")
        mqttHandle.subscribe(boardID+"/prog_code")
        
        const idLen=boardID.length
        mqttHandle.on("message",
        /**
         * 
         * @param {String} topic 
         * @param {Buffer} message 
         * @param {Packet} packet 
         */
        (topic, message, packet)=>{
            if(topic.startsWith(boardID)){
                message=message.toString()
                if (topic.startsWith("/chan/",idLen)) {
                    // Channel update event
                    if(!isNaN(message)){
                        let chan=topic.replace(/.*\/(.+)/, "$1")
                        this.updateChannel(chan,Number(message))
                    }
                }else if(topic.startsWith("/prog_code",idLen)){
                    this.emit("prog_code",message)
                }
            }
        })
    }

    /**
     * Purly middle for the jsdoc suggestion on events
     * @param {"prog_code"|"channelUpdate"|"channelUpdateXX"} evnt 
     * @alias EventMgr~on
     */
    on(evnt,cb){
        return super.on(evnt,cb)
    }

    /**
     * 
     * @param {String} chan 
     * @param {Number} value
     * @emits channelUpdate 
     * @returns {JackBord}
     */
    updateChannel(chan,value){
        this.chanMap.set(chan,value)
        this.emit("channelUpdate",{
            channel:chan,
            value
        })
        this.emit(`changeChannel${chan}`,value)
        return this;
    }

    /**
     * Converts channel name/number to its standard number form
     * @param {String|Number} chan
     * @returns {Number} 
     */
    resolveChannel(chan){
        // TODO: Validate channel number

        return chan;
    }
    /**
     * @param {String} chan 
     * @param {Number} value 
     * @returns {Promise<Number>}
     */
    togglePin(chan){
        return new Promise((resolve,reject)=>{
            this.sendCommand(`tg ${chan}`)
            let timer=setTimeout(() => {
                this.remove(`changeChannel${chan}`,listen)
                reject("Timeout toggle pin",this.boardID,chan)
            }, this.timeoutWait);

            let listen=this.once(`changeChannel${chan}`,(val)=>{
                clearTimeout(timer)
                resolve(val)
            })
        })
    }

    /**
     * 
     * @param {Number} num 
     * @alias JackBord~sendData
     */
    sendButtonCommand(num){
        return this.sendCommand(`ubut ${num}`)
    }
    /**
     * 
     * @param {String} msg 
     * @alias JackBord~sendData
     */
    sendCommand(msg){
        return this.sendData("cmd",msg)
    }
    /**
     * @param {String} channel
     * @param {String} msg 
     * @returns {JackBord}
     */
    sendData(channel,msg){
        if(msg!=""){
            this.mqttHandle.publish(`${this.boardID}/${channel}`,msg)
        }
        return this;
    }

    /**
     *  
     * @alias JackBord~sendCommand
     */
    pauseProgram(){
        return this.sendCommand("pauseprog")
    }
    /**
     *  
     * @alias JackBord~sendCommand
     */
    resumeProgram(){
        return this.sendCommand("resumeprog")
    }

    /**
     *  
     * @alias JackBord~sendCommand
     */
    singleStep(){
        return this.sendCommand("singlestep")
    }
    /**
     *  
     * @alias JackBord~sendCommand
     */
    toggleDebug(){
        return this.sendCommand("trdbg")
    }

    // ++++++++++++ User Programs interface

    /**
     * 
     * @param {Number} progNumber 
     * @returns {Boolean}
     */
    validUserProgramNumber(progNumber){
        return isNaN(progNumber) || progNumber<0 || progNumber>this.maxProgramStorage
    }

    /**
     * 
     * @param {Number} saveNumber 
     * @param {String} data
     * @returns {JackBord} 
     */
    saveUserProgram(saveNumber,data){
        if(this.validUserProgramNumber(saveNumber)){
            throw new Error(`Invalid save number (Must be between 0-${this.maxProgramStorage}): ${saveNumber}`)
        }
        // this.sendData("save_prog_code",data).sendCommand(`save_user_prog_no ${saveNumber}`)
        this.sendData(`save_prog_code/${saveNumber}`,data)
        return this;
    }

    /**
     * 
     * @param {Number} programNumber 
     * @returns {JackBord} 
     */
    runUserProgram(programNumber){
        if(this.validUserProgramNumber(programNumber)){
            throw new Error(`Invalid program number (Must be between 0-${this.maxProgramStorage}): ${programNumber}`)
        }
        this.sendCommand(`run_user_prog_no ${programNumber}`)
        return this;
    }

    /**
     *  
     * @alias JackBord~sendCommand
     */
    stopUserProgram(){
        return this.sendCommand("stop_user_prog")
    }

    /**
     * 
     * @param {Number} programNumber
     * @returns {Promise<String>} 
     */
    loadUserProgram(programNumber){
        return new Promise((resolve,reject)=>{
            if(this.validUserProgramNumber(programNumber)){
                return reject(`Invalid program number (Must be between 0-${this.maxProgramStorage}): ${programNumber}`)
            }
            // TODO timeout handler
            this.sendCommand(`load_prog_code ${programNumber}`).once("prog_code",resolve)
        })
    }
}

module.exports=JackBord