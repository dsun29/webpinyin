/*
MDBG Javascript Chinese IME v1.102
Idea / code based on: http://chinese.cari.com.my/ime/ 
Code was completely rewritten to improve browser support and integration in the MDBG dictionary.
Last modified: 2015-06-05

Original code description:
------------------------------------------------------------------
  GNU通用公共许可证(GPL)
  这是一个自由软件，任何人或机构都可以在遵守GPL守则下使用该软件。
  原 作 者 ：亦????程（万码论坛注册 http://www.suoai.com/88988/）
  修 改 者 ：阿勤（仓颉之友。马来西亚 http://www.chinesecj.com）丶FXAM
  版  本　 ：0.61
  浏览器   ：支持IE丶Netscape 及 Mozilla 最新版本
  推出日期 ：2003-7-30
  修改日期 ：2003-8-23
------------------------------------------------------------------

*/

imeData=imeData.split('	');
imeDataSize=imeData.length;

browser=null;

txbInputArea=null;
inpComposeInput=null;

findInput="";
findFound=false;
findStartIndex=0;
findEndIndex=0;
findSize=0;

candidatesOffset=0;
candidatesChinese=new Array();
candidatesInput=new Array();
candidatesDefinition=new Array();

cancelNextKeyPress=false;
passNextKeyPress=false;


txbInputArea = null;
inpComposeInput = null;
lblCandidates = null;
ckbEnglishMode = null;
ckbDoubleWidthMode = {};
ckbDoubleWidthMode.checked = false;
lblPageIndicator = null;
lblLinks = null;

imeSize=0;
initialInputAreaRows=0;
initialInputAreaCols=0;
initialWindowWidth=0;
initialWindowHeight=0;
initialWindowWidthStd=480;
initialWindowHeightStd=480;
initialWindowWidthEng=600;
initialWindowHeightEng=650;
largeWindowWidth=0;
largeWindowHeight=0;
largeWindowWidthStd=850;
largeWindowHeightStd=700;
largeWindowWidthEng=900;
largeWindowHeightEng=650;

// clears the candidates list (does not update the screen)
function ClearCandidatesList() {
	candidatesChinese=new Array();
	candidatesInput=new Array();
	candidatesDefinition=new Array();
}

// redraw the candidates list
function RedrawCandidatesList() {
	var candidatesHtml="";
	
	var totalCandidates=candidatesChinese.length;
	for(candidateIdx=0; candidateIdx<totalCandidates; candidateIdx++) {
		var candidateKeyNum=0;
		if(candidateIdx<=8) {
			candidateKeyNum=candidateIdx+1;
		}

		var candidatesInputRest=candidatesInput[candidateIdx].substring(findInput.length);

		candidatesHtml+=candidateKeyNum+'&nbsp;'+candidatesChinese[candidateIdx]+'<br />';
		candidatesHtml+='<span style="font-size: smaller">&nbsp;&nbsp;&nbsp;&nbsp;'+findInput+'<strong>'+candidatesInputRest+'</strong>';
		if(candidatesDefinition[candidateIdx] != null && candidatesDefinition[candidateIdx] != '') {
			candidatesHtml+='<br /><em>"'+candidatesDefinition[candidateIdx]+'"</em>';
		}
		candidatesHtml+='</span><br />';
	}

	if(candidatesHtml!="") {
		candidatesHtml='<div class="panel">'+candidatesHtml+'</div>';
	}

	lblCandidates.innerHTML=candidatesHtml;

	var pageIndicatorHtml="";
	if(candidatesChinese.length>0) {
		var currentPage=(Math.floor(candidatesOffset/10)+1);
		var totalPages=Math.ceil(findSize/10);

		if(currentPage>1) {
			pageIndicatorHtml+='▲ ';
		}

		pageIndicatorHtml+=currentPage+"/"+totalPages;

		if(currentPage<totalPages) {
			pageIndicatorHtml+=' ▼';
		}
	}

	lblPageIndicator.innerHTML=pageIndicatorHtml;
}

