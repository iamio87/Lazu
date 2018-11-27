//// required reading on pattern for converting between JSON and XML. https://www.xml.com/pub/a/2006/05/31/converting-between-xml-and-json.html
//// ?name --> XML declaration

var settings = require("../settings");
var settings = {'MEDIA_ROOT':'/srv/www/lawccessenv/lawccess/project-manager/media'};
var JSZip = require("jszip");
var fs = require("fs");
//var media_directory = settings.MEDIA_ROOT;

//var models = require("../../static/models.json");
var ooxml = (function (){

    var ATTRIBUTE = "attrs";
    var INSERT = "ins";

    function DocObject (){
        return {
            declareXML : {
                name:"?xml",
                attrs: {
                    "@version":"1.0",
                    "@encoding":"UTF-8",
                    "@standalone":"yes"
                }
            },
            documentXML : {
                name:"w:document",
                attrs:{
                    "@xmlns:ve":"http://schemas.openxmlformats.org/markup-compatibility/2006",
                    "@xmlns:o":"urn:schemas-microsoft-com:office:office",
                    "@xmlns:r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                    "@xmlns:m":"http://schemas.openxmlformats.org/officeDocument/2006/math",
                    "@xmlns:v":"urn:schemas-microsoft-com:vml",
                    "@xmlns:wp":"http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                    "@xmlns:w10":"urn:schemas-microsoft-com:office:word",
                    "@xmlns:w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                    "@xmlns:wne":"http://schemas.microsoft.com/office/word/2006/wordml"
                },
                children:[
                    {
                        name:"w:body",
                        attrs:{},
                        children:[
//                            {"name":"w:sectPr","attrs":{},"children":[{"name":"w:pgSz","attrs":{"w:w":"12240","w:h":"15840"},"children":[]},{"name":"w:pgMar","attrs":{"w:top":"1440","w:right":"1440","w:bottom":"1440","w:left":"1440","w:header":"720","w:footer":"720","w:gutter":"0"},"children":[]},{"name":"w:cols","attrs":{"w:space":"720"},"children":[]},{"name":"w:docGrid","attrs":{"w:linePitch":"360"},"children":[]}]}
                        ]
                    }
                ]
            },
            numberingXML : {
                name: "w:numbering",
                attrs:{
                    "@xmlns:ve":"http://schemas.openxmlformats.org/markup-compatibility/2006",
                    "@xmlns:o":"urn:schemas-microsoft-com:office:office",
                    "@xmlns:r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                    "@xmlns:m":"http://schemas.openxmlformats.org/officeDocument/2006/math",
                    "@xmlns:v":"urn:schemas-microsoft-com:vml",
                    "@xmlns:wp":"http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                    "@xmlns:w10":"urn:schemas-microsoft-com:office:word",
                    "@xmlns:w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                    "@xmlns:wne":"http://schemas.microsoft.com/office/word/2006/wordml",
                },
                children:[]
            },
            relsRelsXML : {"name":"Relationships","attrs":{"xmlns":"http://schemas.openxmlformats.org/package/2006/relationships"},"children":[{"name":"Relationship","attrs":{"Id":"rId3","Type":"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties","Target":"docProps/app.xml"},"children":[]},{"name":"Relationship","attrs":{"Id":"rId2","Type":"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties","Target":"docProps/core.xml"},"children":[]},{"name":"Relationship","attrs":{"Id":"rId1","Type":"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument","Target":"word/document.xml"},"children":[]}]},
            docPropsCoreXML : {"name":"cp:coreProperties","attrs":{"xmlns:cp":"http://schemas.openxmlformats.org/package/2006/metadata/core-properties","xmlns:dc":"http://purl.org/dc/elements/1.1/","xmlns:dcterms":"http://purl.org/dc/terms/","xmlns:dcmitype":"http://purl.org/dc/dcmitype/","xmlns:xsi":"http://www.w3.org/2001/XMLSchema-instance"},"children":[]},
            fontTableXML: {"name":"w:fonts","attrs":{"xmlns:r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships","xmlns:w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main"},"children":[{"name":"w:font","attrs":{"w:name":"Calibri"},"children":[{"name":"w:panose1","attrs":{"w:val":"020F0502020204030204"},"children":[]},{"name":"w:charset","attrs":{"w:val":"00"},"children":[]},{"name":"w:family","attrs":{"w:val":"swiss"},"children":[]},{"name":"w:pitch","attrs":{"w:val":"variable"},"children":[]},{"name":"w:sig","attrs":{"w:usb0":"A00002EF","w:usb1":"4000207B","w:usb2":"00000000","w:usb3":"00000000","w:csb0":"0000009F","w:csb1":"00000000"},"children":[]}]},{"name":"w:font","attrs":{"w:name":"Times New Roman"},"children":[{"name":"w:panose1","attrs":{"w:val":"02020603050405020304"},"children":[]},{"name":"w:charset","attrs":{"w:val":"00"},"children":[]},{"name":"w:family","attrs":{"w:val":"roman"},"children":[]},{"name":"w:pitch","attrs":{"w:val":"variable"},"children":[]},{"name":"w:sig","attrs":{"w:usb0":"20002A87","w:usb1":"80000000","w:usb2":"00000008","w:usb3":"00000000","w:csb0":"000001FF","w:csb1":"00000000"},"children":[]}]},{"name":"w:font","attrs":{"w:name":"Cambria"},"children":[{"name":"w:panose1","attrs":{"w:val":"02040503050406030204"},"children":[]},{"name":"w:charset","attrs":{"w:val":"00"},"children":[]},{"name":"w:family","attrs":{"w:val":"roman"},"children":[]},{"name":"w:pitch","attrs":{"w:val":"variable"},"children":[]},{"name":"w:sig","attrs":{"w:usb0":"A00002EF","w:usb1":"4000004B","w:usb2":"00000000","w:usb3":"00000000","w:csb0":"0000009F","w:csb1":"00000000"},"children":[]}]},{"name":"w:font","attrs":{"w:name":"Tahoma"},"children":[{"name":"w:panose1","attrs":{"w:val":"020B0604030504040204"},"children":[]},{"name":"w:charset","attrs":{"w:val":"00"},"children":[]},{"name":"w:family","attrs":{"w:val":"swiss"},"children":[]},{"name":"w:notTrueType","attrs":{},"children":[]},{"name":"w:pitch","attrs":{"w:val":"variable"},"children":[]},{"name":"w:sig","attrs":{"w:usb0":"00000003","w:usb1":"00000000","w:usb2":"00000000","w:usb3":"00000000","w:csb0":"00000001","w:csb1":"00000000"},"children":[]}]}]},
//            docPropsAppXML: {"name":"Properties","attrs":{"xmlns":"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties","xmlns:vt":"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"},"children":[{"name":"Template","attrs":{},"children":["Normal.dotm"]},{"name":"TotalTime","attrs":{},"children":["1542"]},{"name":"Pages","attrs":{},"children":["3"]},{"name":"Words","attrs":{},"children":["65"]},{"name":"Characters","attrs":{},"children":["377"]},{"name":"Application","attrs":{},"children":["Microsoft Office Word"]},{"name":"DocSecurity","attrs":{},"children":["0"]},{"name":"Lines","attrs":{},"children":["3"]},{"name":"Paragraphs","attrs":{},"children":["1"]},{"name":"ScaleCrop","attrs":{},"children":["false"]},{"name":"Company","attrs":{},"children":[]},{"name":"LinksUpToDate","attrs":{},"children":["false"]},{"name":"CharactersWithSpaces","attrs":{},"children":["441"]},{"name":"SharedDoc","attrs":{},"children":["false"]},{"name":"HyperlinksChanged","attrs":{},"children":["false"]},{"name":"AppVersion","attrs":{},"children":["12.0000"]}]},
            docPropsAppXML: {"name":"Properties","attrs":{"xmlns":"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties","xmlns:vt":"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"},"children":[{"name":"Template","attrs":{},"children":["Normal.dotm"]},{"name":"AppVersion","attrs":{},"children":["12.0000"]}]},
            contentTypesXML: {"name":"Types","attrs":{"xmlns":"http://schemas.openxmlformats.org/package/2006/content-types"},"children":[{"name":"Override","attrs":{"PartName":"/customXml/itemProps1.xml","ContentType":"application/vnd.openxmlformats-officedocument.customXmlProperties+xml"},"children":[]},{"name":"Default","attrs":{"Extension":"rels","ContentType":"application/vnd.openxmlformats-package.relationships+xml"},"children":[]},{"name":"Default","attrs":{"Extension":"xml","ContentType":"application/xml"},"children":[]},{"name":"Override","attrs":{"PartName":"/word/document.xml","ContentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"},"children":[]},{"name":"Override","attrs":{"PartName":"/word/styles.xml","ContentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"},"children":[]},{"name":"Override","attrs":{"PartName":"/docProps/app.xml","ContentType":"application/vnd.openxmlformats-officedocument.extended-properties+xml"},"children":[]},{"name":"Override","attrs":{"PartName":"/word/settings.xml","ContentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"},"children":[]},{"name":"Override","attrs":{"PartName":"/word/theme/theme1.xml","ContentType":"application/vnd.openxmlformats-officedocument.theme+xml"},"children":[]},{"name":"Override","attrs":{"PartName":"/word/fontTable.xml","ContentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"},"children":[]},{"name":"Override","attrs":{"PartName":"/word/webSettings.xml","ContentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml"},"children":[]},{"name":"Override","attrs":{"PartName":"/docProps/core.xml","ContentType":"application/vnd.openxmlformats-package.core-properties+xml"},"children":[]},{"name":"Override","attrs":{"PartName":"/word/numbering.xml","ContentType":"application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"},"children":[]}]},
            webSettingsXML: {"name":"w:webSettings","attrs":{"xmlns:r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships","xmlns:w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main"},"children":[{"name":"w:optimizeForBrowser","attrs":{},"children":[]}]},
            documentXMLrels: {"name":"Relationships","attrs":{"xmlns":"http://schemas.openxmlformats.org/package/2006/relationships"},"children":[
                {"name":"Relationship","attrs":{"Id":"rIdfontTable","Type":"http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable","Target":"fontTable.xml"},"children":[]},
                {"name":"Relationship","attrs":{"Id":"rIdsettings","Type":"http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings","Target":"settings.xml"},"children":[]},
                {"name":"Relationship","attrs":{"Id":"rIdstyles","Type":"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles","Target":"styles.xml"},"children":[]},
//bibliography  {"name":"Relationship","attrs":{"Id":"rIdcustom","Type":"http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml","Target":"../customXml/item1.xml"},"children":[]},
                {"name":"Relationship","attrs":{"Id":"rIdwebSettings","Type":"http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings","Target":"webSettings.xml"},"children":[]},
                {"name":"Relationship","attrs":{"Id":"rIdtheme","Type":"http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme","Target":"theme/theme1.xml"},"children":[]},
                {"name":"Relationship","attrs":{"Id":"rIdnumbering","Type":"http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering","Target":"numbering.xml"},"children":[]}
            ]},
            settingsXML: {"name":"w:settings","attrs":{"xmlns:o":"urn:schemas-microsoft-com:office:office","xmlns:r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships","xmlns:m":"http://schemas.openxmlformats.org/officeDocument/2006/math","xmlns:v":"urn:schemas-microsoft-com:vml","xmlns:w10":"urn:schemas-microsoft-com:office:word","xmlns:w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main","xmlns:sl":"http://schemas.openxmlformats.org/schemaLibrary/2006/main"},"children":[{"name":"w:zoom","attrs":{"w:percent":"100"},"children":[]},{"name":"w:proofState","attrs":{"w:spelling":"clean","w:grammar":"clean"},"children":[]},{"name":"w:defaultTabStop","attrs":{"w:val":"720"},"children":[]},{"name":"w:characterSpacingControl","attrs":{"w:val":"doNotCompress"},"children":[]},{"name":"w:compat","attrs":{},"children":[]},{"name":"w:rsids","attrs":{},"children":[{"name":"w:rsidRoot","attrs":{"w:val":"005A6474"},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00007D5A"},"children":[]},{"name":"w:rsid","attrs":{"w:val":"0025703E"},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00363EB2"},"children":[]},{"name":"w:rsid","attrs":{"w:val":"005A6474"},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00662E28"},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00AB5F27"},"children":[]}]},{"name":"m:mathPr","attrs":{},"children":[{"name":"m:mathFont","attrs":{"m:val":"Cambria Math"},"children":[]},{"name":"m:brkBin","attrs":{"m:val":"before"},"children":[]},{"name":"m:brkBinSub","attrs":{"m:val":"--"},"children":[]},{"name":"m:smallFrac","attrs":{"m:val":"off"},"children":[]},{"name":"m:dispDef","attrs":{},"children":[]},{"name":"m:lMargin","attrs":{"m:val":"0"},"children":[]},{"name":"m:rMargin","attrs":{"m:val":"0"},"children":[]},{"name":"m:defJc","attrs":{"m:val":"centerGroup"},"children":[]},{"name":"m:wrapIndent","attrs":{"m:val":"1440"},"children":[]},{"name":"m:intLim","attrs":{"m:val":"subSup"},"children":[]},{"name":"m:naryLim","attrs":{"m:val":"undOvr"},"children":[]}]},{"name":"w:themeFontLang","attrs":{"w:val":"en-US"},"children":[]},{"name":"w:clrSchemeMapping","attrs":{"w:bg1":"light1","w:t1":"dark1","w:bg2":"light2","w:t2":"dark2","w:accent1":"accent1","w:accent2":"accent2","w:accent3":"accent3","w:accent4":"accent4","w:accent5":"accent5","w:accent6":"accent6","w:hyperlink":"hyperlink","w:followedHyperlink":"followedHyperlink"},"children":[]},{"name":"w:shapeDefaults","attrs":{},"children":[{"name":"o:shapedefaults","attrs":{"v:ext":"edit","spidmax":"2050"},"children":[]},{"name":"o:shapelayout","attrs":{"v:ext":"edit"},"children":[{"name":"o:idmap","attrs":{"v:ext":"edit","data":"1"},"children":[]}]}]},{"name":"w:decimalSymbol","attrs":{"w:val":"."},"children":[]},{"name":"w:listSeparator","attrs":{"w:val":","},"children":[]}]},
            stylesXML: {"name":"w:styles","attrs":{"xmlns:r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships","xmlns:w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main"},
                "children":[{"name":"w:docDefaults","attrs":{},"children":[{"name":"w:rPrDefault","attrs":{},"children":[{"name":"w:rPr","attrs":{},"children":[{"name":"w:rFonts","attrs":{"w:asciiTheme":"minorHAnsi","w:eastAsiaTheme":"minorHAnsi","w:hAnsiTheme":"minorHAnsi","w:cstheme":"minorBidi"},"children":[]},{"name":"w:sz","attrs":{"w:val":"22"},"children":[]},{"name":"w:szCs","attrs":{"w:val":"22"},"children":[]},{"name":"w:lang","attrs":{"w:val":"en-US","w:eastAsia":"en-US","w:bidi":"ar-SA"},"children":[]}]}]},{"name":"w:pPrDefault","attrs":{},"children":[{"name":"w:pPr","attrs":{},"children":[{"name":"w:spacing","attrs":{"w:after":"200","w:line":"276","w:lineRule":"auto"},"children":[]}]}]}]},{"name":"w:latentStyles","attrs":{"w:defLockedState":"0","w:defUIPriority":"99","w:defSemiHidden":"1","w:defUnhideWhenUsed":"1","w:defQFormat":"0","w:count":"267"},"children":[{"name":"w:lsdException","attrs":{"w:name":"Normal","w:semiHidden":"0","w:uiPriority":"0","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"heading 1","w:semiHidden":"0","w:uiPriority":"9","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"heading 2","w:uiPriority":"9","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"heading 3","w:uiPriority":"9","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"heading 4","w:uiPriority":"9","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"heading 5","w:uiPriority":"9","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"heading 6","w:uiPriority":"9","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"heading 7","w:uiPriority":"9","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"heading 8","w:uiPriority":"9","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"heading 9","w:uiPriority":"9","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"toc 1","w:uiPriority":"39"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"toc 2","w:uiPriority":"39"},"children":[]},
                {"name":"w:lsdException","attrs":{"w:name":"toc 3","w:uiPriority":"39"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"toc 4","w:uiPriority":"39"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"toc 5","w:uiPriority":"39"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"toc 6","w:uiPriority":"39"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"toc 7","w:uiPriority":"39"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"toc 8","w:uiPriority":"39"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"toc 9","w:uiPriority":"39"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"caption","w:uiPriority":"35","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Title","w:semiHidden":"0","w:uiPriority":"10","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Default Paragraph Font","w:uiPriority":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Subtitle","w:semiHidden":"0","w:uiPriority":"11","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Strong","w:semiHidden":"0","w:uiPriority":"22","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Emphasis","w:semiHidden":"0","w:uiPriority":"20","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Table Grid","w:semiHidden":"0","w:uiPriority":"59","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Placeholder Text","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"No Spacing","w:semiHidden":"0","w:uiPriority":"1","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Shading","w:semiHidden":"0","w:uiPriority":"60","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light List","w:semiHidden":"0","w:uiPriority":"61","w:unhideWhenUsed":"0"},"children":[]},
                {"name":"w:lsdException","attrs":{"w:name":"Light Grid","w:semiHidden":"0","w:uiPriority":"62","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 1","w:semiHidden":"0","w:uiPriority":"63","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 2","w:semiHidden":"0","w:uiPriority":"64","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 1","w:semiHidden":"0","w:uiPriority":"65","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 2","w:semiHidden":"0","w:uiPriority":"66","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 1","w:semiHidden":"0","w:uiPriority":"67","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 2","w:semiHidden":"0","w:uiPriority":"68","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 3","w:semiHidden":"0","w:uiPriority":"69","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Dark List","w:semiHidden":"0","w:uiPriority":"70","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Shading","w:semiHidden":"0","w:uiPriority":"71","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful List","w:semiHidden":"0","w:uiPriority":"72","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Grid","w:semiHidden":"0","w:uiPriority":"73","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Shading Accent 1","w:semiHidden":"0","w:uiPriority":"60","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light List Accent 1","w:semiHidden":"0","w:uiPriority":"61","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Grid Accent 1","w:semiHidden":"0","w:uiPriority":"62","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 1 Accent 1","w:semiHidden":"0","w:uiPriority":"63","w:unhideWhenUsed":"0"},"children":[]},
                {"name":"w:lsdException","attrs":{"w:name":"Medium Shading 2 Accent 1","w:semiHidden":"0","w:uiPriority":"64","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 1 Accent 1","w:semiHidden":"0","w:uiPriority":"65","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Revision","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"List Paragraph","w:semiHidden":"0","w:uiPriority":"34","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Quote","w:semiHidden":"0","w:uiPriority":"29","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Intense Quote","w:semiHidden":"0","w:uiPriority":"30","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 2 Accent 1","w:semiHidden":"0","w:uiPriority":"66","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 1 Accent 1","w:semiHidden":"0","w:uiPriority":"67","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 2 Accent 1","w:semiHidden":"0","w:uiPriority":"68","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 3 Accent 1","w:semiHidden":"0","w:uiPriority":"69","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Dark List Accent 1","w:semiHidden":"0","w:uiPriority":"70","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Shading Accent 1","w:semiHidden":"0","w:uiPriority":"71","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful List Accent 1","w:semiHidden":"0","w:uiPriority":"72","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Grid Accent 1","w:semiHidden":"0","w:uiPriority":"73","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Shading Accent 2","w:semiHidden":"0","w:uiPriority":"60","w:unhideWhenUsed":"0"},"children":[]},
                {"name":"w:lsdException","attrs":{"w:name":"Light List Accent 2","w:semiHidden":"0","w:uiPriority":"61","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Grid Accent 2","w:semiHidden":"0","w:uiPriority":"62","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 1 Accent 2","w:semiHidden":"0","w:uiPriority":"63","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 2 Accent 2","w:semiHidden":"0","w:uiPriority":"64","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 1 Accent 2","w:semiHidden":"0","w:uiPriority":"65","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 2 Accent 2","w:semiHidden":"0","w:uiPriority":"66","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 1 Accent 2","w:semiHidden":"0","w:uiPriority":"67","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 2 Accent 2","w:semiHidden":"0","w:uiPriority":"68","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 3 Accent 2","w:semiHidden":"0","w:uiPriority":"69","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Dark List Accent 2","w:semiHidden":"0","w:uiPriority":"70","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Shading Accent 2","w:semiHidden":"0","w:uiPriority":"71","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful List Accent 2","w:semiHidden":"0","w:uiPriority":"72","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Grid Accent 2","w:semiHidden":"0","w:uiPriority":"73","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Shading Accent 3","w:semiHidden":"0","w:uiPriority":"60","w:unhideWhenUsed":"0"},"children":[]},
                {"name":"w:lsdException","attrs":{"w:name":"Light List Accent 3","w:semiHidden":"0","w:uiPriority":"61","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Grid Accent 3","w:semiHidden":"0","w:uiPriority":"62","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 1 Accent 3","w:semiHidden":"0","w:uiPriority":"63","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 2 Accent 3","w:semiHidden":"0","w:uiPriority":"64","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 1 Accent 3","w:semiHidden":"0","w:uiPriority":"65","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 2 Accent 3","w:semiHidden":"0","w:uiPriority":"66","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 1 Accent 3","w:semiHidden":"0","w:uiPriority":"67","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 2 Accent 3","w:semiHidden":"0","w:uiPriority":"68","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 3 Accent 3","w:semiHidden":"0","w:uiPriority":"69","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Dark List Accent 3","w:semiHidden":"0","w:uiPriority":"70","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Shading Accent 3","w:semiHidden":"0","w:uiPriority":"71","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful List Accent 3","w:semiHidden":"0","w:uiPriority":"72","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Grid Accent 3","w:semiHidden":"0","w:uiPriority":"73","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Shading Accent 4","w:semiHidden":"0","w:uiPriority":"60","w:unhideWhenUsed":"0"},"children":[]},
                {"name":"w:lsdException","attrs":{"w:name":"Light List Accent 4","w:semiHidden":"0","w:uiPriority":"61","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Grid Accent 4","w:semiHidden":"0","w:uiPriority":"62","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 1 Accent 4","w:semiHidden":"0","w:uiPriority":"63","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 2 Accent 4","w:semiHidden":"0","w:uiPriority":"64","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 1 Accent 4","w:semiHidden":"0","w:uiPriority":"65","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 2 Accent 4","w:semiHidden":"0","w:uiPriority":"66","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 1 Accent 4","w:semiHidden":"0","w:uiPriority":"67","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 2 Accent 4","w:semiHidden":"0","w:uiPriority":"68","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 3 Accent 4","w:semiHidden":"0","w:uiPriority":"69","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Dark List Accent 4","w:semiHidden":"0","w:uiPriority":"70","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Shading Accent 4","w:semiHidden":"0","w:uiPriority":"71","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful List Accent 4","w:semiHidden":"0","w:uiPriority":"72","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Grid Accent 4","w:semiHidden":"0","w:uiPriority":"73","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Shading Accent 5","w:semiHidden":"0","w:uiPriority":"60","w:unhideWhenUsed":"0"},"children":[]},
                {"name":"w:lsdException","attrs":{"w:name":"Light List Accent 5","w:semiHidden":"0","w:uiPriority":"61","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Grid Accent 5","w:semiHidden":"0","w:uiPriority":"62","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 1 Accent 5","w:semiHidden":"0","w:uiPriority":"63","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 2 Accent 5","w:semiHidden":"0","w:uiPriority":"64","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 1 Accent 5","w:semiHidden":"0","w:uiPriority":"65","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 2 Accent 5","w:semiHidden":"0","w:uiPriority":"66","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 1 Accent 5","w:semiHidden":"0","w:uiPriority":"67","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 2 Accent 5","w:semiHidden":"0","w:uiPriority":"68","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 3 Accent 5","w:semiHidden":"0","w:uiPriority":"69","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Dark List Accent 5","w:semiHidden":"0","w:uiPriority":"70","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Shading Accent 5","w:semiHidden":"0","w:uiPriority":"71","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful List Accent 5","w:semiHidden":"0","w:uiPriority":"72","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Grid Accent 5","w:semiHidden":"0","w:uiPriority":"73","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Shading Accent 6","w:semiHidden":"0","w:uiPriority":"60","w:unhideWhenUsed":"0"},"children":[]},
                {"name":"w:lsdException","attrs":{"w:name":"Light List Accent 6","w:semiHidden":"0","w:uiPriority":"61","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Light Grid Accent 6","w:semiHidden":"0","w:uiPriority":"62","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 1 Accent 6","w:semiHidden":"0","w:uiPriority":"63","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Shading 2 Accent 6","w:semiHidden":"0","w:uiPriority":"64","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 1 Accent 6","w:semiHidden":"0","w:uiPriority":"65","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium List 2 Accent 6","w:semiHidden":"0","w:uiPriority":"66","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 1 Accent 6","w:semiHidden":"0","w:uiPriority":"67","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 2 Accent 6","w:semiHidden":"0","w:uiPriority":"68","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Medium Grid 3 Accent 6","w:semiHidden":"0","w:uiPriority":"69","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Dark List Accent 6","w:semiHidden":"0","w:uiPriority":"70","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Shading Accent 6","w:semiHidden":"0","w:uiPriority":"71","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful List Accent 6","w:semiHidden":"0","w:uiPriority":"72","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Colorful Grid Accent 6","w:semiHidden":"0","w:uiPriority":"73","w:unhideWhenUsed":"0"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Subtle Emphasis","w:semiHidden":"0","w:uiPriority":"19","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},
                {"name":"w:lsdException","attrs":{"w:name":"Intense Emphasis","w:semiHidden":"0","w:uiPriority":"21","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Subtle Reference","w:semiHidden":"0","w:uiPriority":"31","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Intense Reference","w:semiHidden":"0","w:uiPriority":"32","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Book Title","w:semiHidden":"0","w:uiPriority":"33","w:unhideWhenUsed":"0","w:qFormat":"1"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"Bibliography","w:uiPriority":"37"},"children":[]},{"name":"w:lsdException","attrs":{"w:name":"TOC Heading","w:uiPriority":"39","w:qFormat":"1"},"children":[]}]},{"name":"w:style","attrs":{"w:type":"paragraph","w:default":"1","w:styleId":"Normal"},"children":[{"name":"w:name","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:qFormat","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"0025703E"},"children":[]}]},{"name":"w:style","attrs":{"w:type":"paragraph","w:styleId":"Heading1"},"children":[{"name":"w:name","attrs":{"w:val":"heading 1"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:next","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:link","attrs":{"w:val":"Heading1Char"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"9"},"children":[]},{"name":"w:qFormat","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"005A6474"},"children":[]},{"name":"w:pPr","attrs":{},"children":[{"name":"w:keepNext","attrs":{},"children":[]},{"name":"w:keepLines","attrs":{},"children":[]},{"name":"w:spacing","attrs":{"w:before":"480","w:after":"0"},"children":[]},{"name":"w:outlineLvl","attrs":{"w:val":"0"},"children":[]}]},{"name":"w:rPr","attrs":{},"children":[{"name":"w:rFonts","attrs":{"w:asciiTheme":"majorHAnsi","w:eastAsiaTheme":"majorEastAsia","w:hAnsiTheme":"majorHAnsi","w:cstheme":"majorBidi"},"children":[]},
                {"name":"w:b","attrs":{},"children":[]},{"name":"w:bCs","attrs":{},"children":[]},{"name":"w:color","attrs":{"w:val":"365F91","w:themeColor":"accent1","w:themeShade":"BF"},"children":[]},{"name":"w:sz","attrs":{"w:val":"28"},"children":[]},{"name":"w:szCs","attrs":{"w:val":"28"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"paragraph","w:styleId":"Heading2"},"children":[{"name":"w:name","attrs":{"w:val":"heading 2"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:next","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:link","attrs":{"w:val":"Heading2Char"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"9"},"children":[]},{"name":"w:unhideWhenUsed","attrs":{},"children":[]},{"name":"w:qFormat","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"005A6474"},"children":[]},{"name":"w:pPr","attrs":{},"children":[{"name":"w:keepNext","attrs":{},"children":[]},{"name":"w:keepLines","attrs":{},"children":[]},{"name":"w:spacing","attrs":{"w:before":"200","w:after":"0"},"children":[]},{"name":"w:outlineLvl","attrs":{"w:val":"1"},"children":[]}]},{"name":"w:rPr","attrs":{},"children":[{"name":"w:rFonts","attrs":{"w:asciiTheme":"majorHAnsi","w:eastAsiaTheme":"majorEastAsia","w:hAnsiTheme":"majorHAnsi","w:cstheme":"majorBidi"},"children":[]},{"name":"w:b","attrs":{},"children":[]},{"name":"w:bCs","attrs":{},"children":[]},{"name":"w:color","attrs":{"w:val":"4F81BD","w:themeColor":"accent1"},"children":[]},{"name":"w:sz","attrs":{"w:val":"26"},"children":[]},{"name":"w:szCs","attrs":{"w:val":"26"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"paragraph","w:styleId":"Heading3"},"children":[{"name":"w:name","attrs":{"w:val":"heading 3"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:next","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:link","attrs":{"w:val":"Heading3Char"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"9"},"children":[]},
                {"name":"w:unhideWhenUsed","attrs":{},"children":[]},{"name":"w:qFormat","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"005A6474"},"children":[]},{"name":"w:pPr","attrs":{},"children":[{"name":"w:keepNext","attrs":{},"children":[]},{"name":"w:keepLines","attrs":{},"children":[]},{"name":"w:spacing","attrs":{"w:before":"200","w:after":"0"},"children":[]},{"name":"w:outlineLvl","attrs":{"w:val":"2"},"children":[]}]},{"name":"w:rPr","attrs":{},"children":[{"name":"w:rFonts","attrs":{"w:asciiTheme":"majorHAnsi","w:eastAsiaTheme":"majorEastAsia","w:hAnsiTheme":"majorHAnsi","w:cstheme":"majorBidi"},"children":[]},{"name":"w:b","attrs":{},"children":[]},{"name":"w:bCs","attrs":{},"children":[]},{"name":"w:color","attrs":{"w:val":"4F81BD","w:themeColor":"accent1"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"character","w:default":"1","w:styleId":"DefaultParagraphFont"},"children":[{"name":"w:name","attrs":{"w:val":"Default Paragraph Font"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"1"},"children":[]},{"name":"w:semiHidden","attrs":{},"children":[]},{"name":"w:unhideWhenUsed","attrs":{},"children":[]}]},{"name":"w:style","attrs":{"w:type":"table","w:default":"1","w:styleId":"TableNormal"},"children":[{"name":"w:name","attrs":{"w:val":"Normal Table"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"99"},"children":[]},{"name":"w:semiHidden","attrs":{},"children":[]},{"name":"w:unhideWhenUsed","attrs":{},"children":[]},{"name":"w:qFormat","attrs":{},"children":[]},{"name":"w:tblPr","attrs":{},"children":[{"name":"w:tblInd","attrs":{"w:w":"0","w:type":"dxa"},"children":[]},{"name":"w:tblCellMar","attrs":{},"children":[{"name":"w:top","attrs":{"w:w":"0","w:type":"dxa"},"children":[]},{"name":"w:left","attrs":{"w:w":"108","w:type":"dxa"},"children":[]},{"name":"w:bottom","attrs":{"w:w":"0","w:type":"dxa"},"children":[]},{"name":"w:right","attrs":{"w:w":"108","w:type":"dxa"},"children":[]}]}]}]},
                {"name":"w:style","attrs":{"w:type":"numbering","w:default":"1","w:styleId":"NoList"},"children":[{"name":"w:name","attrs":{"w:val":"No List"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"99"},"children":[]},{"name":"w:semiHidden","attrs":{},"children":[]},{"name":"w:unhideWhenUsed","attrs":{},"children":[]}]},{"name":"w:style","attrs":{"w:type":"character","w:customStyle":"1","w:styleId":"Heading1Char"},"children":[{"name":"w:name","attrs":{"w:val":"Heading 1 Char"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"DefaultParagraphFont"},"children":[]},{"name":"w:link","attrs":{"w:val":"Heading1"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"9"},"children":[]},{"name":"w:rsid","attrs":{"w:val":"005A6474"},"children":[]},{"name":"w:rPr","attrs":{},"children":[{"name":"w:rFonts","attrs":{"w:asciiTheme":"majorHAnsi","w:eastAsiaTheme":"majorEastAsia","w:hAnsiTheme":"majorHAnsi","w:cstheme":"majorBidi"},"children":[]},{"name":"w:b","attrs":{},"children":[]},{"name":"w:bCs","attrs":{},"children":[]},{"name":"w:color","attrs":{"w:val":"365F91","w:themeColor":"accent1","w:themeShade":"BF"},"children":[]},{"name":"w:sz","attrs":{"w:val":"28"},"children":[]},{"name":"w:szCs","attrs":{"w:val":"28"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"character","w:customStyle":"1","w:styleId":"Heading2Char"},"children":[{"name":"w:name","attrs":{"w:val":"Heading 2 Char"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"DefaultParagraphFont"},"children":[]},{"name":"w:link","attrs":{"w:val":"Heading2"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"9"},"children":[]},{"name":"w:rsid","attrs":{"w:val":"005A6474"},"children":[]},{"name":"w:rPr","attrs":{},"children":[{"name":"w:rFonts","attrs":{"w:asciiTheme":"majorHAnsi","w:eastAsiaTheme":"majorEastAsia","w:hAnsiTheme":"majorHAnsi","w:cstheme":"majorBidi"},"children":[]},{"name":"w:b","attrs":{},"children":[]},{"name":"w:bCs","attrs":{},"children":[]},
                {"name":"w:color","attrs":{"w:val":"4F81BD","w:themeColor":"accent1"},"children":[]},{"name":"w:sz","attrs":{"w:val":"26"},"children":[]},{"name":"w:szCs","attrs":{"w:val":"26"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"character","w:customStyle":"1","w:styleId":"Heading3Char"},"children":[{"name":"w:name","attrs":{"w:val":"Heading 3 Char"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"DefaultParagraphFont"},"children":[]},{"name":"w:link","attrs":{"w:val":"Heading3"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"9"},"children":[]},{"name":"w:rsid","attrs":{"w:val":"005A6474"},"children":[]},{"name":"w:rPr","attrs":{},"children":[{"name":"w:rFonts","attrs":{"w:asciiTheme":"majorHAnsi","w:eastAsiaTheme":"majorEastAsia","w:hAnsiTheme":"majorHAnsi","w:cstheme":"majorBidi"},"children":[]},{"name":"w:b","attrs":{},"children":[]},{"name":"w:bCs","attrs":{},"children":[]},{"name":"w:color","attrs":{"w:val":"4F81BD","w:themeColor":"accent1"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"character","w:styleId":"Hyperlink"},"children":[{"name":"w:name","attrs":{"w:val":"Hyperlink"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"DefaultParagraphFont"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"99"},"children":[]},{"name":"w:unhideWhenUsed","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00AB5F27"},"children":[]},{"name":"w:rPr","attrs":{},"children":[{"name":"w:color","attrs":{"w:val":"0000FF","w:themeColor":"hyperlink"},"children":[]},{"name":"w:u","attrs":{"w:val":"single"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"paragraph","w:styleId":"TOCHeading"},"children":[{"name":"w:name","attrs":{"w:val":"TOC Heading"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"Heading1"},"children":[]},{"name":"w:next","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"39"},"children":[]},{"name":"w:semiHidden","attrs":{},"children":[]},
                {"name":"w:unhideWhenUsed","attrs":{},"children":[]},{"name":"w:qFormat","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00662E28"},"children":[]},{"name":"w:pPr","attrs":{},"children":[{"name":"w:outlineLvl","attrs":{"w:val":"9"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"paragraph","w:styleId":"TOC1"},"children":[{"name":"w:name","attrs":{"w:val":"toc 1"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:next","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:autoRedefine","attrs":{},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"39"},"children":[]},{"name":"w:unhideWhenUsed","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00662E28"},"children":[]},{"name":"w:pPr","attrs":{},"children":[{"name":"w:spacing","attrs":{"w:after":"100"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"paragraph","w:styleId":"TOC2"},"children":[{"name":"w:name","attrs":{"w:val":"toc 2"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:next","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:autoRedefine","attrs":{},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"39"},"children":[]},{"name":"w:unhideWhenUsed","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00662E28"},"children":[]},{"name":"w:pPr","attrs":{},"children":[{"name":"w:spacing","attrs":{"w:after":"100"},"children":[]},{"name":"w:ind","attrs":{"w:left":"220"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"paragraph","w:styleId":"TOC3"},"children":[{"name":"w:name","attrs":{"w:val":"toc 3"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:next","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:autoRedefine","attrs":{},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"39"},"children":[]},{"name":"w:unhideWhenUsed","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00662E28"},"children":[]},
                {"name":"w:pPr","attrs":{},"children":[{"name":"w:spacing","attrs":{"w:after":"100"},"children":[]},{"name":"w:ind","attrs":{"w:left":"440"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"paragraph","w:styleId":"BalloonText"},"children":[{"name":"w:name","attrs":{"w:val":"Balloon Text"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"Normal"},"children":[]},{"name":"w:link","attrs":{"w:val":"BalloonTextChar"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"99"},"children":[]},{"name":"w:semiHidden","attrs":{},"children":[]},{"name":"w:unhideWhenUsed","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00662E28"},"children":[]},{"name":"w:pPr","attrs":{},"children":[{"name":"w:spacing","attrs":{"w:after":"0","w:line":"240","w:lineRule":"auto"},"children":[]}]},{"name":"w:rPr","attrs":{},"children":[{"name":"w:rFonts","attrs":{"w:ascii":"Tahoma","w:hAnsi":"Tahoma","w:cs":"Tahoma"},"children":[]},{"name":"w:sz","attrs":{"w:val":"16"},"children":[]},{"name":"w:szCs","attrs":{"w:val":"16"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"character","w:customStyle":"1","w:styleId":"BalloonTextChar"},"children":[{"name":"w:name","attrs":{"w:val":"Balloon Text Char"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"DefaultParagraphFont"},"children":[]},{"name":"w:link","attrs":{"w:val":"BalloonText"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"99"},"children":[]},{"name":"w:semiHidden","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00662E28"},"children":[]},{"name":"w:rPr","attrs":{},"children":[{"name":"w:rFonts","attrs":{"w:ascii":"Tahoma","w:hAnsi":"Tahoma","w:cs":"Tahoma"},"children":[]},{"name":"w:sz","attrs":{"w:val":"16"},"children":[]},{"name":"w:szCs","attrs":{"w:val":"16"},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"paragraph","w:styleId":"ListParagraph"},"children":[{"name":"w:name","attrs":{"w:val":"List Paragraph"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"Normal"},"children":[]},
                {"name":"w:uiPriority","attrs":{"w:val":"34"},"children":[]},{"name":"w:qFormat","attrs":{},"children":[]},{"name":"w:rsid","attrs":{"w:val":"00986D94"},"children":[]},{"name":"w:pPr","attrs":{},"children":[{"name":"w:ind","attrs":{"w:left":"720"},"children":[]},{"name":"w:contextualSpacing","attrs":{},"children":[]}]}]},{"name":"w:style","attrs":{"w:type":"table","w:styleId":"TableGrid"},"children":[{"name":"w:name","attrs":{"w:val":"Table Grid"},"children":[]},{"name":"w:basedOn","attrs":{"w:val":"TableNormal"},"children":[]},{"name":"w:uiPriority","attrs":{"w:val":"59"},"children":[]},{"name":"w:rsid","attrs":{"w:val":"008111B1"},"children":[]},{"name":"w:pPr","attrs":{},"children":[{"name":"w:spacing","attrs":{"w:after":"0","w:line":"240","w:lineRule":"auto"},"children":[]}]},{"name":"w:tblPr","attrs":{},"children":[{"name":"w:tblInd","attrs":{"w:w":"0","w:type":"dxa"},"children":[]},{"name":"w:tblBorders","attrs":{},"children":[{"name":"w:top","attrs":{"w:val":"single","w:sz":"4","w:space":"0","w:color":"000000","w:themeColor":"text1"},"children":[]},{"name":"w:left","attrs":{"w:val":"single","w:sz":"4","w:space":"0","w:color":"000000","w:themeColor":"text1"},"children":[]},{"name":"w:bottom","attrs":{"w:val":"single","w:sz":"4","w:space":"0","w:color":"000000","w:themeColor":"text1"},"children":[]},{"name":"w:right","attrs":{"w:val":"single","w:sz":"4","w:space":"0","w:color":"000000","w:themeColor":"text1"},"children":[]},{"name":"w:insideH","attrs":{"w:val":"single","w:sz":"4","w:space":"0","w:color":"000000","w:themeColor":"text1"},"children":[]},{"name":"w:insideV","attrs":{"w:val":"single","w:sz":"4","w:space":"0","w:color":"000000","w:themeColor":"text1"},"children":[]}]},{"name":"w:tblCellMar","attrs":{},"children":[{"name":"w:top","attrs":{"w:w":"0","w:type":"dxa"},"children":[]},{"name":"w:left","attrs":{"w:w":"108","w:type":"dxa"},"children":[]},{"name":"w:bottom","attrs":{"w:w":"0","w:type":"dxa"},"children":[]},{"name":"w:right","attrs":{"w:w":"108","w:type":"dxa"},"children":[]}]}]}]}]
            },
            themeXML: {"name":"a:theme","attrs":{"xmlns:a":"http://schemas.openxmlformats.org/drawingml/2006/main","name":"Office Theme"},"children":[{"name":"a:themeElements","attrs":{},"children":[{"name":"a:clrScheme","attrs":{"name":"Office"},"children":[{"name":"a:dk1","attrs":{},"children":[{"name":"a:sysClr","attrs":{"val":"windowText","lastClr":"000000"},"children":[]}]},{"name":"a:lt1","attrs":{},"children":[{"name":"a:sysClr","attrs":{"val":"window","lastClr":"FFFFFF"},"children":[]}]},{"name":"a:dk2","attrs":{},"children":[{"name":"a:srgbClr","attrs":{"val":"1F497D"},"children":[]}]},{"name":"a:lt2","attrs":{},"children":[{"name":"a:srgbClr","attrs":{"val":"EEECE1"},"children":[]}]},{"name":"a:accent1","attrs":{},"children":[{"name":"a:srgbClr","attrs":{"val":"4F81BD"},"children":[]}]},{"name":"a:accent2","attrs":{},"children":[{"name":"a:srgbClr","attrs":{"val":"C0504D"},"children":[]}]},{"name":"a:accent3","attrs":{},"children":[{"name":"a:srgbClr","attrs":{"val":"9BBB59"},"children":[]}]},{"name":"a:accent4","attrs":{},"children":[{"name":"a:srgbClr","attrs":{"val":"8064A2"},"children":[]}]},{"name":"a:accent5","attrs":{},"children":[{"name":"a:srgbClr","attrs":{"val":"4BACC6"},"children":[]}]},{"name":"a:accent6","attrs":{},"children":[{"name":"a:srgbClr","attrs":{"val":"F79646"},"children":[]}]},{"name":"a:hlink","attrs":{},"children":[{"name":"a:srgbClr","attrs":{"val":"0000FF"},"children":[]}]},{"name":"a:folHlink","attrs":{},"children":[{"name":"a:srgbClr","attrs":{"val":"800080"},"children":[]}]}]},{"name":"a:fontScheme","attrs":{"name":"Office"},"children":[{"name":"a:majorFont","attrs":{},"children":[{"name":"a:latin","attrs":{"typeface":"Cambria"},"children":[]},{"name":"a:ea","attrs":{"typeface":""},"children":[]},{"name":"a:cs","attrs":{"typeface":""},"children":[]},{"name":"a:font","attrs":{"script":"Jpan","typeface":"ＭＳ ゴシック"},"children":[]},{"name":"a:font","attrs":{"script":"Hang","typeface":"맑은 고딕"},"children":[]},{"name":"a:font","attrs":{"script":"Hans","typeface":"宋体"},"children":[]},
                {"name":"a:font","attrs":{"script":"Hant","typeface":"新細明體"},"children":[]},{"name":"a:font","attrs":{"script":"Arab","typeface":"Times New Roman"},"children":[]},{"name":"a:font","attrs":{"script":"Hebr","typeface":"Times New Roman"},"children":[]},{"name":"a:font","attrs":{"script":"Thai","typeface":"Angsana New"},"children":[]},{"name":"a:font","attrs":{"script":"Ethi","typeface":"Nyala"},"children":[]},{"name":"a:font","attrs":{"script":"Beng","typeface":"Vrinda"},"children":[]},{"name":"a:font","attrs":{"script":"Gujr","typeface":"Shruti"},"children":[]},{"name":"a:font","attrs":{"script":"Khmr","typeface":"MoolBoran"},"children":[]},{"name":"a:font","attrs":{"script":"Knda","typeface":"Tunga"},"children":[]},{"name":"a:font","attrs":{"script":"Guru","typeface":"Raavi"},"children":[]},{"name":"a:font","attrs":{"script":"Cans","typeface":"Euphemia"},"children":[]},{"name":"a:font","attrs":{"script":"Cher","typeface":"Plantagenet Cherokee"},"children":[]},{"name":"a:font","attrs":{"script":"Yiii","typeface":"Microsoft Yi Baiti"},"children":[]},{"name":"a:font","attrs":{"script":"Tibt","typeface":"Microsoft Himalaya"},"children":[]},{"name":"a:font","attrs":{"script":"Thaa","typeface":"MV Boli"},"children":[]},{"name":"a:font","attrs":{"script":"Deva","typeface":"Mangal"},"children":[]},{"name":"a:font","attrs":{"script":"Telu","typeface":"Gautami"},"children":[]},{"name":"a:font","attrs":{"script":"Taml","typeface":"Latha"},"children":[]},{"name":"a:font","attrs":{"script":"Syrc","typeface":"Estrangelo Edessa"},"children":[]},{"name":"a:font","attrs":{"script":"Orya","typeface":"Kalinga"},"children":[]},{"name":"a:font","attrs":{"script":"Mlym","typeface":"Kartika"},"children":[]},{"name":"a:font","attrs":{"script":"Laoo","typeface":"DokChampa"},"children":[]},{"name":"a:font","attrs":{"script":"Sinh","typeface":"Iskoola Pota"},"children":[]},{"name":"a:font","attrs":{"script":"Mong","typeface":"Mongolian Baiti"},"children":[]},{"name":"a:font","attrs":{"script":"Viet","typeface":"Times New Roman"},"children":[]},
                {"name":"a:font","attrs":{"script":"Uigh","typeface":"Microsoft Uighur"},"children":[]}]},{"name":"a:minorFont","attrs":{},"children":[{"name":"a:latin","attrs":{"typeface":"Calibri"},"children":[]},{"name":"a:ea","attrs":{"typeface":""},"children":[]},{"name":"a:cs","attrs":{"typeface":""},"children":[]},{"name":"a:font","attrs":{"script":"Jpan","typeface":"ＭＳ 明朝"},"children":[]},{"name":"a:font","attrs":{"script":"Hang","typeface":"맑은 고딕"},"children":[]},{"name":"a:font","attrs":{"script":"Hans","typeface":"宋体"},"children":[]},{"name":"a:font","attrs":{"script":"Hant","typeface":"新細明體"},"children":[]},{"name":"a:font","attrs":{"script":"Arab","typeface":"Arial"},"children":[]},{"name":"a:font","attrs":{"script":"Hebr","typeface":"Arial"},"children":[]},{"name":"a:font","attrs":{"script":"Thai","typeface":"Cordia New"},"children":[]},{"name":"a:font","attrs":{"script":"Ethi","typeface":"Nyala"},"children":[]},{"name":"a:font","attrs":{"script":"Beng","typeface":"Vrinda"},"children":[]},{"name":"a:font","attrs":{"script":"Gujr","typeface":"Shruti"},"children":[]},{"name":"a:font","attrs":{"script":"Khmr","typeface":"DaunPenh"},"children":[]},{"name":"a:font","attrs":{"script":"Knda","typeface":"Tunga"},"children":[]},{"name":"a:font","attrs":{"script":"Guru","typeface":"Raavi"},"children":[]},{"name":"a:font","attrs":{"script":"Cans","typeface":"Euphemia"},"children":[]},{"name":"a:font","attrs":{"script":"Cher","typeface":"Plantagenet Cherokee"},"children":[]},{"name":"a:font","attrs":{"script":"Yiii","typeface":"Microsoft Yi Baiti"},"children":[]},{"name":"a:font","attrs":{"script":"Tibt","typeface":"Microsoft Himalaya"},"children":[]},{"name":"a:font","attrs":{"script":"Thaa","typeface":"MV Boli"},"children":[]},{"name":"a:font","attrs":{"script":"Deva","typeface":"Mangal"},"children":[]},{"name":"a:font","attrs":{"script":"Telu","typeface":"Gautami"},"children":[]},{"name":"a:font","attrs":{"script":"Taml","typeface":"Latha"},"children":[]},{"name":"a:font","attrs":{"script":"Syrc","typeface":"Estrangelo Edessa"},"children":[]},
                {"name":"a:font","attrs":{"script":"Orya","typeface":"Kalinga"},"children":[]},{"name":"a:font","attrs":{"script":"Mlym","typeface":"Kartika"},"children":[]},{"name":"a:font","attrs":{"script":"Laoo","typeface":"DokChampa"},"children":[]},{"name":"a:font","attrs":{"script":"Sinh","typeface":"Iskoola Pota"},"children":[]},{"name":"a:font","attrs":{"script":"Mong","typeface":"Mongolian Baiti"},"children":[]},{"name":"a:font","attrs":{"script":"Viet","typeface":"Arial"},"children":[]},{"name":"a:font","attrs":{"script":"Uigh","typeface":"Microsoft Uighur"},"children":[]}]}]},{"name":"a:fmtScheme","attrs":{"name":"Office"},"children":[{"name":"a:fillStyleLst","attrs":{},"children":[{"name":"a:solidFill","attrs":{},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[]}]},{"name":"a:gradFill","attrs":{"rotWithShape":"1"},"children":[{"name":"a:gsLst","attrs":{},"children":[{"name":"a:gs","attrs":{"pos":"0"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:tint","attrs":{"val":"50000"},"children":[]},{"name":"a:satMod","attrs":{"val":"300000"},"children":[]}]}]},{"name":"a:gs","attrs":{"pos":"35000"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:tint","attrs":{"val":"37000"},"children":[]},{"name":"a:satMod","attrs":{"val":"300000"},"children":[]}]}]},{"name":"a:gs","attrs":{"pos":"100000"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:tint","attrs":{"val":"15000"},"children":[]},{"name":"a:satMod","attrs":{"val":"350000"},"children":[]}]}]}]},{"name":"a:lin","attrs":{"ang":"16200000","scaled":"1"},"children":[]}]},{"name":"a:gradFill","attrs":{"rotWithShape":"1"},"children":[{"name":"a:gsLst","attrs":{},"children":[{"name":"a:gs","attrs":{"pos":"0"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:shade","attrs":{"val":"51000"},"children":[]},{"name":"a:satMod","attrs":{"val":"130000"},"children":[]}]}]},
                {"name":"a:gs","attrs":{"pos":"80000"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:shade","attrs":{"val":"93000"},"children":[]},{"name":"a:satMod","attrs":{"val":"130000"},"children":[]}]}]},{"name":"a:gs","attrs":{"pos":"100000"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:shade","attrs":{"val":"94000"},"children":[]},{"name":"a:satMod","attrs":{"val":"135000"},"children":[]}]}]}]},{"name":"a:lin","attrs":{"ang":"16200000","scaled":"0"},"children":[]}]}]},{"name":"a:lnStyleLst","attrs":{},"children":[{"name":"a:ln","attrs":{"w":"9525","cap":"flat","cmpd":"sng","algn":"ctr"},"children":[{"name":"a:solidFill","attrs":{},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:shade","attrs":{"val":"95000"},"children":[]},{"name":"a:satMod","attrs":{"val":"105000"},"children":[]}]}]},{"name":"a:prstDash","attrs":{"val":"solid"},"children":[]}]},{"name":"a:ln","attrs":{"w":"25400","cap":"flat","cmpd":"sng","algn":"ctr"},"children":[{"name":"a:solidFill","attrs":{},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[]}]},{"name":"a:prstDash","attrs":{"val":"solid"},"children":[]}]},{"name":"a:ln","attrs":{"w":"38100","cap":"flat","cmpd":"sng","algn":"ctr"},"children":[{"name":"a:solidFill","attrs":{},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[]}]},{"name":"a:prstDash","attrs":{"val":"solid"},"children":[]}]}]},{"name":"a:effectStyleLst","attrs":{},"children":[{"name":"a:effectStyle","attrs":{},"children":[{"name":"a:effectLst","attrs":{},"children":[{"name":"a:outerShdw","attrs":{"blurRad":"40000","dist":"20000","dir":"5400000","rotWithShape":"0"},"children":[{"name":"a:srgbClr","attrs":{"val":"000000"},"children":[{"name":"a:alpha","attrs":{"val":"38000"},"children":[]}]}]}]}]},{"name":"a:effectStyle","attrs":{},"children":[{"name":"a:effectLst","attrs":{},"children":[{"name":"a:outerShdw","attrs":{"blurRad":"40000","dist":"23000","dir":"5400000","rotWithShape":"0"},"children":[
                {"name":"a:srgbClr","attrs":{"val":"000000"},"children":[{"name":"a:alpha","attrs":{"val":"35000"},"children":[]}]}]}]}]},{"name":"a:effectStyle","attrs":{},"children":[{"name":"a:effectLst","attrs":{},"children":[{"name":"a:outerShdw","attrs":{"blurRad":"40000","dist":"23000","dir":"5400000","rotWithShape":"0"},"children":[{"name":"a:srgbClr","attrs":{"val":"000000"},"children":[{"name":"a:alpha","attrs":{"val":"35000"},"children":[]}]}]}]},{"name":"a:scene3d","attrs":{},"children":[{"name":"a:camera","attrs":{"prst":"orthographicFront"},"children":[{"name":"a:rot","attrs":{"lat":"0","lon":"0","rev":"0"},"children":[]}]},{"name":"a:lightRig","attrs":{"rig":"threePt","dir":"t"},"children":[{"name":"a:rot","attrs":{"lat":"0","lon":"0","rev":"1200000"},"children":[]}]}]},{"name":"a:sp3d","attrs":{},"children":[{"name":"a:bevelT","attrs":{"w":"63500","h":"25400"},"children":[]}]}]}]},{"name":"a:bgFillStyleLst","attrs":{},"children":[{"name":"a:solidFill","attrs":{},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[]}]},{"name":"a:gradFill","attrs":{"rotWithShape":"1"},"children":[{"name":"a:gsLst","attrs":{},"children":[{"name":"a:gs","attrs":{"pos":"0"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:tint","attrs":{"val":"40000"},"children":[]},{"name":"a:satMod","attrs":{"val":"350000"},"children":[]}]}]},{"name":"a:gs","attrs":{"pos":"40000"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:tint","attrs":{"val":"45000"},"children":[]},{"name":"a:shade","attrs":{"val":"99000"},"children":[]},{"name":"a:satMod","attrs":{"val":"350000"},"children":[]}]}]},{"name":"a:gs","attrs":{"pos":"100000"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:shade","attrs":{"val":"20000"},"children":[]},{"name":"a:satMod","attrs":{"val":"255000"},"children":[]}]}]}]},{"name":"a:path","attrs":{"path":"circle"},"children":[{"name":"a:fillToRect","attrs":{"l":"50000","t":"-80000","r":"50000","b":"180000"},"children":[]}]}]},
                {"name":"a:gradFill","attrs":{"rotWithShape":"1"},"children":[{"name":"a:gsLst","attrs":{},"children":[{"name":"a:gs","attrs":{"pos":"0"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:tint","attrs":{"val":"80000"},"children":[]},{"name":"a:satMod","attrs":{"val":"300000"},"children":[]}]}]},{"name":"a:gs","attrs":{"pos":"100000"},"children":[{"name":"a:schemeClr","attrs":{"val":"phClr"},"children":[{"name":"a:shade","attrs":{"val":"30000"},"children":[]},{"name":"a:satMod","attrs":{"val":"200000"},"children":[]}]}]}]},{"name":"a:path","attrs":{"path":"circle"},"children":[{"name":"a:fillToRect","attrs":{"l":"50000","t":"50000","r":"50000","b":"50000"},"children":[]}]}]}]}]}]},{"name":"a:objectDefaults","attrs":{},"children":[]},{"name":"a:extraClrSchemeLst","attrs":{},"children":[]}]
            },
        }
    }

    var Container = (function(){

        var Table = (function(){
            const mapping = {
                "margin-left":"w:indent",
                "float":"w:jc",
                "caption":"w:tblCaption",
            }

            function newTable(delta, ScopeObj){
                var childArray = [];
                var ret = {
                    name:"w:tbl",
                    children:[
                        {
                            name: "w:tblPr",
                            children:[
                                {
                                    name:"w:tblStyle",
                                    attrs: {
                                        "@w:val":"TableGrid"
                                    }
                                },
                                {
                                    name:"w:tblW",
                                    attrs:{
                                        "@w:w":"0",
                                        "@w:type":"auto"
                                    }
                                },
                                {
                                    name: "w:tblLook",
                                    attrs:{
                                        "@w:val":"04A0"
                                    }
                                }
                            ]
                        },
                        {
                            name:"w:tr",
                            children:childArray
                        }
                    ]
                }
                ////// NOTE: WE ARE NOT BOTHERING WITH w:tblGrid
/*                Object.keys(delta[ATTRIBUTE]).reduce(function(acc, key){
                    if (mapping.hasOwnProperty(key)){
                        var JSONnode = {}
                        var ooxmlKey = mapping[key];
                        var ooxmlvalue = delta[ATTRIBUTE][key]; //// 
                        JSONnode[ooxmlKey] = ooxmlvalue;
                        acc.push(JSONnode)
                    }
                })*/
                return [ret, childArray];
            }

            return {
                newTable:newTable,
            }
        })();

        var List = (function(){
            const mapping = {
                "1.":["decimal","%","."],
                "(1)":["decimal","(%",")"],
                "1)":["decimal","%",")"],
                "a.":["lowerLetter","%","."],
                "(a)":["lowerLetter","(%",")"],
                "a)":["lowerLetter","%",")"],
                "A.":["upperLetter","%","."],
                "(A)":["upperLetter","(%",")"],
                "A)":["upperLetter","%",")"],
                "i.":["lowerRoman","%","."],
                "(i)":["lowerRoman","(%",")"],
                "i)":["lowerRoman","%",")"],
                "I.":["upperRoman","%","."],
                "(I)":["upperRoman","(%",")"],
                "I)":["upperRoman","%",")"],
                "greek.":["lowerRoman","%","."],
                "(greek)":["lowerRoman","(%",")"],
                "greek)":["lowerRoman","%",")"],
                "01.":["decimalZero","%","."],
                "one.":["cardinalText","%","."],
                "first":["ordinalText","(%",")"],
                "1st":["ordinal","%",")"],
                "bullet":["bullet",""]
            }
        
            function getEnumStyle(code, indent){
                var parts = mapping[code];
                if (parts.length == 3){ //// ordered enumeration
                    indent++;
                    return [parts[0], parts[1]+indent+parts[2]];
                } else { //// unordered bullets
                    return [parts[0], parts[1]]; 
                }
            }
        
            const tabLength = 360;
        
            function listLevel (attr, indent) {
                var enumStyle = getEnumStyle(attr[indent]["enum"], indent);
                if ( attr["expand-enum"] && (indent > 0) ) { //// for nest
                    attr[indent]["lvlText"] = attr[indent-1]["lvlText"] + enumStyle[1];
                } else {
                    attr[indent]["lvlText"] = enumStyle[1];
                }
                var ret = {
                    name: "w:lvl",
                    attrs: {"@w:ilvl":indent},
                    children:[
                        {
                            name: "w:start",
                            attrs:{
                                "@w:val":1
                            }
                        },
                        {
                            name:"w:numFmt",
                            attrs:{
                                "@w:val":enumStyle[0]
                            }
                        },
                        {
                            name:"w:lvlText",
                            attrs:{
                                "@w:val":enumStyle[1]
                            }
                        },
                        {
                            name:"w:lvlJc",
                                //// justify numbering. Can be "start" (left), "end" (right), "center", "both", and "distribute" (justify)
                                //// we are using "start" for now
                            attrs:{
                                "@w:val":"start"
                            }
                        }
                    ]
                }
                return ret;
            }
        
            function newList(listDelta, ScopeObj){
                if (!ScopeObj.hasOwnProperty("listNumber")){
                    ScopeObj["listNumber"] = 0;
                }
                ScopeObj["listNumber"] ++; //// counter for abstractNum which identifies lists
                ScopeObj["activeList"] = {
                    indentLength: tabLength
                }
                var ret = {
                    name: "w:abstractNum",
                    attrs:{
                        "@w:abstractNumId": ScopeObj["listNumber"]
                    },
                    children:[
                        {
                            name: "w:multiLevelType",
                            attrs:{
                                "@w:val":"hybridMultilevel"
                            }
                        }
                    ]
                }
                var levelAttr = {}; // Outside of loop scope --> Some indent levels look to higher indent levels for their formatting.
                for (var i = 0; i < 9; i++ ){ ///// set Formatting for each Indent level (0-8) [lvl 9 throws error]
                    levelAttr[i] = (listDelta[ATTRIBUTE]["lvl"+i] || {}); //// get formatting from delta attribute.
                    levelAttr[i]["enum"] = (levelAttr[i]["enum"] || "1."); 
                    levelAttr[i]["expand-enum"] = (levelAttr[i]["expand-enum"] || false); 
                    ret.children.push( listLevel ( levelAttr, i ) );
                }
                return [ret, []];
            }
            return {
                newList:newList
            };
        })();

        function convert (Delta, ScopeObj){
            var range = Delta[ATTRIBUTE]["range"];
            if (range === "list"){
                return List.newList(Delta, ScopeObj);
            } else if (range === "tr") {
                return Table.newTable(Delta, ScopeObj);
            } else {
                return [null, []];
            }
        }

        return {convert:convert}

    })();

    var Range = (function(){
    ///// In Delta.js, there is no difference b/t Range and Container. However, OOXML treats Tables differently from Lists.
    ///// To deal with this extra logic, we have an intermediate.

        var Table = (function(){
            function newRow (Delta, ScopeObj) {
                var childArray = [];
                var ret = {
                    name: "w:tr",
                    children:childArray
                }
                return [ret, childArray];
            }
            return {newRow:newRow}
        })()

        function convert(Delta, ScopeObj){
            if (Delta[ATTRIBUTE]["range"] === "tr") {
                return Table.newRow(Delta, ScopeObj);
            } else if (Delta[ATTRIBUTE]["range"] === "list") {
                ScopeObj["list"] = {
                    'indent':( (Delta[ATTRIBUTE]["indent"] || 0) + 1 ),
                    'listID': ScopeObj["listNumber"]
                };
                return [null, []]
            } else if (Delta[ATTRIBUTE]["range"] === "text") {
                return [null, []];
            }
        }
        return {
            convert:convert
        }
    })();

    var Block = (function(){

        var tabLength = 360;
        var tblCellProp = { }

        var mapping = {
            "align":"w:jc", //// justification
        }

        var valueMapping = {
            "align":{
                "left":"start",
                "right":"end",
                "center":"center",
                "justify":"distribute" //// could be "both", but "distribute" better matches CSS property. (http://officeopenxml.com/WPalignment.php)
            }
        }

        function blockNode (delta, ScopeObj){ //// TODO: factor out List and Table Cell code.
            var childArray = [];
            var ret = {
                name:"w:p",
                children:childArray
            }
            if (ScopeObj.range === "list"){
                var indentLen = ( ScopeObj["list"]["indent"] * tabLength ); //// set indent length for block - which was set by Container.List.newList()
                var properties = {
                    name:"w:pPr",
                    children:[
                        {
                            name: "w:pStyle",
                            attrs:{
                                "@w:val":"listParagraph"
                            }
                        },
                        {
                            name:"w:ind",
                            attrs:{
                                "@w:left":indentLen, //// indent of first line
                                "@w:hanging":indentLen, //// indent of lines after first line.
                            }
                        },
                        {
                            name:"w:numPr",
                            children:[
                                {
                                    name:"w:numId",
                                    attrs:{
                                        "@w:val":ScopeObj["list"]["listID"]
                                    }
                                },
                                {
                                    name:"w:ilvl",
                                    attrs:{
                                        "@w:val":ScopeObj["list"]["indent"]
                                    }
                                }
                            ]
                        }
                    ]
                }
            } else {
                var properties = {
                    name:"w:pPr",
                    children:[]
                }
            }
            if (delta.hasOwnProperty(ATTRIBUTE)) {
                var keys = Object.keys(delta[ATTRIBUTE]).filter(function(key){
                    if (mapping.hasOwnProperty(key)) {
                        return key;
                    }
                });
                keys.reduce(function(acc, key){
                    var value = delta[ATTRIBUTE][key];
                    var ooxmlKey = mapping[key];
                    if (value === true) { /// simple binary attribute.
                        acc.push({name:ooxmlKey});
                    } else { //// non-binary attribute
                        acc.push({
                            name:ooxmlKey, 
                            attrs:{
                                "w:val":valueMapping[key][value]
                            }
                        });
                    }
                    return acc;
                }, properties["children"])
            }

            if (properties["children"].length > 0){
                childArray.push(properties);
            }

            if (ScopeObj.range === "tr"){
                ret = {
                    name:"w:tc",
                    children:[
                        ret
                    ]
                }
            }
            return [ret, childArray];
        }

        function convert (delta, ScopeObj){
            var node, childArray
            [node, childArray] = blockNode(delta, ScopeObj);
            if (ScopeObj.target){
                ScopeObj.target.splice(0,0, node)
            }
            return [node, childArray];
        }
        return {convert:convert}
    })();

    var Inline = (function(){
        const mapping = {
            "b":"w:b",
            "i":"w:i",
            "u":"w:u",
            "em":"w:i",
            "strike":"w:strike",
            "del":"w:del",
            "mark":"w:mark"
        }
        
        function inlineNode (delta) {
            var ret = {
                name: "w:r",
                children:[
                    {
                        name:"w:t",
                        children:[
                            {"#text":delta[INSERT]}
                        ]
                    }
                ]
            };
            if ( delta.hasOwnProperty(ATTRIBUTE) ) {
                var keys = Object.keys(delta[ATTRIBUTE]).filter(function(key){
                    if (mapping.hasOwnProperty(key)){
                        return key
                    }
                });
                if (keys.length > 0) {
                    var properties = keys.reduce(function(acc, key){
                        var JSONnode = {name:key};
                        acc.push(JSONnode);
                        return acc;
                    }, []);
                    var propertiesNode = {
                        name:"w:rPr",
                        children:properties
                    }
                    ret["children"].splice(0, 0, propertiesNode);
                }
            } 
            return ret;
        }

        function convert (delta, target){
            var node = inlineNode(delta);
            return node;
        }
        return {convert:convert}
    })();

    function Embed (Delta, DocObject, ScopeObj){
        function convert (){

        }
        return {
            convert:convert
        }
    }

    function convert (Deltas){
        //// Initial Integrity Check
        var checkLastDelta = Deltas.slice(-1)[0];
        if ( ! checkLastDelta.hasOwnProperty(ATTRIBUTE) ){
            checkLastDelta[ATTRIBUTE] = {};
        }
        if (!checkLastDelta[ATTRIBUTE].hasOwnProperty("range") ) {
            checkLastDelta[ATTRIBUTE]["range"] = "text";
        }

        //// elements are represented by arrays [topNode, childArray].
        //// use topNode to attach to a parent. It is an object.
        //// use childArray to attach children. It is an array.

        var scopeObj = {"range":"text", "heading":1};
        var doc = DocObject();
        var docXML = doc.documentXML.children[0].children;
        var activeContainer = [null, []]; //// corresponds to <TABLE> and <numberingXML>s
        var activeRange = [null, []]; /// corresponds to <TR> and Indent level
        var activeBlock = [null, []]; /// [blocknode, pointer for array for block's child elements]

        //// Property elements must always be first child --> set splice index if property element exists.
        var DocumentOffset = docXML.length; //// appends deltas to existing document.
        var ContainerPropertiesOffset = 0;
        var RangePropertiesOffset = 0 ;
        var BlockPropertiesOffset = 0;

        Deltas.reverse().map(function(DELTA){
            if (DELTA[INSERT] === "\n"){

                if ( DELTA[ATTRIBUTE].hasOwnProperty("range") ) {

                    if ( scopeObj["range"] !== DELTA[ATTRIBUTE]["range"] ) { //// only call Container() if we are changing range type.
                        /////////////// CONTAINER ///////////////////
                        scopeObj["range"] = DELTA[ATTRIBUTE]["range"];
                        activeContainer = Container.convert(DELTA, scopeObj);
                        ContainerPropertiesOffset = activeContainer[1].length;
                        if (scopeObj["range"] === "list") { 
                            doc.numberingXML.children.push(activeContainer[0]);
                        } else if (scopeObj["range"] === "tr") {
                            docXML.splice(DocumentOffset, 0, activeContainer[0]); //// add <w:tbl> to doc.
                        } else {

                        }
                    }

                    /////////////// RANGE ///////////////////
                    if (scopeObj["range"] === "tr"){ //// add <w:tr> to <w:tbl>
                        activeRange = Range.convert(DELTA, scopeObj);
                        RangePropertiesOffset = activeRange[1].length;
                        activeContainer[1].splice(ContainerPropertiesOffset, 0, activeRange[0]);
                    } else {
                        activeRange[1] = docXML;
                        RangePropertiesOffset = ContainerPropertiesOffset;
                        if (scopeObj["range"] === "list" ) {
                            Range.convert(DELTA, scopeObj); //// adjust ScopeObj values for indent level
                        }
                    }
                }

                /////////////// BLOCK ////////////////////
                activeBlock = Block.convert(DELTA, scopeObj);
                BlockPropertiesOffset = activeBlock[1].length;
                activeRange[1].splice(RangePropertiesOffset,0, activeBlock[0]);

            } else if (typeof(DELTA[INSERT]) === "string"){
                activeBlock[1].splice(BlockPropertiesOffset, 0, Inline.convert(DELTA, scopeObj) );
            } else {
                activeBlock[1].splice(BlockPropertiesOffset, 0, Embed.convert(DELTA, scopeObj) );
            }
        });
        return doc;
    }

    var Serialize = (function(){
        function attributes (Attr){
            if (Attr){
                return Object.keys(Attr).reduce(function(acc, key){
                    return acc + " " + key.replace("@","") + "=" + '"' + Attr[key] + '"';
                }, "");
            } else {
                return "";
            }
        }
        function singleton (Node) {
            return "<" + Node.name + attributes(Node.attrs) + "/>";
        }
        function open (Node) {
            return "<" + Node.name + attributes(Node.attrs) + ">";
        }
        function close (Node){
            return "</" + Node.name + ">";
        }
        function children (childArray){
            return childArray.reduce(function(acc, childNode){
                return acc + JSONtoXMLstring(childNode);
            },"");
        }

        function JSONtoXMLstring(JSON) {
            if (JSON === null){ /// catch errors
                return "";
            } else if (JSON === undefined){
                console.log(JSON);
                return "";
            } else if (typeof(JSON) === "string"){
                return JSON;
            }
            if (JSON.hasOwnProperty("#text")){
                return JSON["#text"];
            } else if (JSON.hasOwnProperty('children') && JSON.children.length ){
                return open(JSON) + children(JSON.children) + close(JSON);
            } else {
                return singleton(JSON);
            }
        }

        return JSONtoXMLstring;
    })();

    var Print = function (filename, Deltas){
        var doc = convert(Deltas);
        function print(JSON){
            return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+"\n"+Serialize(JSON) ;
        }
        var zip = new JSZip();
        zip.file('[Content_Types].xml', print( doc.contentTypesXML ) );
        zip.file('_rels/.rels', print( doc.relsRelsXML ));
        zip.file('docProps/app.xml', print(doc.docPropsAppXML));
        zip.file('docProps/core.xml', print(doc.docPropsCoreXML));
        zip.file('word/fontTable.xml', print(doc.fontTableXML));
        zip.file('word/settings.xml', print(doc.settingsXML));
        zip.file('word/styles.xml', print(doc.stylesXML));
        zip.file('word/theme/theme1.xml', print(doc.themeXML));
        zip.file('word/webSettings.xml', print(doc.webSettingsXML));
        zip.file('word/_rels/document.xml.rels', print(doc.documentXMLrels));
        zip.file('word/document.xml', print(doc.documentXML));
        zip.file('word/numbering.xml', print(doc.numberingXML));

        zip
        .generateNodeStream({type:'nodebuffer',streamFiles:true})
        .pipe(fs.createWriteStream(filename+'.docx'))
        .on('finish', function () {
            // JSZip generates a readable stream with a "end" event,
            // but is piped here in a writable stream which emits a "finish" event.
            console.log(filename+'.docx written.');
        });
        /*container = zipfile.ZipFile(documentPath, 'w')
        container.write(contentTypesXML, "[Content_Types].xml")
        container.write(rootRelXML, "_rels/.rels")
        container.write(appPropertiesXML, "docProps/app.xml")
        container.write(corePropertiesXML, "docProps/core.xml")
        container.write(customXMLRels, "customXml/_rels/item1.xml.rels")
        container.write(customXMLItem1, "customXml/item1.xml")
        container.write(customXMLItemProps1, "customXml/itemProps1.xml")
        container.write(fontTableXML, "word/fontTable.xml")
        container.write(settingsXML, "word/settings.xml")
        container.write(stylesXML, "word/styles.xml")
        container.write(themeXML, "word/theme/theme1.xml")
        container.write(webSettingsXML, "word/webSettings.xml")
        container.write(documentRelationshipsXML, "word/_rels/document.xml.rels")
        
        container.write(docXML, "word/document.xml")*/

    }

    return {
        Container:Container,
        Range:Range,
        Block:Block,
        Embed:Embed,
        Inline:Inline,
        Serialize:Serialize,
        convert:convert,
        print:Print
    }
})();

exports.default = ooxml;
/*


def ooxml(request, key):
#    from sendfile import sendfile
    from docprint.ooxml.markup import markup_to_ooxml
    from lawccess.models import Project, Outline, OutlineElement, Source, Citation
    import os
    from django.conf import settings
    from lawccess.serialize import Serializer
    import zipfile
    directory = os.path.join(settings.MEDIA_ROOT, request.user.username) ## Working directory for temporary files
    _template_dir = "docprint/ooxml/file_templates"
    project = Project.objects.get(pk=key)
    outline = project.outline#s.get()
    outline.order = outline.order.split(",")
    outline.title = project.title
    sources = Source.objects.filter(project_id=1, deleted=False)
    citations = []
    for source in sources:
        citations.extend(source.citations.all().filter(deleted=False))
    dictSources = Serializer().dict_serialize(sources, dict)
    dictCitations = Serializer().dict_serialize(citations, dict)
    string = ""
    def build(order, level):
        string = ""
        for element_id in order:
            element = OutlineElement.objects.get(pk=element_id)
            string = "%s##h%s##%s##/h%s##" % (string, level, element.heading, level)
            if element.content != "":
                elementstring = "##p##%s##/p##" % element.content
                elementstring = elementstring.replace('##p####p##','##p##')
                elementstring = elementstring.replace('##/p####/p##','##/p##')
                string = string+elementstring
            if element.order !="":
                string = string+build(element.order.split(','), level+1)
        return string
    string = build(outline.order, 1)
    docXMLHead = open(os.path.join(_template_dir, "document_head.xml"),'r')
    docXMLFoot = open(os.path.join(_template_dir, "document_foot.xml"),'r')
    string = "%s%s%s" % (docXMLHead.read(), string, docXMLFoot.read())
    documentPath = "%s/%s.docx" % (directory, project.title)
    documentURL = "%s/%s/%s.docx" % (settings.MEDIA_URL, request.user.username, project.title)
    markup_to_ooxml(string, directory, dictCitations, dictSources, project)
    docXML = "%s/%s" % (directory, "word/document.xml")
    orderingXML = "%s/%s" % (directory, "word/numbering.xml")
    customXMLItem1 = "%s/%s" % (directory, "customXml/item1.xml")

    ####### These files are filler ########

    contentTypesXML = "%s/%s" % (_template_dir, "[Content_Types].xml")
    rootRelXML = "%s/%s" % (_template_dir, "_rels/.rels")
    appPropertiesXML = "%s/%s" % (_template_dir, "docProps/app.xml")
    corePropertiesXML = "%s/%s" % (_template_dir, "docProps/core.xml")
    customXMLRels = "%s/%s" % (_template_dir, "customXml/_rels/item1.xml.rels")
    customXMLItemProps1 = "%s/%s" % (_template_dir, "customXml/itemProps1.xml")
    fontTableXML = "%s/%s" % (_template_dir, "word/fontTable.xml")
    settingsXML = "%s/%s" % (_template_dir, "word/settings.xml")
    stylesXML = "%s/%s" % (_template_dir, "word/styles.xml")
    themeXML = "%s/%s" % (_template_dir, "word/theme/theme1.xml")
    webSettingsXML = "%s/%s" % (_template_dir, "word/webSettings.xml")
    documentRelationshipsXML = "%s/%s" % (_template_dir, "word/_rels/document.xml.rels")
    
    container = zipfile.ZipFile(documentPath, 'w')
    container.write(contentTypesXML, "[Content_Types].xml")
    container.write(rootRelXML, "_rels/.rels")
    container.write(appPropertiesXML, "docProps/app.xml")
    container.write(corePropertiesXML, "docProps/core.xml")
    container.write(customXMLRels, "customXml/_rels/item1.xml.rels")
    container.write(customXMLItem1, "customXml/item1.xml")
    container.write(customXMLItemProps1, "customXml/itemProps1.xml")
    container.write(fontTableXML, "word/fontTable.xml")
    container.write(settingsXML, "word/settings.xml")
    container.write(stylesXML, "word/styles.xml")
    container.write(themeXML, "word/theme/theme1.xml")
    container.write(webSettingsXML, "word/webSettings.xml")
    container.write(documentRelationshipsXML, "word/_rels/document.xml.rels")
    
    container.write(docXML, "word/document.xml")
    if os.path.exists(orderingXML):
        container.write(orderingXML, "word/numbering.xml")
        os.remove(orderingXML)
    os.remove(docXML)
    return HttpResponseRedirect(documentURL)

def ooxml(username, data):
    string = os.path.dirname(__file__)
    string1 = "%s%s" % (string,"/ooxml/file_templates/document_head.xml")
    string2 = "%s%s" % (string,"/ooxml/file_templates/document_foot.xml")
    documenthead = open(string1,"r")
    documentfoot = open(string2,"r")
    directory = os.path.join(media_directory, username,"tmp")
    if not os.path.exists(directory):
        os.makedirs(directory)
    from docprint.ooxml.markup import markup_to_ooxml
    markup_to_ooxml(data, directory)
        
    return string, documenthead.read(), documentfoot.read()



class ListConverter:
	def __init__(self, text, directory):
		self.listCount = 0
		self.indentCount = -1
		self.directory = directory
		self.numberingPath = os.path.join(self.directory, "numbering.xml")
		self.text = text
		self.numbering = "1."
		self.orderedList = True
		self.endLists = 0
		self.newList = 1
		self.newListWithStyle = 2
		self.continueLists = 3
		self.flag = self.continueLists
		self.lastReplacement = ""
		self.numberingXML = ["""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:ve="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml">"""]
		self.numberElement = [] #### MS Word will not catch <w:num> elements unless they are the last elements in <w:numbering>.


	def buildDefaultStyle(self):
		def _ordered_numbering():
			return """<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="%2."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val="%3."/><w:lvlJc w:val="right"/><w:pPr><w:ind w:left="2160" w:hanging="180"/></w:pPr></w:lvl><w:lvl w:ilvl="3"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%4."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="2880" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="4" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="%5."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="3600" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="5" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val="%6."/><w:lvlJc w:val="right"/><w:pPr><w:ind w:left="4320" w:hanging="180"/></w:pPr></w:lvl><w:lvl w:ilvl="6" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%7."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="5040" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="7" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="%8."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="5760" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="8" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val="%9."/><w:lvlJc w:val="right"/><w:pPr><w:ind w:left="6480" w:hanging="180"/></w:pPr></w:lvl>"""

		def _unordered_numbering():
			return """<w:lvl w:ilvl="0" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><!-- The unknown character for w:val is a solid circle bullet point. --><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="o"/><!-- this character is an empty circle bullet point --><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New" w:hint="default"/></w:rPr></w:lvl><w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><!-- The unknown character for w:val is a solid square bullet point. --><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="2160" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Wingdings" w:hAnsi="Wingdings" w:hint="default"/></w:rPr></w:lvl><w:lvl w:ilvl="3" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="2880" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl><w:lvl w:ilvl="4" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="o"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="3600" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New" w:hint="default"/></w:rPr></w:lvl><w:lvl w:ilvl="5" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="4320" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Wingdings" w:hAnsi="Wingdings" w:hint="default"/></w:rPr></w:lvl><w:lvl w:ilvl="6" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="5040" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl><w:lvl w:ilvl="7" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="o"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="5760" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New" w:hint="default"/></w:rPr></w:lvl><w:lvl w:ilvl="8" w:tplc="04090005" w:tentative="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="6480" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Wingdings" w:hAnsi="Wingdings" w:hint="default"/></w:rPr></w:lvl>"""

		if os.path.exists(self.numberingPath):
			numbering = open(self.numberingPath,'r')
			xmltext = numbering.read()
			os.remove(self.numberingPath)
		else:
			xmltext = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:ve="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"></w:numbering>"""

		newtext = """<w:abstractNum w:abstractNumId="%s"><w:multiLevelType w:val="hybridMultilevel"/>""" % self.listCount
		if self.orderedList:
			newtext += _ordered_numbering()
		else:
			newtext += _unordered_numbering()
#		newtext += """</w:abstractNum><w:num w:numId="%s"><w:abstractNumId w:val="%s"/></w:num>""" % (self.listCount, self.listCount)
		newtext += """</w:abstractNum>"""
		abstractNum = """<w:num w:numId="%s"><w:abstractNumId w:val="%s"/></w:num>""" % (self.listCount, self.listCount)
		self.numberingXML.append(newtext)
		self.numberElement.append(abstractNum)
#		fullxml = xmltext[:-14]+newtext+xmltext[-14:]
#		numbering = open(self.numberingPath,'w')
#		numbering.write(fullxml)
#		numbering.close()

	def buildCustomStyle(self):
		def _nested_numbering():
			return """<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="792" w:hanging="432"/></w:pPr></w:lvl><w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2.%3."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="1224" w:hanging="504"/></w:pPr></w:lvl><w:lvl w:ilvl="3"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2.%3.%4."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="1728" w:hanging="648"/></w:pPr></w:lvl><w:lvl w:ilvl="4"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2.%3.%4.%5."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="2232" w:hanging="792"/></w:pPr></w:lvl><w:lvl w:ilvl="5"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2.%3.%4.%5.%6."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="2736" w:hanging="936"/></w:pPr></w:lvl><w:lvl w:ilvl="6"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2.%3.%4.%5.%6.%7."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="3240" w:hanging="1080"/></w:pPr></w:lvl><w:lvl w:ilvl="7"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2.%3.%4.%5.%6.%7.%8."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="3744" w:hanging="1224"/></w:pPr></w:lvl><w:lvl w:ilvl="8"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2.%3.%4.%5.%6.%7.%8.%9."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="4320" w:hanging="1440"/></w:pPr></w:lvl>"""

		def _numbering(code, indentLvl):
			counterLvl = str(indentLvl+1)
			indentLvl = str(indentLvl)

			formatting = {
			"1.":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val='%"""+counterLvl+""".'/><w:lvlJc w:val="start"/>\n""",
			"(1)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val='(%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"1)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val='%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"a.":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val='%"""+counterLvl+""".'/><w:lvlJc w:val="start"/>\n""",
			"(a)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val='(%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"a)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val='%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"A.":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val='%"""+counterLvl+""".'/><w:lvlJc w:val="start"/>\n""",
			"(A)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val='(%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"A)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val='%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"i.":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val='%"""+counterLvl+""".'/><w:lvlJc w:val="start"/>\n""",
			"(i)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val='(%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"i)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val='%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"I.":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="upperRoman"/><w:lvlText w:val='%"""+counterLvl+""".'/><w:lvlJc w:val="start"/>\n""",
			"(I)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="upperRoman"/><w:lvlText w:val='(%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"I)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="upperRoman"/><w:lvlText w:val='%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"greek.":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val='%"""+counterLvl+""".'/><w:lvlJc w:val="start"/>\n""",
			"(greek)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val='(%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",
			"greek)":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val='%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>\n""",


			"01.":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="decimalZero"/><w:lvlText w:val='%"""+counterLvl+""".'/><w:lvlJc w:val="start"/>""",
			"one.":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="cardinalText"/><w:lvlText w:val='%"""+counterLvl+""".'/><w:lvlJc w:val="start"/>""",
			"first":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="ordinalText"/><w:lvlText w:val='(%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>""",
			"1st":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="ordinal"/><w:lvlText w:val='%"""+counterLvl+""")'/><w:lvlJc w:val="start"/>""",
			"bullet":"""<w:lvl w:ilvl='"""+indentLvl+"""'><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val=""/>""",
			}

			indentation = {
				'0':"""<w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>""",
				'1':"""<w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl>""",
				'2':"""<w:pPr><w:ind w:left="2160" w:hanging="360"/></w:pPr></w:lvl>""",
				'3':"""<w:pPr><w:ind w:left="2880" w:hanging="360"/></w:pPr></w:lvl>""",
				'4':"""<w:pPr><w:ind w:left="3600" w:hanging="360"/></w:pPr></w:lvl>""",
				'5':"""<w:pPr><w:ind w:left="4320" w:hanging="360"/></w:pPr></w:lvl>""",
				'6':"""<w:pPr><w:ind w:left="5040" w:hanging="360"/></w:pPr></w:lvl>""",
				'7':"""<w:pPr><w:ind w:left="5760" w:hanging="360"/></w:pPr></w:lvl>""",
				'8':"""<w:pPr><w:ind w:left="6480" w:hanging="360"/></w:pPr></w:lvl>""",
				'9':"""<w:pPr><w:ind w:left="7300" w:hanging="360"/></w:pPr></w:lvl>""",
			}

			return formatting[code]+indentation[indentLvl]


		def buildCustomNumberingXML():
			_style = self.style.strip().split(' ')
			style = {}
			for i in _style:
				attr = i.split(":")[0]
				if attr[0:5] == "level":
					value = i.split(":")[1]
					style[attr] = value
#			if os.path.exists(self.numberingPath):
#				numbering = open(self.numberingPath,'r')
#				xmltext = numbering.read()
#				os.remove(self.numberingPath)
#			else:
#				xmltext = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
#<w:numbering xmlns:ve="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"></w:numbering>"""
			newtext = """<w:abstractNum w:abstractNumId="%s"><w:multiLevelType w:val="hybridMultilevel"/>""" % self.listCount
			if 'level1' in style.keys():
				if style['level1'] == "1.2.3.":
					newtext += _nested_numbering()
			for i in range(9):
				attr = "level%s" % str(i)
				if attr in style.keys():
					newtext += _numbering(style[attr], i)
					self.numbering = style[attr]
				elif self.orderedList:
					if i == 0:
						self.numbering = "1." #reset default numbering for a new list
					newtext += _numbering(self.numbering, i)
				else:
					newtext += _numbering("bullet", i)
#			newtext += """</w:abstractNum><w:num w:numId="%s"><w:abstractNumId w:val="%s"/></w:num>""" % (self.listCount, self.listCount)
#		newtext += """</w:abstractNum><w:num w:numId="%s"><w:abstractNumId w:val="%s"/></w:num>""" % (self.listCount, self.listCount)
			newtext += """</w:abstractNum>"""
			abstractNum = """<w:num w:numId="%s"><w:abstractNumId w:val="%s"/></w:num>""" % (self.listCount, self.listCount)
			self.numberingXML.append(newtext)
			self.numberElement.append(abstractNum)
#			fullxml = xmltext[:-14]+newtext+xmltext[-14:]
#			numbering = open(self.numberingPath,'w')
#			numbering.write(fullxml)
#			numbering.close()

		def extractor(matchobj):
			self.flag = self.newListWithStyle
			style = matchobj.group('listStyle')
			self.style = style
			buildCustomNumberingXML()
			return ""
		
		self.text = re.sub("##listStyle##(?P<listStyle>[^#]*)##/listStyle##", extractor, self.text, 1)
		self.flag = self.continueLists
		return self.run()
		

	def dict_sub(self, dictionary):
		#### Copied from lawccess.markup
		""" Replace in 'text' non-overlapping occurences of REs whose patterns are keys in dictionary 'd' by corresponding values (which must be constant strings: may have named backreferences but not numeric ones). The keys must not contain anonymous matching-groups.                                      Returns the new string."""
		flag = self.flag
		self.flag = self.endLists #If there is no match, flag stays 0 -> stops substitution cycle.
		rx = re.compile('|'.join(map(re.escape, dictionary)))
		def one_xlat(match):
			if flag == self.newList:
				if match.group(0) == "##listStyle##":
					self.flag= self.newListWithStyle #There is a match --> use special substitution in next cycle.
					return "##listStyle##"
				else:
					self.buildDefaultStyle()
					self.flag = self.continueLists
			if match.group(0) in ["##ol##", "##ul##", "##dl##"]:
				self.lastReplacement = match.group(0)
				if self.indentCount == -1:
					self.listCount += 1
					self.flag = self.newList
				else:
					self.flag = self.continueLists
				self.indentCount += 1
				if match.group(0) == "##ol##":
					self.orderedList = True
				else:
					self.orderedList = False
			else:
				self.lastReplacement = match.group(0)
				self.flag = self.continueLists
				if match.group(0) in ["##/ul##", "##/ol##", "##/dl##"]:
					self.indentCount -= 1
				elif match.group(0) in ["##/li##","##/dt##","##/dd##"]:
					if self.lastReplacement in ["##/ul##","##/ol##","##/dl##"]:
						return "" ### element has already been closed by its sublist.
			return dictionary[match.group(0)]
		return rx.sub(one_xlat, self.text, 1)

	def list_replacement(self):
		#### variable "dictionary" defines the translation from HTML tags to OOXML tags for list elements
		dictionary = {
		  "##listStyle##":"", ##needed to prevent infinite loop for poorly formatted text.
		  "##/listStyle##":"",
		  "##ol##":"""</w:t></w:r></w:p>""",
		  "##/ol##":"",
		  "##ul##":"""</w:t></w:r></w:p>""",
		  "##/ul##":"",
		  "##dl##":"""</w:t></w:r></w:p>""", ### Treated just like unordered list
		  "##/dl##":"",
		  "##dt##":"""<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="%s"/><w:numId w:val="%s"/></w:numPr></w:pPr><w:r><w:t>""" % (self.indentCount, self.listCount),
		  "##/dt##":"""</w:t></w:r></w:p>""",
		  "##dd##":"""<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="%s"/><w:numId w:val="%s"/></w:numPr><w:tabs><w:tab w:val="start" w:pos="2160"/></w:tabs></w:pPr><w:r><w:t>""" % (self.indentCount, self.listCount),  ### Add tab to <dd> element.
		  "##/dd##":"""</w:t></w:r></w:p>""",
		  '##li##':"""<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="%s"/><w:numId w:val="%s"/></w:numPr></w:pPr><w:r><w:t>""" % (self.indentCount, self.listCount),
		  '##/li##':"""</w:t></w:r></w:p>"""
	}
		# we return 4 values needed for conversion().
		# The dict_sub parameters include the dictionary, string to act upon, and number of allowed replacements.
		# we only allow one replacement per cycle so that conversion() can update variables listcount and indentcount.
		self.text = self.dict_sub(dictionary)
		return self.run()

	def run(self):
		if self.flag == self.continueLists:
			return self.list_replacement()
		elif self.flag == self.newList:
			return self.list_replacement()
		elif self.flag == self.newListWithStyle:
			return self.buildCustomStyle()
		elif self.flag == self.endLists:
			numberingText= "%s%s%s" % ("".join(self.numberingXML), "".join(self.numberElement), "</w:numbering>")
#			if os.path.exists(self.numberingPath): #### finishing touches on numbering.xml
#				numbering = open(self.numberingPath,'r')
#				xmltext = numbering.read()
#				os.remove(self.numberingPath)
#				xmltext = xmltext[:-14]+self.numberElement+xmltext[-14:]
			numbering = open(self.numberingPath,'w')
			numbering.write(numberingText)
			numbering.close()
#			print(numberingText)
			return self.text # return content of document.xml

string = "##p##Homeward bound:##/p####ol####listStyle## level1:(a) level2:A. ##/listStyle####li##Element 1##/li####li##Element 2##ol####li##Element 2.1##/li####li##Element 2.2##/li####/ol####li##Element 3##/li####/ol####p## Paragraph 2##/p##"
string = "asdfasdf##br####br####ol####listStyle##level0:(1) level1:(A) level2:(greek)##/listStyle####li##asdf##/li####li##asdf##ol####li##asdf##/li####li##asdfasdf##ol####li##asdfasd##/li####/ol####/li####/ol####/li####/ol####p##aasdf##br####/p##"
string = "asdfasdf##br####br####ol####listStyle##level0:(1) level1:(A) level2:(greek) ##/listStyle####li##asdf##/li####li##asdf##ol####li##asd##/li####li##asdf##ol####li##fasdfasdf##/li####li##asdfasdf##/li####/ol####/li####/ol####/li####li##asdfasdf ##br####/li####/ol####p##aasdf##br####/p##"

def run():
	return ListConverter(string, "./").run()*/
