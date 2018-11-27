var ooxml = require("./ooxml.js").default;

function Tests () {
    var Test = (function(){
        function serialize(name, A, B){
            var rez = ooxml.Serialize(A)
            if ( rez !== B){
                console.log("Error: "+name+"\nExpected: \n"+B+"\nResult: \n"+rez);
            }
        }

        function inline(name, A, B){
            var rez = ooxml.Serialize( ooxml.Inline.convert(A) )
            if (rez !== B){
                console.log("Error: "+name+"\nExpected: \n"+B+"\nResult: \n"+rez);
            }
        }

        function block(name, A, context, B){
            var rez = ooxml.Serialize( ooxml.Block.convert(A, context )[0] );
            if (rez !== B){
                console.log("Error: "+name+"\nExpected: \n"+B+"\nResult: \n"+rez);
            }
        }

        function container (name, A, context, B){
            var rez = ooxml.Serialize( ooxml.Container.convert(A, context )[0] );
            if (rez != B){
                console.log("Error: "+name+"\nExpected:\n "+B+"\nResult:\n "+rez);
            }
        }

        function range (name, A, context, B){
            var rez = ooxml.Serialize( ooxml.Range.convert(A, context )[0] );
            if (rez != B){
                console.log("Error: "+name+"\nExpected:\n "+B+"\nResult:\n "+rez);
            }
        }

        function document (name, A, B){
            var rez = ooxml.Serialize( ooxml.convert(A).documentXML );
            if (rez != B){
                console.log("Error: "+name+"\nExpected:\n "+B+"\nResult:\n "+rez);
            }
        }

        function print (filename, Deltas){
            ooxml.print(filename, Deltas);
        }

        return {
            serialize:serialize,
            inline:inline,
            block:block,
            range:range,
            container:container,
            document:document,
            print:print
        }
    })();
    ////// FOUNDATIONAL TEST OF SERIALIZE //////
    // All other tests depend on SERIALIZE
    Test.serialize( "test1A - single node", {name:"w:document"} , "<w:document/>");

    Test.serialize( "test1B - single node with attributes",  {name:"w:document",
        attrs:{
            "@xmlns:o":"urn:schemas-microsoft-com:office:office",
            "@xmlns:v":"http://schemas.openxmlformats.org/markup-compatibility/2006"
        }
    } , "<w:document xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"http://schemas.openxmlformats.org/markup-compatibility/2006\"/>");

    Test.serialize( "test1C - single node with children", {name:"w:document",
        children:[
            {name:"w:body"},
            {name:"w:meta"}
        ]
    } , "<w:document><w:body/><w:meta/></w:document>");


    Test.serialize( "test1D - single node with empty children", {name:"w:document",
        attrs:{
            "@xmlns:o":"urn:schemas-microsoft-com:office:office",
            "@xmlns:v":"http://schemas.openxmlformats.org/markup-compatibility/2006"
        },
        children:[ ]
    } , '<w:document xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"http://schemas.openxmlformats.org/markup-compatibility/2006\"/>');

    Test.serialize( "test1E - single node with empty children & attr", {name:"w:document",
    children:[ ]
} , "<w:document/>");

    Test.serialize( "test1F - text node version 1", {name:"w:document",
        children:[
            {"#text":"Hill"},
        ]
    } , "<w:document>Hill</w:document>");

    Test.serialize( "test1E - text node version 2", {name:"w:document",
    children:[
        "Hill",
    ]
} , "<w:document>Hill</w:document>");

    Test.serialize( "test1G - nested node with mixed children and attributes", 
    {
        name:"w:document",
        children:[
            {
                name:"w:body",
                children:[
                    {
                        name:"w:p",
                        attrs:{
                            "@w:rsidR":"00DA60C4",
                            "@w:rsidRDefault":"003A0FC8"
                        }
                    },
                    {name:"w:p"}
                ]
            },
            {name:"w:meta"}
        ],
        attrs:{
            "@xmlns:o":"urn:schemas-microsoft-com:office:office",
            "@xmlns:v":"http://schemas.openxmlformats.org/markup-compatibility/2006"
        }
    } , 
    '<w:document xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"http://schemas.openxmlformats.org/markup-compatibility/2006\"><w:body><w:p w:rsidR="00DA60C4" w:rsidRDefault="003A0FC8"/><w:p/></w:body><w:meta/></w:document>' );

    Test.inline( "test2A - Inline Deltas",
        {"ins":"UnformattedText"},
    "<w:r><w:t>UnformattedText</w:t></w:r>");

    Test.inline( "test2B - Inline Deltas w/ single formatting",    
    {"ins":"UnformattedText",attrs:{"b":true}},
    "<w:r><w:rPr><b/></w:rPr><w:t>UnformattedText</w:t></w:r>");

    Test.inline( "test2C - Inline Deltas w/ multiple formatting",    
    {"ins":"UnformattedText",attrs:{"b":true,"i":true}},
    "<w:r><w:rPr><b/><i/></w:rPr><w:t>UnformattedText</w:t></w:r>");

    Test.block( "test3A - Block Deltas",
    {"ins":"\n"}, {},
    "<w:p/>");

    Test.block( "test3B.1 - Block Deltas with Formatting - align right",
    {"ins":"\n", attrs:{"align":"right"}}, {},
    '<w:p><w:pPr><w:jc w:val="end"/></w:pPr></w:p>' );

    Test.block( "test3B.2 - Block Deltas with Formatting - align left",
    {"ins":"\n", attrs:{"align":"left"}}, {},
    '<w:p><w:pPr><w:jc w:val="start"/></w:pPr></w:p>' );

    Test.block( "test3B.1 - Block Deltas with Formatting - align center",
    {"ins":"\n", attrs:{"align":"center"}}, {},
    '<w:p><w:pPr><w:jc w:val="center"/></w:pPr></w:p>' );

    Test.block( "test3B.1 - Block Deltas with Formatting - align justify",
    {"ins":"\n", attrs:{"align":"justify"}}, {},
    '<w:p><w:pPr><w:jc w:val="distribute"/></w:pPr></w:p>' );

    Test.block( "test3C - Block Deltas in List Range",
    {"ins":"\n"},{"range":"list","list":{"indent":"3","listID":"1"} },
    '<w:p><w:pPr><w:pStyle w:val="listParagraph"/><w:ind w:left="1080" w:hanging="1080"/><w:numPr><w:numId w:val="1"/><w:ilvl w:val="3"/></w:numPr></w:pPr></w:p>' );

    Test.block( "test3D - Block Deltas in List Range with Formatting",
    {"ins":"\n", attrs:{"align":"center"}},{"range":"list","list":{"indent":0,"listID":"1"} },
    '<w:p><w:pPr><w:pStyle w:val="listParagraph"/><w:ind w:left="0" w:hanging="0"/><w:numPr><w:numId w:val="1"/><w:ilvl w:val="0"/></w:numPr><w:jc w:val="center"/></w:pPr></w:p>' );

    Test.block( "test3E - Block Deltas in Table Range",
    {"ins":"\n"},{"range":"tr"},
    '<w:tc><w:p/></w:tc>' );

    Test.block( "test3F - Block Deltas in Table Range with Formatting",
    {"ins":"\n", attrs:{"align":"justify"}},{"range":"tr"},
    '<w:tc><w:p><w:pPr><w:jc w:val="distribute"/></w:pPr></w:p></w:tc>' );

    Test.container("test 4A - Change container from text to list",
    {"ins":"\n", attrs:{"range":"list", "indent":0} },
    {"range":"text"},
    '<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%2."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%3."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="3"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%4."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="4"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%5."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="5"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%6."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="6"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%7."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="7"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%8."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="8"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%9."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="9"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%10."/><w:lvlJc w:val="start"/></w:lvl></w:abstractNum>'
    );

    Test.container("test 4B - Change container from list to text",
    {"ins":"\n", attrs:{"range":"text"} },
    {"range":"list","list":{"indent":"3","listID":"1"} },
    ''
    );

    Test.container("test 4C - Change container from text to table",
    {"ins":"\n", attrs:{"range":"tr"} },
    {"range":"text"},
    '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0"/></w:tblPr><w:tr/></w:tbl>'
    );

    Test.container("test 4C - Change container from table to text",
    {"ins":"\n", attrs:{"range":"text"} },
    {"range":"tr"},
    ''
    );

    Test.container("test 4D - Change container from list to table",
    {"ins":"\n", attrs:{"range":"tr"} },
    {"range":"list","list":{"indent":"3","listID":"1"} },
    '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0"/></w:tblPr><w:tr/></w:tbl>'
    );

    Test.container("test 4E - Change container from table to list",
    {"ins":"\n", attrs:{"range":"list", "indent":0} },
    {"range":"tr"},
    '<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%2."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%3."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="3"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%4."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="4"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%5."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="5"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%6."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="6"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%7."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="7"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%8."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="8"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%9."/><w:lvlJc w:val="start"/></w:lvl><w:lvl w:ilvl="9"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%10."/><w:lvlJc w:val="start"/></w:lvl></w:abstractNum>'
    );

    Test.range("test 5A - text range should return nothing",
    {"ins":"\n", attrs:{"range":"text"}},
    {"range":"text"},
    "");

    Test.range("test 5B - list range should return nothing",
    {"ins":"\n", attrs:{"range":"list"}},
    {"range":"list"},
    "");

    Test.range("test 5C - table range should return a table row",
    {"ins":"\n", attrs:{"range":"tr"}},
    {"range":"tr"},
    '<w:tr/>'
    );

    Test.document("6A",
        [{"ins":"hello"},{"ins":"\n", attrs:{"range":"tr"}}],
    '<w:document xmlns:ve="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"><w:body><w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0"/></w:tblPr><w:tr><w:tr><w:tc><w:p><w:r><w:t>hello</w:t></w:r></w:p></w:tc></w:tr></w:tr></w:tbl></w:body></w:document>'
    )

    Test.document("6B",
    [{"ins":"hello"},{"ins": "World"},{"ins":"\n", attrs:{"range":"text"}}],
    '<w:document xmlns:ve="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"><w:body><w:p><w:r><w:t>hello</w:t></w:r><w:r><w:t>World</w:t></w:r></w:p></w:body></w:document>'
    )

    Test.document("6C",
        [{"ins":"hello"},{"ins":"\n", attrs:{"range":"list","indent":0}}],
        '<w:document xmlns:ve="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"><w:body><w:p><w:pPr><w:pStyle w:val="listParagraph"/><w:ind w:left="360" w:hanging="360"/><w:numPr><w:numId w:val="1"/><w:ilvl w:val="1"/></w:numPr></w:pPr><w:r><w:t>hello</w:t></w:r></w:p></w:body></w:document>'
    )
    /* */
    Test.print(
        "Test Document 7A",
        [
            {'ins':"Hello World. asasldkj alkja sldfjas."},
	        {'ins':"Hello World"},
            {'ins':"\n", attrs:{"range":"list","indent":0}},
            {'ins':"Hello World. asasldkj alkja sldfjas."},
            {'ins':"Hello World"},
            {'ins':"\n", attrs:{"range":"text"}}
        ]
    )
/* */
}

if (exports){
    Tests();
    exports.default = Tests;
} else {
    Tests();
}
