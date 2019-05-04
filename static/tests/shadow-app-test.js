Shadow = require("../shadow");

STATE = {};
Deltas1 = [
//    [{"mk":"Project.7", "u":1, "t":2981984}],
    [{"ed": "Project.7.title", "u": 1, "t": 1209814221}, {"ins": "Title"}],
    [{"ed": "Project.7.description", "u": 1, "t": 331029111}, {"ins": "Description of Project"}],
//    [{"mk":"Privilege.1", "u":1, "t":2981984}],
    [{"ed":"Privilege.1", "u":1, "t":2981984},{'set':7}]
]


Deltas2 = [
    [{"mk":"Node.380", "ptg":0, "pos":0, "u":1, "t":1532452741.31830}],
    [{"ed":"Node.380.heading", "u": 1, "t": 1532452741.31834}, {"ins": "Heading 1\n"}],
    [{"ed":"Node.380.content", "u": 1, "t": 1532452741.31834}, {"ins": "sdf\n"}],
    [{"ed":"Node.380.content", "u": 1, "t": 1532453452.80098}, {"retain": 2}, {"ins": " asdfasdf"}],
    [{"ed":"Node.380.content", "u": 1, "t": 1532454355.54288}, {"retain": 10}, {"del": 1}],
    [{"ed":"Node.380.content", "u": 1, "t": 1532455595.79278}, {"ins": "ss "}],
    [{"ed":"Node.380.content", "u": 1, "t": 1532455700.37069}, {"ins": "aa"}]
]

Shadow.App.applyDeltaToJSON(STATE, Deltas1);
Shadow.App.applyDeltaToJSON(STATE, Deltas2);


console.log(JSON.stringify(STATE) == '{"Project":{"7":{"title":"Title","description":"Description of Project"}},"Privilege":{"1":7},"Node":{"380":{"heading":"Heading 1\\n","content":"aass sd asdfasdf\\n"}}}');

console.log(JSON.stringify(STATE))