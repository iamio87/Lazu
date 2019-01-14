Source.Bibliography.CSLTypes = {
	"court-decision":"legal_case",
	"court-rule":"legal_case",
	"court-filing":"legal_case",
	"regulation":"legislation",
	"agency-case-decision":"legal_case",
	"agency-arbitration-decision":"legal_case",
	"advisory-opinion":"bill",
	"patent":"patent",
	"government-filing":"bill",
	"executive-order":"legislation",
	"legal-code":"legislation",
	"session-law":"legislation",
	"constitution":"legislation",
	"bill":"bill",
	"resolution":"legislation",
	"legislative-report":"report",
	"committee-print":"report",
	"hearing":"report",
	"debate":"report",
	"treaty":"treaty",
	"article-journal":"article-journal",
	"article-magazine":"article-magazine",
	"article-news":"article-news",
	"book":"book",
	"manuscript":"manuscript",
	"thesis":"thesis",
	"interview":"interview",
	"speech":"speech",
	"working-paper":"manuscript",
	"letter":"personal_communication",
	"email":"personal_communication",
	"post":"post",
	"webpage":"webpage",
	"audio":"song",
	"film":"motion_picture",
	"broadcast":"broadcast"
}


Source.Bibliography.SourceTypeTree = [
    {"value":'judicial',
    'label':"Judicial",
    'submenu':[
        {"value":"court-decision","label":"Case Decision"},
        {"value":'court-rule',"label":"Court Rule"},
        {"value":'court-filing',"label":"Court Filing"},
    ]},
    {"value":"executive",
    "label":"Executive",
    "submenu":[
        {"value":"regulation","label":"Regulation"},
        {"value":"agency-case-decision","label":"Agency Adjudication"},
        {"value":"agency-arbitration-decision","label":"Agency Arbitration"},
        {"value":"advisory-opinion","label":"Advisory Opinion"},
        {"value":"patent","label":"Patent"},
        {"value":"government-filing","label":"Government Filing"},
        {"value":"executive-order","label":"Executive Order"},
    ]},
    {"value":"legislative",
    "label":"Legislative",
    "submenu":[
        {"value":"legal-code","label":"Legal Code"},
        {"value":"session-law","label":"Session Law"},
        {"value":"constitution","label":"Constitution"},
        {"value":"bill","label":"Bill"},
        {"value":"resolution","label":"Resolution"},
        {"value":"legislative-report","label":"Report"},
        {"value":"committee-print","label":"Committee Print"},
        {"value":"hearing","label":"Hearing"},
        {"value":"debate","label":"Debate"},
    ]},
    {"value":"treaty","label":"Treaty"},
    {"value":"periodical","label":"Periodical",
    "submenu":[
        {"value":"article-journal","label":"Journal Article"},
        {"value":"article-newspaper","label":"Newspaper Article"},
        {"value":"article-magazine","label":"Magazine Article"},
    ]},
    {"value":"book","label":"Non-Periodical"},
    {"value":"non-published",
    "label":"Unpublished",
    "submenu":[
        {"value":"manuscript","label":"Manuscript"},
        {"value":"dissertation/thesis","label":"Dissertation/Thesis"},
        {"value":"interview","label":"Interview"},
        {"value":"speech/address","label":"Speech/Address"},
        {"value":"working-paper","label":"Working Paper","submenu":[
            {"value":"example","label":"Example"},
            {"value":"example2","label":"Example2"},
            {"value":"example3","label":"Example3"},
        ]},
    ]},
    {"value":"correspondence",
    "label":"Correspondence",
    "submenu":[
        {"value":"letter","label":"Letter"},
        {"value":"email","label":"e-Mail"},
        {"value":"post","label":"Forum Post"},
    ]},
    {"value":"Internet","label":"Internet"},
    {"value":"media",
    "label":"Media",
    "submenu":[
        {"value":"audio","label":"Audio"},
        {"value":"film","label":"Film"},
        {"value":"broadcast","label":"Broadcast"},
    ]},
]

