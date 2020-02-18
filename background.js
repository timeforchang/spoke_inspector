var urlRegex = /^https?:\/\/text\.berniesanders\.com\/app\/1\/todos/;

var initials_form = '<span style="display: flex; flex-flow: row wrap; \
place-content: center; align-items: center; position: absolute; \
top: 20px; right: 20px; font-weight: 500; font-size: 12px; width: 20px; \
height: 20px; border-radius: 50%; background-color: rgb(83, 180, 119); \
color: rgb(255, 255, 255); padding: 4px 2px 0px; text-align: center; \
vertical-align: middle; -webkit-box-orient: horizontal; -webkit-box-direction: normal; \
-webkit-box-pack: center; -webkit-box-align: center;">';

var replies_form = '<span style="display: flex; flex-flow: row wrap; \
place-content: center; align-items: center; position: absolute; \
top: 20px; right: 20px; font-weight: 500; font-size: 12px; width: 20px; \
height: 20px; border-radius: 50%; background-color: rgb(255, 102, 0); \
color: rgb(255, 255, 255); padding: 4px 2px 0px; text-align: center; \
vertical-align: middle; -webkit-box-orient: horizontal; -webkit-box-direction: normal; \
-webkit-box-pack: center; -webkit-box-align: center;">';

var past_skipped_form = '<span style="display: flex; flex-flow: row wrap; \
place-content: center; align-items: center; position: absolute; top: 20px; \
right: 20px; font-weight: 500; font-size: 12px; width: 20px; height: 20px; \
border-radius: 50%; background-color: rgb(255, 215, 0); color: rgb(255, 255, 255); \
padding: 4px 2px 0px; text-align: center; vertical-align: middle; \
-webkit-box-orient: horizontal; -webkit-box-direction: normal; \
-webkit-box-pack: center; -webkit-box-align: center;">';

// A function to use as callback
function doStuffWithDom(domContent) {
    // console.log('I received the following DOM content:\n' + domContent);
    if (domContent.indexOf('Request More Texts') !== -1) {
    	console.log("texts are available");
    	chrome.browserAction.setIcon({path: "images/icons8-typing-16.png"});
    } else {
    	console.log("texts are not available");
    	chrome.browserAction.setIcon({path: "images/icons8-typing-16-grey.png"});
    }

    var past_skipped = domContent.split(past_skipped_form);
    past_skipped.shift();
    var past_total = 0;
    past_skipped.forEach(function(badge) {
    	past_total += parseInt(badge.split("<")[0]);
    });
    console.log("total past/skipped: " + past_total);

    var initials = domContent.split(initials_form);
    initials.shift();
    var initials_total = 0;
    initials.forEach(function(badge) {
    	initials_total += parseInt(badge.split("<")[0]);
    });
    console.log("total initials: " + initials_total);

    var replies = domContent.split(replies_form);
    replies.shift();
    var replies_total = 0;
    replies.forEach(function(badge) {
    	replies_total += parseInt(badge.split("<")[0]);
    });
    console.log("total replies: " + replies_total);

    if (replies_total == 0 && initials_total == 0 && past_total > 0) {
    	chrome.browserAction.setBadgeBackgroundColor({color: "#ffd700"});
    	chrome.browserAction.setBadgeText({text: past_total.toString()});
    } else if (replies_total == 0 && initials_total > 0) {
    	chrome.browserAction.setBadgeBackgroundColor({color: "#53b477"});
    	chrome.browserAction.setBadgeText({text: initials_total.toString()});
    } else if (replies_total > 0) {
    	chrome.browserAction.setBadgeBackgroundColor({color: "#ff6600"});
    	chrome.browserAction.setBadgeText({text: replies_total.toString()});
    } else {
    	chrome.browserAction.setBadgeText({text: ''});
    }
}

chrome.storage.local.set({'spoke_tab': "default"});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.content)
      	doStuffWithDom(request.content);
});

function check_tabs() {
	chrome.windows.getAll({populate:true}, function(windows) {
		var found = false;
		windows.forEach(function(window) {
			window.tabs.forEach(function(tab) {
				// collect all of the urls here, I will just log them instead
				if (urlRegex.test(tab.url)) {
					chrome.storage.local.set({'spoke_tab': tab});
					chrome.tabs.executeScript(tab.id, {file: 'contentScript.js'});
				    found = true;
				} 
			});
		});
		if (!found) {
			console.log("texts are not available");
			chrome.browserAction.setIcon({path: "images/icons8-typing-16-grey.png"});
			chrome.browserAction.setBadgeText({text: ''});
		}
	});
}

function inspect_spoke(tabId, changeInfo, tab) {
	// collect all of the urls here, I will just log them instead
	if (urlRegex.test(tab.url)) {
		chrome.storage.local.set({'spoke_tab': tab});
		chrome.tabs.executeScript(tabId, {file: 'contentScript.js'});
	} 
}

function inspect_created(tab) {
	// collect all of the urls here, I will just log them instead
	if (urlRegex.test(tab.url)) {
		console.log("Spoke created");
		chrome.storage.local.set({'spoke_tab': tab});
		chrome.tabs.executeScript(tab.id, {file: 'contentScript.js'});
	} 
}

function inspect_removed(tabId, removeInfo) {
	// collect all of the urls here, I will just log them instead
	chrome.storage.local.get({'spoke_tab': "default"}, function(data) {
	  	if (data.spoke_tab != "default" && data.spoke_tab.id == tabId) {
			console.log("tab valid")
			chrome.storage.local.set({'spoke_tab': "default"});
			console.log("Spoke removed");
			chrome.browserAction.setIcon({path: "images/icons8-typing-16-grey.png"});
			chrome.browserAction.setBadgeText({text: ''});
		} 
	});
}

function handle_click() {
	chrome.storage.local.get({'spoke_tab': "default"}, function(data) {
	  	if (data.spoke_tab != "default") {
			console.log("tab valid")
			chrome.tabs.get(data.spoke_tab.id, function(tab) {
				chrome.windows.update(data.spoke_tab.windowId, {focused: true});
				chrome.tabs.update(data.spoke_tab.id, {selected: true});
			});
		} else {
			var newURL = "https://text.berniesanders.com/app/1/todos";
	  		chrome.tabs.create({ url: newURL });
		}
	});
}

chrome.tabs.onCreated.addListener(inspect_created);
chrome.tabs.onUpdated.addListener(inspect_spoke);
chrome.tabs.onRemoved.addListener(inspect_removed);
chrome.runtime.onInstalled.addListener(check_tabs);

chrome.browserAction.onClicked.addListener(handle_click);