// find the start / end point in the ime database
function FindEntries(input) {
	candidatesOffset=0;
	findInput=input;
	findFound=false;
	findStartIndex=0;
	findEndIndex=0;
	findSize=0;

	if(input!="") {
		var find=-1
		var low=0;
		var mid=0;
		var high=imeDataSize;
		
		var entry="";
		while(low<high) {
			mid=(low+high)/2;
			mid=Math.floor(mid);
			entry=imeData[mid];
			if(entry.indexOf(input,0)==0) {
				// hit
				find=mid;
				findFound=true;
				break;
			}
			if(entry<input) {
				// too low
				low=mid+1;
			}
			else {
				// too high
				high=mid;
			}
		}
	
		if(findFound==true) {
			findEndIndex=find;
			var imeDataLastIndex=imeDataSize-1;
			while(findEndIndex<imeDataLastIndex) {
				entry=imeData[findEndIndex+1];
				if(entry.indexOf(input,0)==0) {
					findEndIndex++;
				}
				else { 
					break;
				}
			}
			
			findStartIndex=find;
			while(findStartIndex>0) {
				entry=imeData[findStartIndex-1];
				if(entry.indexOf(input,0)==0) {
					findStartIndex--;
				}
				else { 
					break;
				}
			}
		
			findSize=findEndIndex-findStartIndex+1;
		}
	}
}

// fetch 1 page of candidates, redraws the screen 
function FetchCandidatesList() {
	ClearCandidatesList();

	var entry="";
	for(idx=0;idx<=9;idx++) {
		if((candidatesOffset+idx) >= findSize) {
			// no more candidates available
			break;
		}
		
		entry=imeData[findStartIndex+candidatesOffset+idx];
		
		var definitionSeparatorPos = entry.indexOf("|");
		if(definitionSeparatorPos>0) {
			candidatesChinese[idx]=entry.substring(entry.indexOf(" ")+1, definitionSeparatorPos);
			candidatesDefinition[idx]=entry.substr(definitionSeparatorPos+1);
		}
		else {
			candidatesChinese[idx]=entry.substr(entry.lastIndexOf(" ")+1);
		}
		candidatesInput[idx]=entry.substring(0,entry.indexOf(" "));
	}

	RedrawCandidatesList();
}

// process new input, fetches candidates and redraws the screen
function ProcessInput(s) {
	ClearCandidatesList();

	FindEntries(s);
	if(findFound==true) {
		FetchCandidatesList();
	}
	else {
		// no results, empty list
		RedrawCandidatesList();
	}
}

// send a candidate to the textarea and clear the candidates list, redraws the screen
function SendCandidate(n) {
	if( n < candidatesChinese.length ) {
		SendString(candidatesChinese[n]);
		ClearCandidatesList();
		RedrawCandidatesList();
		inpComposeInput.value="";
	}
}

// send a string to the textarea
function SendString(s) {
	if (s!="") {
		switch (browser) {
			case 1: // IE
				// use a range to add it to the text area
				var range=document.selection.createRange();
				range.text=s;
				range.select();
				break;
			case 2: // Gecko
			case 4: // Safari
				// Remember previous scroll position and text area length
				var previousScrollTop = txbInputArea.scrollTop;
				var previousScrollHeight = txbInputArea.scrollHeight;
				var previousLen = txbInputArea.value.length;

				// get current selection location
				var selectionStart = txbInputArea.selectionStart;
				var selectionEnd = txbInputArea.selectionEnd;
				// replace selection with new text
				var textBeforeSelection = txbInputArea.value.substring(0, selectionStart);
				var textAfterSelection = txbInputArea.value.substring(selectionEnd);
				txbInputArea.value = textBeforeSelection + s + textAfterSelection;
				// move cursor
				txbInputArea.selectionStart = txbInputArea.selectionEnd = selectionStart + s.length;

				// correct the scroll position of the textarea, because gecko resets it to 0
				if (txbInputArea.scrollHeight > previousScrollHeight) {
					// if the text area's height increased, scroll down the amount it increased in height
					txbInputArea.scrollTop = previousScrollTop + (txbInputArea.scrollHeight - previousScrollHeight);
				}
				else {
					// else scroll to original scroll positon
					txbInputArea.scrollTop = previousScrollTop;
				}
	
				break;
/*
			case 4: // Safari
				// just add it to the text area, don't move cursor / selection
				txbInputArea.value += s;

				// somehow safari sometimes doesn't notice that something was added, this seems to help
				txbInputArea.blur();
				txbInputArea.focus();
				break;
*/
			case 3: // Opera
			default: // Other browsers
				// just add it to the text area, don't move cursor / selection
				txbInputArea.value += s;
		}
	}
}

