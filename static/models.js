
var MODELS;
(function(){
    if (exports){ //// SERVER
        var Delta = require("../delta").default;
        var STATIC = require("./static-vars.json");
    } else { //// CLIENT
        var Delta = Shadow.Delta;
    }

    MODELS = {
        'Node':{
            "name": "Node",
            "base": "Model",
            "idInjection": true,
            "options": {
            "validateUpsert": true
            },
            "properties": {
            "heading": {
                "type": "string",
                "required": true,
                "default": Delta.createDelta(STATIC.INSERT, "\n") //// no range attribute, b/c that is determined post-processing. No range attribute allowed.
            },
            "content": {
                "type": "string",
                "required": true,
                "default": Delta.createDelta(STATIC.INSERT, "\n", {"range":"text"})
            },
            "order": {
                "type": [
            "any"
                ],
                "default": "[]"
            }
            },
            "validations": [],
            "relations": {},
            "acls": [],
            "methods": {}
        }
    }    
    /*    "Source":{
            "attributes":{
                "type":"bibliography"
            },
            "fields":{
                "bibliography":{
                    "type":"complex"
                }
            }
        },
        "Cite":{
            "attributes":{
                "type":"child-object",
                "parent":"Source"
            }
            "fields":{
                "content":{
                    "type":"rich-text"
                },
                "note":{
                    "type":"rich-text"
                },
                "pin":{/// "pincite"
                    "type":"plain-text"
                }
            }
        }
        "Reference":{
            "attributes":{
                "type":"M2M-relational",
                "allowed":["Node","Citation","Source"]
            }
        }*/

})();
if (exports){
    exports.Model = MODELS;
}