Source.Bibliography.Fields = {
	'serials':{'label':'Serial',"subfields":{'volume':{"label":"Volume"},'publication':{'label':'Reporter'},'page':{'label':'Page'}}},
    'title':{'label':'Title','type':'str'},
    'issued':{'label':'Year','type':'date'},
    'full_citation':{'label':'Year','type':'str'},
    'short_citation':{'label':'Year','type':'str'},
    'sourcetype':{'label':'Source Type','type':'select'},
    'docket-no':{'label':'Docket No.','type':'str'},
    'url':{'label':'URL','type':'str'},
    'note':{'label':'Note','type':'str'},
    'organization':{'label':'Organization','type':'str'},
    'authors':{'label':'Authors','type':'persons'},
    'category':{'label':'Category','type':'str'},
    'jurisdiction':{'label':'Jurisdiction','type':'str'},
    'institution':{'label':'Institution','type':'str'},
    'subdivision':{'label':'Subdivision','type':'str'},
    'form':{'label':'Form','type':'str'},
    'filer':{'label':'Filer','type':'str'},
    'patent-no':{'label':'Patent No.','type':'str'},
    'patent-type':{'label':'Patent Type','type':'str'},
    'public-law-number':{'label':'Public Law Number','type':'str'},
    'code':{'label':'Code','type':'str'},
    'session':{'label':'Session','type':'str'},
    'sponsors':{'label':'Sponsors','type':'str'},
    'committee':{'label':'Committee','type':'str'},
    'stage':{'label':'Stage','type':'str'},
    'speakers':{'label':'Speakers','type':'str'},
    'multipart':{'label':'Multi-part','type':'str'},
    'designation':{'label':'Designation','type':'str'},
    'parenthetical':{'label':'Parenthetical','type':'str'},
    'interviewers':{'label':'Interviewer(s)','type':'str'},
    'interviewees':{'label':'Interviewee(s)','type':'str'},
    'addressees':{'label':'Addressee(s)','type':'str'},
    'publisher':{'label':'Publisher','type':'str'},
    'episode-name':{'label':'Episode Name','type':'str'},
    'publication':{'label':'Publications','type':'publication'}
}

