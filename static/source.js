import shadow from "./shadow";

var Source = (function(){

    var State = (function(){
        var Log = []; //// Log for macro edits like "mk", "rm", and "mv"
        //// "ed" deltas are kept in Resource logs.
        var Resources = {

        }
    
        function newResource(delta){
            return {
                "id": delta['mk'],
                "ptg": delta['ptg'] || 0,
                "pos": delta['pos'] || 0,
                "log":[],
                "fields":{}
            }
        }
    
        function applyDelta(delta){
            if (delta.hasOwnProperty('mk')){
                Resources[delta['mk']] = newResource(delta);
//                Resources[delta['mk']].log.push(delta);
            } else if (delta.hasOwnProperty('ed')){
                shadow.Delta.mergeDeltas()
            } else if (delta.hasOwnProperty('rm')){
//                Resources[delta["rm"]].log.push(delta);
                View.remove(delta["rm"])
            } else if (delta.hasOwnProperty('mv')){
//                Resources[delta['mv']].log.push(delta);

//            } else if (delta.hasOwnProperty('set') ){ //// No "set". "set" is comparable to "ins", not "ed"
//                Resources[delta['set']]
            } else {
                return ;
            }
            Log.push(delta);
        }

        function getVal(ID){
            return Resources[ID]
        }
        return {applyDelta:applyDelta, getVal:getVal}
    })();

    var List = (function(){

        return {}
    })();

    var View = (function(){

    })();

})();