// convert characters to doublewidth
function ToDoubleWidthLetter(s) {
	var result="";

	for (idx=0;idx<s.length;idx++) {
		var charCode = s.charCodeAt(idx);

		if (charCode>=65 && charCode<=90) {
			// capital letters
			result += String.fromCharCode(charCode - 65 + 65313);
		}
		else if (c>=97 && c<=122) {
			// small caps
			result += String.fromCharCode(charCode - 97 + 65345);
		}
		else {
			result += s.charAt(idx);
		}
	}
	
	return result;
}

// handle keydown events
function ImeKeyDown(e) {
	// get key code
	var key = e.which ? e.which : e.keyCode;

	var s="";
	passNextKeyPress=false;

	// Toggle english mode upon ctrl-space
	if(key==32 && (e.ctrlKey || e.metaKey)) {
		ckbEnglishMode.checked = !ckbEnglishMode.checked;
		cancelNextKeyPress = true;
		return false;		
	}

	// Toggle double width mode upon shift-space
	if(key==32 && e.shiftKey) {
		ckbDoubleWidthMode.checked = !ckbDoubleWidthMode.checked;
		cancelNextKeyPress = true;
		return false;
	}

	// let key events where control or metakey is pressed pass through
	if (e.ctrlKey || e.metaKey) {
		return true;
	}

	switch (key) {
		case 8: // Backspace
			if (inpComposeInput.value!="") {
				s=inpComposeInput.value;
				s=s.substr(0, s.length-1);
				inpComposeInput.value=s;
				
				ProcessInput(s);

				//TODO: how to cancel a Backspace KeyDown in Opera 7.x?
				cancelNextKeyPress = true;
				return false;
			}
			else {
				ProcessInput(s);
				return true;
			}
 
		case 9: // Tab
			SendString('　');
			cancelNextKeyPress = true;
			return false; 

		case 27: // Esc
			inpComposeInput.value="";
			ClearCandidatesList();
			FetchCandidatesList();

			// cancel ESC, it could cause things to get deleted
			cancelNextKeyPress = true;
			return false;

		case 33: // PageUp
		case 57383: // PageUp - Opera
			if (candidatesChinese.length>0) {
				if((candidatesOffset-10)>=0) {
					candidatesOffset-=10;
				}
				FetchCandidatesList();
				RedrawCandidatesList();
				
				cancelNextKeyPress = true;
				return false;
			}
			else {
				// let it pass through unprocessed in the next keypress events
				passNextKeyPress = true;
			}
			return true;
		
		case 34: // PageDown
		case 57384: // PageDown - Opera
			if (candidatesChinese.length>0) {
				if((candidatesOffset+10)<findSize) {
					candidatesOffset+=10;
				}
				FetchCandidatesList();
				RedrawCandidatesList();
				
				cancelNextKeyPress = true;
				return false;
			}
			else {
				// let it pass through unprocessed in the next keypress events
				passNextKeyPress = true;
			}
			return true;

		case 32: // Space
			if(candidatesChinese.length>0) {
				// send first candidate if space key is pressed and candidates are available
				SendCandidate(0);
				cancelNextKeyPress = true;
				return false;
			}
			else if (ckbDoubleWidthMode.checked || !ckbEnglishMode.checked) {
				// double width space
				SendString(String.fromCharCode(12288));
				return false;
			}
			return true;

		case 13: // Enter
			if (inpComposeInput.value!="") {
				if(ckbDoubleWidthMode.checked) {
					SendString(ToDoubleWidthLetter(inpComposeInput.value));
				}
				else {
					SendString(inpComposeInput.value);
				}
				  
				inpComposeInput.value="";
				
				ClearCandidatesList();
				RedrawCandidatesList();
				  
				cancelNextKeyPress = true;
				return false;
			}
			return true;

		case 122: // F11
		case 57355: // F11 - Opera
			ckbDoubleWidthMode.checked = !ckbDoubleWidthMode.checked;
			cancelNextKeyPress = true;
			return false;

		case 123: // F12
		case 57356: // F12 - Opera
			ckbEnglishMode.checked = !ckbEnglishMode.checked;
			cancelNextKeyPress = true;
			return false;

		case 36: // home
		case 35: // end
		case 37: // left
		case 38: // up
		case 39: // right
		case 40: // down
		case 45: // insert
		case 46: // del
		case 91: // windows key
		case 112: // F1
		case 113: // F2
		case 114: // F3
		case 115: // F4
		case 116: // F5
		case 117: // F6
		case 118: // F7
		case 119: // F8
		case 120: // F9
		case 121: // F10
//		case 122: // F11
//		case 123: // F12
			// let these keys pass through unprocessed in the next keypress events
			passNextKeyPress = true;
			break;
	}

	return true;
}