Source.Bibliography.SourceTypeFields = {
"default":[
	{'name':'title','label':'Title','type':'edit'},
	{'name':'issued','label':'Year','type':'date'},
    ],

"court-decision":[
    {'name':'title',"label":"Title"},
		{'name':'serials',"label":"Reporter","subfields":[{'name':'volume',"label":"Volume"},{'name':'publication','label':'Reporter'},{'name':'page','label':'Page'}]}, {'name':'persons',"label":"Author","subfields":[{'name':'family',"label":"Family Name"},{'name':'given','label':'Given Name'},{'name':'affiliation','label':'Institutional Affiliation'},{'name':'credentials','label':'Credentials'},{'name':'URI','label':'URI'}]},
    {'name':'docket-no',"label":"Docket No."},
    {'name':'issued','label':"Date"}, //// Date of Decision
    {'name':'jurisdiction','label':'Jurisdiction','type':'edit'}, // Could become relationship:jurisdiction //
    {'name':'summaryfacts','label':'Summary of Facts','type':'edit'},
    {'name':'summarycase','label':'Summary of Case','type':'edit'},
    {'name':'appealed-to','label':'Appealed To','type':'relationship'},
    {'name':'appealed-from','label':'Appealed From','type':'relationship'},
    ],

"agency-case-decision":[
    {'name':'title',"label":"Title"},
    {'name':'docket-no',"label":"Docket No."},
		{'name':'serials',"label":"Reporter","subfields":[{'name':'volume',"label":"Volume"},{'name':'publication','label':'Reporter'},{'name':'page','label':'Page'}]},
    {'name':'issued','label':"Date"}, //// Date of Decision
    {'name':'authority','label':'Issuing Agency','type':'edit'}, // Could become relationship:jurisdiction //
    {'name':'summaryfacts','label':'Summary of Facts','type':'edit'},
    {'name':'summarycase','label':'Summary of Case','type':'edit'},
    {'name':'appealed-to','label':'Appealed To','type':'relationship'},
    {'name':'appealed-from','label':'Appealed From','type':'relationship'},
//    'authors':{'label':'Judges'},   //
    ],

"arbitration-decision":{
    'title':{"label":"Title"},
    'docket-no':{"label":"Docket No."},
    'volume':{"label":"Volume"},
    'reporter':{"label":"Reporter Abbreviation"},
    'first_page':{'label':"First Page"},
    'issued':{'label':"Date"}, //// Date of Decision
	'jurisdiction':{'label':'Jurisdiction','type':'edit'}, // Could become relationship:jurisdiction //
//    'authors':{'label':"Arbitrator"},
    'authority':{'label':"Issuing Agency (if not clear from Reporter)"}, /// blank for regular arbitration
    },

"agency-arbitration-decision":{
    'title':{"label":"Title"},
    'docket-no':{"label":"Docket No."},
    'volume':{"label":"Volume"},
    'reporter':{"label":"Reporter Abbreviation"},
    'first_page':{'label':"First Page"},
    'issued':{'label':"Date"}, //// Date of Decision	'jurisdiction':{'label':'Jurisdiction','type':'edit'}, // Could become relationship:jurisdiction //
//    'authors':{'label':"Arbitrator"},
    'authority':{'label':"Court or Issuing Agency"}, /// blank for regular arbitration
    },

"advisory-opinion":{
    'volume':{"label":"Volume"},
    'opinion-type':{"label":"Opinion Type"},
    'institution':{"label":"Institution"},
    'issued':{"label":"Date"}, // year
    'title':{"label":"Title"},
    'first_page':{'label':"First Page"},
    'jurisdiction':{'label':'Issuing Agency'}, // Could become relationship:jurisdiction //
    'authors':{'label':"Authors"},
    },

"executive-order":{
    'volume':{"label":"Volume"},
//    'opinion-type':{"label":"Opinion Type"},
    'institution':{"label":"Institution"},
    'issued':{"label":"Date"}, // year
    'title':{"label":"Title"},
    'first_page':{'label':"First Page"},
    'jurisdiction':{'label':'Jurisdiction'}, // Could become relationship:jurisdiction //
    'authors':{'label':"Authors"},
    'institution':{'label':"Issuing Agency"}, /// blank for regular arbitration
    },

"court-rule":{
    'jurisdiction':{"label":"Jurisdiction"},
    'title':{"label":"Title","type":"edit"},
    'subdivision':{"label":"Subdivision"},
    'code':{"label":"Abbreviated Name of Legal Code"},
    "issued":{"label":"Date","type":"edit"}, //// Date of Code Edition Cited
    },

"court-filing":{
    'jurisdiction':{"label":"Jurisdiction","type":"edit"},
    'title':{"label":"Title","type":"edit"},
    'docket-no':{"label":"Abbreviated Name of Legal Code","type":"edit"},
    'motion-type':{'label':"Motion Type"},
    "issued":{"label":"Date"}, //// Date of Code Edition Cited
    "authors":{"label":"Authors"},
    },

"government-filing":{
    'institution':{'label':"Government Agency"},
    'title':{'label':"Title"},
    'form':{'label':"Form"},
    "filer":{'label':"Filer"},
    },

"patent":{
    'title':{"label":"Title"},
    'patent-no':{"label":"Patent No."},
    'patent-type':{"label":"Patent Type"},
    'issued':{"label":"Date"}, // Filing Date; Issuing Date can be included if relevant in a parenthetical.
    'filer':{"label":"Filer"},
    },

"legal-code":{
    'jurisdiction':{"label":"Jurisdiction","type":"edit"},
    'title':{"label":"Title","type":"edit"},
    'subdivision':{"label":"Subdivision","type":"edit"},
    'code':{"label":"Abbreviated Name of Legal Code","type":"edit"},
    "issued":{"label":"Date","type":"edit"}, //// Date of Code Edition Cited
    },

"regulation":{
    "title":{"label":"Title"},
    "issued":{"label":"Date"},
    "subdivision":{"label":"Subdivision"},
    "code":{"label":"Code"},
    'jurisdiction':{"label":"Jurisdiction","type":"edit"},
    'institution':{"label":"issuing Agency"},
    },

"constitution":{
    'jurisdiction':{"label":"Jurisdiction"},
    'title':{"label":"Title","type":"edit"},
    'subdivision':{"label":"Subdivision","type":"edit"},
    "issued":{"label":"Date","type":"edit"}, 
    },

"treaty":{
    'title':{"label":"Name of Agreement"},
    "type":{"label":"Form of Agreement"}, // Agreement, Convention, Memorandum, Protocol, Treaty, Understanding
    'issued':{"label":"Date of Signing"},
    'subdivision':{'label':"Subdivision"},
    'dom-vol':{"label":"Volume"},
    'domestic-reporter':{"label":"Domestic Reporter"}, //// U.S. Source. Order of Preference: U.S.T. or Stat.; T.I.A.S., T.S., E.A.S., Senate Treaty Documents or Senate Executive Documents; Department of STate Dispatch; Depart of State Press Release
    'dom-first-page':{'label':"First Page"},
    'international-reporter':{"label":"International Reporter"}, //// International Source. Order of Preference: U.N.T.S., L.N.T.S., O.A.S.T.S., Pan-Am. T.S., O.J., or Europ. T.S.
    "2nd-vol":{"label":"Volume"},
    "2nd-first-page":{"label":"First Page"},
    "No.":{"label":"No."},
    },

"session-law":{
    'jurisdiction':{"label":"Jurisdiction","type":"edit"},
    'public-law-number':{"label":"Public Law Number","type":"edit"},
    'code':{"label":"Abbreviated Name of Legal Code","type":"edit"}, /// For Statutes at Large; compare with public-law-number
    'title':{"label":"Title","type":"edit"},
    'subdivision':{"label":"Subdivision","type":"edit"},
    "issued":{"label":"Date","type":"edit"}, // Date of passage if possible; otherwise, date of enactment.
    "first_page":{"label":"First Page","type":"edit"},
    },

"bill":{
    'title':{"label":"Title"},
    'committee':{"label":"Committee"},
    'stage':{"label":"Stage of Proceedings"}, //// Stage of proceedings
    'No.':{"label":"Bill No."}, //// Bill Number
    'session':{"label":"Session"}, //// Session or year of legislative body ||| Session or Volume?
    'jurisdiction':{"label":"Legislative Body"},
    'issued':{"label":"Date"}, // date of publication; or the date of enactment.
    'parallel_citation':{"label":"Parallel Citation"},
    'sponsors':{"label":"Sponsors"}, // sponsors
    },

"resolution":{
    'title':{"label":"Title"},
    'committee':{"label":"Committee"},
    'stage':{"label":"Stage of Proceedings"}, //// Stage of proceedings
    'No.':{"label":"Bill No."}, //// Bill Number
    'session':{"label":"Session"}, //// Session or year of legislative body ||| Session or Volume?
    'jurisdiction':{"label":"Legislative Body"},
    'issued':{"label":"Date"}, // date of publication; or the date of enactment.
    'parallel_citation':{"label":"Parallel Citation"},
    'sponsors':{"label":"Sponsors"}, // sponsors
    },

'hearing':{
    'title':{"label":"Title"},
    'institution':{"label":"Institution"}, //// Legislative Body
    'committee':{"label":"Committee"},
    'session':{"label":"Session"}, //// Session or year of legislative body
    'jurisdiction':{"label":"Jurisdiction"},
    'issued':{"label":"Date"}, // date of publication; or the date of enactment.
    'speakers':{"label":"Speakers"},
    'volume':{"label":"Volume"},
    'No.': {"label":"No."},
    },

'debate':{
    'title':{"label":"Title"},
    'institution':{"label":"Institution"}, //// Legislative Body
    'committee':{"label":"Committee"},
    'session':{"label":"Session"}, //// Session or year of legislative body
    'jurisdiction':{"label":"Jurisdiction"},
    'issued':{"label":"Date"}, // date of publication; or the date of enactment.
    'speakers':{"label":"Speakers"},
    'volume':{"label":"Volume"},
    'No.': {"label":"No."},
    },

'legislative-report':{
    "title":{"label":"Title"},
    'authors':{"label":"Authors"}, //// If the title is given, the authors should also be named.
    "No.":{"label":"No."},
    'institution':{"label":"Institution"}, //// Legislative Body
    'committee':{"label":"Committee"},
    'jurisdiction':{"label":"Jurisdiction"},
    'issued':{"label":"Date"},
    'parenthetical':{"label":"Parenthetical"},//// 'Conf. Rep.'
    "multipart":{"label":"Parts Cited from Multipart Article"},
    },

'committee-print':{
    "title":{"label":"Title"},
    'authors':{"label":"Authors"}, //// If the title is given, the authors should also be named.
    "No.":{"label":"No."},
    'institution':{"label":"Institution"}, //// Legislative Body
    'committee':{"label":"Committee"},
    'jurisdiction':{"label":"Jurisdiction"},
    'issued':{"label":"Date"},
    'parenthetical':{"label":"Parenthetical"},//// 'Conf. Rep.'
    "multipart":{"label":"Parts Cited from Multipart Article"},
    },

'article-journal':{
    "authors":{"label":"authors"},
    "title":{"label":"Title"},
    "issued":{"label":"Date"},
//	"serials":{"label":"Publication","subfields":{'volume':{"label":"Volume"},'publication':{'label':'Reporter'},'page':{'label':'Page'}}},
	"volume":{"label":"Volume"}, //// leave empty for non-consecutively paginated journals
	"container-title":{"label":"Publication"},
    "page":{"label":"First Page No."},
    "multipart":{"label":"Parts Cited from Multipart Article"},
    "designation":{"label":"Special Designation"}, // values include "Op-Ed", "editorial", "Letter to the Editor" for "Newspaper"
    //// if citing more than one part, must include dates and full citations for all cited parts
    "designation":{"label":"Designation"}, //possible values: Commentary, Tribute, Memoriam, Note, Comment, Recent Development, Book Note, Annotation, Case Comment, Project, Recent Case, Case Note, Dedication, Response.
    //// Symposia, Colloquia, Surveys are designations that do not allow author values
    },

'article-newspaper':{
    "title":{"label":"Title"},
    "authors":{"label":"authors"},
    "issued":{"label":"Date"},
//	"serials":{"label":"Reporter","subfields":{'volume':{"label":"Volume"},'publication':{'label':'Reporter'},'page':{'label':'Page'}}},
    "publisher-place":{"label":"Publisher Place"},// only if unclear from publications name
    "page":{"label":"First Page No."},
    "multipart":{"label":"Parts Cited from Multipart Article"},
    "designation":{"label":"Special Designation"}, // values include "Op-Ed", "editorial", "Letter to the Editor" for "Newspaper"
    //// if citing more than one part, must include dates and full citations for all cited parts
    "designation":{"label":"Designation"}, //possible values: Commentary, Tribute, Memoriam, Note, Comment, Recent Development, Book Note, Annotation, Case Comment, Project, Recent Case, Case Note, Dedication, Response.
    //// Symposia, Colloquia, Surveys are designations that do not allow author values
    },

'article-magazine':{
    "title":{"label":"Title"},
    "authors":{"label":"authors"},
    "issued":{"label":"Date"},
	"serials":{"label":"Publication","subfields":{'volume':{"label":"Volume"},'publication':{'label':'Reporter'},'page':{'label':'Page'}}},
    "publisher-place":{"label":"Area of Circulation"},// only if unclear from publications name
    "page":{"label":"First Page No."},
    "multipart":{"label":"Parts Cited from Multipart Article"},
    "designation":{"label":"Special Designation"}, // values include "Op-Ed", "editorial", "Letter to the Editor" for "Newspaper"
    //// if citing more than one part, must include dates and full citations for all cited parts
    "designation":{"label":"Designation"}, //possible values: Commentary, Tribute, Memoriam, Note, Comment, Recent Development, Book Note, Annotation, Case Comment, Project, Recent Case, Case Note, Dedication, Response.
    //// Symposia, Colloquia, Surveys are designations that do not allow author values
    },


//// Unpublished ////
'dissertation/thesis':{
    'authors':{"label":"Authors"},
    'title':{"label":"Title"},
    'institution':{"label":"Institution"},
    'issued':{"label":"Date"},
    },

'manuscript':{
    'authors':{"label":"Authors"},
    'title':{"label":"Title"},
    },

'speech/address':{
    "speakers":{"label":"Speakers"},
    "volume":{"label":"Volume"},
    "publication":{"label":"Publication"},
    "issued":{"label":"Date"},
    },

'non-periodical':{
    'authors':{"label":"Authors"}, 
    'editors':{"label":"Editors"},
    'translators':{"label":"Translators"},
    'organization':{"label":"Organization"},
    'publisher':{"label":"Publisher"},
    'title':{"label":"Title"},
    'edition':{"label":"Edition"},
    'publisher':{"label":"Publisher"}, // publisher of edition cited.
    'issued':{"label":"Date"}, // Original Publication Date, Irrespective of Later Publication Dates
    'edition-date':{"label":"Edition Date"}, // Year of edition cited.
    'edition':{"label":"Edition"},
    'serial-number':{"label":"Serial No."},
    'designation':{"label":"Designation"}, // possible values: Preface, Foreword, Introduction, Epilogue
    'series-number':{"label":"Series No."},
    'publisher-place':{"label":"Publisher Place"}, // location of publication or publisher
    'collection, reprint':{"label":"Collection"},
    },

'interview':{
    "issued":{"label":"Date"},
    "interviewers":{"label":"Interviewers"},
    "interviewees":{"label":"Interviewees"},
    },

'Internet':{
    'title':{"label":"Title"},
    'authors':{"label":"Authors"},
    'issued':{"label":"Date"}, // date published
    'URL':{"label":"URL"},
    'date-accessed':{"label":"Date Accessed"},
    },

//// Correspondence ////
'letter':{
    'authors':{"label":"Authors"},
    'title':{"label":"Title"},
    'issued':{"label":"Date"},
    'addressees':{"label":"Addressees"},
    },

'email':{
    'authors':{"label":"Authors"},
    'title':{"label":"Title"},
    'issued':{"label":"Date"},
    'addressees':{"label":"Addressees"},
    'how_to_access':{"label":"How to Access"},
    },

'forum-post':{
    'authors':{"label":"Authors"},
    'title':{"label":"Title"},
    'issued':{"label":"Date"},
    'url':{"label":"URL"},
    },

'audio':{
    'title':{"label":"Title"},
    'artists':{"label":"Artists"},
    'publisher':{"label":"Publisher"},// record label
    'issued':{"label":"Date"}
    },

'film':{
    'title':{"label":"Title"},
    'publisher':{"label":"Publisher"}, //// Producing company
    'issued':{"label":"Date"}, //// year of release
    },

'broadcast':{
    'title':{"label":"Title"},
    'episode-name':{"label":"Episode Name"},
    'issued':{"label":"Date"}, //// airing date
    'publisher':{"label":"Publisher"}, //// Network
    },

//// Microform ////
/*    'microform-service':{'label':"Microform Service",'type':'edit'},
    'microform-publisher':{'label':"Microform Publisher",'type':'edit'},
    'microform-id':{"label":"Microform ID",'type':'edit'},*/
}


