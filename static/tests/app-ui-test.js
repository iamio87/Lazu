var Test = (function(){
    function fuzz(){
        return 300;
        return Math.floor(Math.random() * 500); //// 500 is a balance between quick tests & giving DOM time to load.
    }

    function click (DOM, ATTR){
        var e = new MouseEvent("click",{view:window, bubbles:true, cancelable:true});
        e.target = DOM;
        e.originalTarget = DOM;
        e.explicitOriginalTarget = DOM;
        e.altKey= ATTR.altKey || false;
        e.ctrlKey= ATTR.ctrlKey || false;
        e.shiftKey= ATTR.shiftKey || false;
        e.metaKey= ATTR.metaKey || false;
        return DOM.dispatchEvent(e);
    };

    var clickPromise = function (DOM) {
        return new Promise(
            function (resolve, reject) {
                click(DOM, {});
                setTimeout(function(){
                    resolve(DOM);
                }, fuzz());
            }
        );
    };

    function keydown (DOM, KEY, ATTR){
        var e = new Event("keydown", {view:window,bubbles:true,cancelable:false});
        e.key=KEY;    // just enter the char you want to send
        if (e.key.length == 1){
            e.charCode=e.key.charCodeAt(0);
            e.which=e.charCode;
            e.keyCode = 0;
        } else {
            e.charCode = 0;
            e.which = 0;
            e.keyCode = ATTR.keyCode || 0;
        }
        e.target = DOM;
        e.originalTarget = DOM;
        e.explicitOriginalTarget = DOM;
        e.altKey= ATTR.altKey || false;
        e.ctrlKey= ATTR.ctrlKey || false;
        e.shiftKey= ATTR.shiftKey || false;
        e.metaKey= ATTR.metaKey || false;
        return DOM.dispatchEvent(e);
    };

    function keypress (DOM, KEY, ATTR){
        var e = new Event("keypress", {view:window,bubbles:true,cancelable:true});
        e.key=KEY;    // just enter the char you want to send
        if (e.key.length == 1){
            e.charCode=e.key.charCodeAt(0);
            e.which=e.charCode;
            e.keyCode = 0;
        } else {
            e.charCode = 0;
            e.which = 0;
            e.keyCode = ATTR.keyCode || 0;
        }
        e.target = DOM;
        e.originalTarget = DOM;
        e.explicitOriginalTarget = DOM;
        e.altKey= ATTR.altKey || false;
        e.ctrlKey= ATTR.ctrlKey || false;
        e.shiftKey= ATTR.shiftKey || false;
        e.metaKey= ATTR.metaKey || false;
        return DOM.dispatchEvent(e);
    }

    var keydownPromise = function (DOM, KEY, ATTR) {
        return new Promise (
            function (resolve, reject) {
                keydown(DOM, KEY, ATTR);
                setTimeout(function(){
                    resolve(DOM);
                }, fuzz());
            }
        )
    }
    var keypressPromise = function (DOM, KEY, ATTR) {
        return new Promise (
            function (resolve, reject) {
                keypress(DOM, KEY, ATTR);
                setTimeout(function(){
                    resolve(DOM);
                }, fuzz());
            }
        )
    }
    var keydownsPromise = function (DOM, KEYS, ATTR) {
        return new Promise (
            function (resolve, reject) {
                KEYS.split("").map(function(KEY){
                    keydown(DOM, KEY, ATTR);
                });
                setTimeout(function(){
                    resolve(DOM);
                }, fuzz());
            }
        )
    }

    function test (name, func){
        var _test = new Promise(
            function (resolve, reject) {
                func();
                resolve();
            }
        );
        _test.then(function(){
            console.log("Running test: "+name);
        })
    }

    var Assert = (function(){
        function equal(A, B, explanation){
            if (A!==B){
                console.log("Fail: "+explanation)
            }
        }
        return {equal:equal};
    })();

    var LAZU = (function(){
        var Outline = (function(){
            function getOutline (){
                return document.getElementById("list_0").parentElement;
            }
            function getNode (ID){
                return document.getElementById("list_"+ID);
            }
            function getLastNode (){
                return getOutline().lastElementChild;
            }
            function getNodeMenu (NODE){
                return NODE.children[0].children[2];
            }
            function getNodeMenuToggleButton (NODE){
                return getNodeMenu(NODE).children[0].children[0];
            }
            function getNodeMenuNewRowButton (NODE){
                var menuList = getNodeMenu(NODE).children[0].children[1];
                if (menuList === undefined){
                    console.log("ERROR: getNodeMenuRowButton() cannot retrieve button of an unopened menu list.");
                    return null;
                }
                return getNodeMenu(NODE).children[0].children[1].children[0];
            }
            return {
                getOutline:getOutline,
                getNode:getNode,getNodeMenu:getNodeMenu,
                getLastNode:getLastNode,
                getNodeMenuToggleButton:getNodeMenuToggleButton,
                getNodeMenuNewRowButton:getNodeMenuNewRowButton
            };
        })();

        return {Outline:Outline};
    })();

    function testApp (){
        test('test1 - create new rows', 
            function(){
                var Outline = LAZU.Outline;
                var OutlineList = Outline.getOutline();
                var children = OutlineList.children.length;
                var myNode = Outline.getLastNode();
                var newNode1 = null;
                Assert.equal(OutlineList.lastChild, myNode, "Outline.getLastNode() returns proper node."); // Following tests assumes this is true.
                clickPromise(Outline.getNodeMenuToggleButton(myNode)) //// open node menu;
                .then(function(){
                    return clickPromise(Outline.getNodeMenuNewRowButton(myNode)); //// click new Node button
                })
                .then(function(){
                    newNode1 = Outline.getLastNode();
                    Assert.equal(children+1, OutlineList.children.length, "make sure new node is added."); 
                    Assert.equal(myNode.nextSibling, newNode1, "make sure new node is added after element that called created it. Part 1");
                    return myNode;
                })
                .then(function(){
                    return clickPromise(Outline.getNodeMenuToggleButton(myNode)); //// re-open node menu;
                })
                .then(function(){
                    return clickPromise(Outline.getNodeMenuNewRowButton(myNode)); //// click new Node button
                })
                .then(function(){
                    Assert.equal(children+2, OutlineList.children.length, "make sure new node is added. Should have 2 extra children now.");
                    Assert.equal(myNode.nextSibling.nextSibling, newNode1, "make sure new node is added after element that created it. Part 2");
                }).then(function(){
                    return clickPromise(OutlineList.lastChild.children[0].children[1]);
                }).then(function() {
                    return keydownPromise(OutlineList.lastChild.children[0].children[1], 'B', {'altKey':false} );
                }).then(function(canvas){
                    Assert.equal(canvas.innerHTML, "<p>B</p>", "Text input equals 'B'");
                    return keydownsPromise(canvas, 'SABMSBARSNDISN', {'altKey':false} );
                }).then(function(canvas) {
                    Assert.equal(canvas.innerHTML, "<p>BSABMSBARSNDISN</p>", "Text input equals 'BSABMSBARSNDISN'");
                    return keypressPromise(canvas, 'ArrowRight', {'altKey':true, 'keyCode':39} );
                }).then(function(canvas){
                    return canvas
                }).then(function(canvas){
                    Assert.equal(canvas.parentElement.parentElement.parentElement.parentElement, OutlineList.lastChild, "Last node is indented, and is now a child element of its prior previous sibling. Part 1")
                    return keypressPromise(OutlineList.lastChild.children[0].children[1], 'ArrowRight', {'altKey':true, 'keyCode':39} );
                }).then(function(DOM){
                    Assert.equal(DOM.parentElement.parentElement.parentElement.parentElement, OutlineList.lastChild, "Last node is indented, and is now a child element of its prior previous sibling. Part 2");
                    Assert.equal(DOM.parentElement.parentElement.parentElement.parentElement, OutlineList.lastChild, "Last node is indented, and is now a child element of its prior previous sibling.")
                }).catch(function(err){
                    console.log("Error "+err)
                })
            }
        )
    }
    return {testApp:testApp};
})();