// handle keypress events
function ImeKeyPress(e) {
	// get key code
	var key = e.which ? e.which : e.keyCode;

	// pass keypress without processing it
	if(passNextKeyPress) {
		return true;
	}

	// cancel keypress if 'cancelNextKeyPress' is set and browser is not IE (IE keys are cancelled in keydown)
	// Gecko can only cancel keys in OnKeyPress
	if (browser>1 && browser!=4) {
		if (cancelNextKeyPress) {
			cancelNextKeyPress = false;
			return false;
		}
	}

	// let key events where control or metakey is pressed pass through
	if (e.ctrlKey || e.metaKey) {
		return true;
	}

	// numbers
	if (key>=48 && key<=57) {
		 // number keys
		if (inpComposeInput.value=="") {
			// no candidates available, send a double width number
			if (ckbDoubleWidthMode.checked || !ckbEnglishMode.checked) {
				SendString(String.fromCharCode(key - 48 + 65296));
				return false;
			}
		}
		else {
			// send a candidate
			if (!ckbEnglishMode.checked) {
				SendCandidate( key==48 ? 9 : (key-49) );

				ClearCandidatesList();
				RedrawCandidatesList();

				return false;
			}
		}
	}

	if (key==46) {
		// double width '.'
		if (ckbDoubleWidthMode.checked || !ckbEnglishMode.checked) {
			SendString(String.fromCharCode(12290));
			return false;
		}
	}
	else if(key==96) {
		// double width '`'
		if (ckbDoubleWidthMode.checked || !ckbEnglishMode.checked) {
			SendString(String.fromCharCode(65344));
			return false;
		}
	}
	else if ((key>=33 && key<=47) || (key>=58 && key<=63) || (key>=91 && key<=95) || (key>=123 && key<=126)) {
		// double width punctuation and marks
		if (ckbDoubleWidthMode.checked || !ckbEnglishMode.checked) {
			SendString(String.fromCharCode(key + 65248));
			return false;
		}		
	}

	if ( key>=65 && key<=90 ) {
		// A-Z
		if (ckbDoubleWidthMode.checked) {
			// double width A-Z
			SendString(String.fromCharCode(key + 65248));
			return false;
		}
	}

	if (key>=97 && key<=122) {
		// a-z
		if (ckbEnglishMode.checked) {
			// english mode
			if (ckbDoubleWidthMode.checked) {
				// double width A-Z
				SendString(String.fromCharCode(key + 65248));
				return false;
			}
		}
		else {
			// chinese mode
			s=inpComposeInput.value;
			if (s.length<imeMaxLength) {
				inpComposeInput.value+=String.fromCharCode(key);
				ProcessInput(inpComposeInput.value);
			}
			return false;
		}
	}

	return true;
}

