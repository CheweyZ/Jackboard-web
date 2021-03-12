
/**
 * @author CheweyZ
 */
class EventMgr{
    constructor(){
        /** @type {Map<String,Array<Function>} */
        this.hold=new Map()
    }
    /**
     * @param {String} evnt 
     * @param {Function} cb 
     */
    on(evnt,cb){
        let arr=this.hold.get(evnt)
        if(arr){
            arr.push(cb)
        }else{
            this.hold.set(evnt,[cb])
        }
    }
    /**
     * 
     * @param {String} evnt 
     * @param {Function} cb 
     * @returns {Function} used to clear
     */
    once(evnt,cb){
        let res=(bdy)=>{
            this.remove(evnt,res)
            cb(bdy)
        }
        this.on(evnt,res)
        return res;
    }
    /**
     * @param {String} evnt 
     * @param {any} body 
     */
    emit(evnt,body){
        let arr=this.hold.get(evnt)
        if(arr){
            arr.forEach(a=>a(body))
        }
    }
    /**
     * 
     * @param {String} evnt 
     * @param {Function} cb 
     */
    remove(evnt,cb){
        let arr=this.hold.get(evnt)
        if(arr){
            let idx=arr.indexOf(cb)
            if(idx!=-1){
                arr.splice(idx,1)
            }
            if(!arr.length){
                this.hold.delete(evnt)
            }
        }
    }
    /**
     * 
     * @param {String} evnt 
     */
    removeAll(evnt){
        this.hold.delete(evnt)
    }
}

module.exports=EventMgr