Source.Bibliography.FieldTypes = {
    "text":"",
    "persons":["FamilyName","GivenName","institutional-affiliation","credentials","URI"],//Institutional Affiliation includes role in organization.
    "issued": ["era","year","month","day","calendar","season","hour","minute","second"],
    "serials":["volume","publication","page","issue"],//Note: Issue can be redundant with the Date field fo the source. (Example, the cover date of a magazine issue). In this case, the issue field should remain blank.
	//// The "issue" field is never needed for Bluebook citations; it only ever cares about issue dates - which is recorded as its own field in bibliography.
	//// Serials will always be a publication.

// "citation", "organization", "source_type", "note", "subdivision"
}

Source.Bibliography.SourceTypes = {
    "court-decision":{'tooltip':" ",'date-tooltip':"Date of case decision.",'organization-tooltip':'If the tribunal is part of a government agency, the name of the agency',"publication-tooltip":"Reporter Abbreviation"},
    "court-rule":{"tooltip":"In some jurisdictions, the highest court is delegated by the legislature to promulgate rules of evidence, prodecure, and attorney conduct.","title-tooltip":"abbreviation of the set of rules cited.",'date-tooltip':"No date is required for rules that are in force. For abrogated rules, give the date of the most recent official source in which the rule appears. (Note: the year of repeal should be given in a parenthetical following the above-mentioned date.)"},
    "court-documents":{'date-tooltip':""}, // briefs, filings, 
    "agency-case-decision":{'tooltip':" ",'date-tooltip':"Date or Year of case decision."},
    "agency-arbitration-decision":{'tooltip':" ",'date-tooltip':"Date or Year of case decision."},
    "advisory-opinion":{'tooltip':" ",'date-tooltip':"Date or Year of case decision."},
    "patent":{},
    "government-filing":{}, // SEC, State Dep't,
    "executive-order":{},
    "session-law":{'tooltip':"Session Law",'date-tooltip':"If the statute has no official or popular name, the act is identified by the full date. examples: Act of <date>, Act effective <date>. For statutes that are named, give the date of enactment if possible; otherwise, give the date on which the statute becomes effective.",'jurisdiction-tooltip':''},
    "legal-code":{"tooltip":"Codified Statute (Federal or State)",'date-tooltip':"Generally: date of code edition cited. Provide the year that appears on the spine of the volume, the year that appears on the title page, or the latest copyright year - in that order of preference. If such date spans multiple years, give the span of years. When citing a provision that appears in a supplement or pocket part, give the year that appears on the title page of the supplement or pocket part. If material is found in both the main volume and a supplement or pocket part, give both dates in the form (<main-year> & Supp. <supp-year>).","jurisdiction-tooltip":"Jurisdiction is implied by the code abbreviation. Model statutes have no jurisdiction."},
    "model_rules":{"tooltip":"","organization-tooltip":"Organization that issues the model rules"},
    "constitution":{'tooltip':"","date-tooltip":"Cite constitutional provisions currently in force without a date. If the cited provision has been repealed, either indicate parenthetically the fact and (date or year) of repeal or cite the repealing provision in full.","jurisdiction-tooltip":"U.S. Constitution is default."},
    "bill":{'tooltip':" ",'date-tooltip':"Year of publication","organization-tooltip":"Name of the legislative body","jurisdiction-tooltip":"The U.S. Federal Government is the default jurisdiction. Otherwise the abbreviated jurisdiction name should be given."},
    "resolution":{},
    "legislative-report":{},
    "committee-print":{},
    "hearing":{},
    "debate":{},
    "treaty":{},
    "periodical":{},
/*    "journal",
    "newspaper",
    "magazine":{"tooltip":},
    "newsletter":{"tooltip":"Noncommercially Distributed Periodical"},
    "symposia, colloquia, survey"
    "commentaries","special_designation","multipart_article","annotation","proceedings","regular_publications_by_institutes","ABA_section_reports"
*/
    "non-periodical":{},
/*  "book","report"    */
    "non-published":{},
    "manuscript":{},
    "dissertation/thesis":{},
    "interview":{},
    "speech/address":{"tooltip":"","authors-tooltip":""},// Can be published, so include fields for publication.
    "working-paper":{},
    "letter":{},
    "email":{},
    "forum-post":{},
    "Internet":{},
    "audio":{},
    "film":{},
    "broadcast":{},
}

Source.Bibliography.HowPublished = ["reporter","service","CD-ROM","Internet","online_database","microform","film","broadcast","recording"]

/*Source.Bibliography.get_citation(bibliography){
	var serial = function(serial){
		return serial['volume']+" "+serial['publication']+" "+serial['page']
	}

	var person = function(person){
		return person['familyname']+", "+person['givenname']+", "+ {'familyname':{"label":"Family Name"},'givenname':{'label':'Given Name'},'affiliation':{'label':'Institutional Affiliation'},'credentials':{'label':'Credentials'},'URI':{'label':'URI'}}
	}

	var lambda = {
		"court-decision":function(bibliography){
			return ""+bibliography['serial'][0]['volume']+
		}
	}
}


*/