// handle keyup events
function ImeKeyUp(e) {
	passNextKeyPress=false;

//	// get key code
//	var key = e.which ? e.which : e.keyCode;

	return true;
}

// select all text in the textarea
function SelectAll() {
	switch(browser) {
		case 1:
			txbInputArea.select();
			txbInputArea.focus();
			window.clipboardData.setData('Text', txbInputArea.value);
			break;
		default:
			txbInputArea.select();
			txbInputArea.focus();
			break;
	}
}

// clear the textarea
function ClearAll() {
	txbInputArea.value='';
	ClearCandidatesList();
	RedrawCandidatesList();
	focusInput();
}

// handle the body onload event
function BodyOnLoad() {
	if(navigator.userAgent.indexOf('AppleWebKit') != -1) {
		browser=4; // Safari
	}
	else if(navigator.userAgent.indexOf('Opera') != -1) {
		browser=3; // Opera
	}
	else if(navigator.userAgent.indexOf('Gecko') != -1) {
		browser=2; // Netscape
	}
	else if(navigator.userAgent.indexOf('MSIE') != -1) {
		browser=1; // IE
		// IE allows copy to clipboard, change button text:
		document.getElementById("ButtonSelectAll").innerHTML="Select &amp; Copy";
	}
	else {
		browser=5; // Unknown browser, hope it 'just works™' ;)
	}

	// fetch HTML elements  
	txbInputArea = document.getElementById("InputArea");
	inpComposeInput = document.getElementById("Comp");
	inpComposeInput.onfocus = focusInput;
	lblCandidates = document.getElementById("Cand");
	ckbEnglishMode = document.getElementById("EnglishMode");
	ckbEnglishMode.onfocus = focusInput;
	//ckbDoubleWidthMode = document.getElementById("DoubleWidth");
	//ckbDoubleWidthMode.onfocus = focusInput;
	lblPageIndicator = document.getElementById("PageIndicator");
	lblLinks = document.getElementById("Links");

	// set title
	if(imeName!="") {
		document.title=document.title+" - "+imeName;
	}

//	bodyElement = document.getElementById("body");
//	bodyElement.onfocus = focusInput;

	layoutTableElement = document.getElementById("layoutTable");
	layoutTableElement.onfocus = focusInput;

	layoutTableInputCellElement = document.getElementById("layoutTableInputCell");
	layoutTableInputCellElement.onfocus = focusInput;

	// check if IME has English defs
	if(ime.indexOf("_eng_") >= 0) {
		initialWindowWidth=initialWindowWidthEng;
		initialWindowHeight=initialWindowHeightEng;
		largeWindowWidth=largeWindowWidthEng;
		largeWindowHeight=largeWindowHeightEng;
	}
	else {
		initialWindowWidth=initialWindowWidthStd;
		initialWindowHeight=initialWindowHeightStd;
		largeWindowWidth=largeWindowWidthStd;
		largeWindowHeight=largeWindowHeightStd;
	}
	top.resizeTo(initialWindowWidth,initialWindowHeight);

	// copy inital inputarea size from HTML
	initialInputAreaRows=txbInputArea.rows;
	initialInputAreaCols=txbInputArea.cols;

	// make sure the input area is focussed
	focusInput();
}

function focusInput() {
	txbInputArea.focus();
}

function changeSize(btn) {
	if(imeSize == 0) {
		imeSize = 1;
		top.resizeTo(largeWindowWidth,largeWindowHeight);
		txbInputArea.rows=15;
		txbInputArea.cols=56;
		btn.innerHTML = 'Small size';
	}
	else {
		imeSize = 0;
		top.resizeTo(initialWindowWidth,initialWindowHeight);
		txbInputArea.rows=initialInputAreaRows;
		txbInputArea.cols=initialInputAreaCols;
		btn.innerHTML = 'Large size';
	}
}
