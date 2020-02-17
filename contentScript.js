// Wrapping in a function to not leak/modify variables if the script
// was already inserted before.
(function() {
    if (window.hasRun === true)
        return true;  // Will ultimately be passed back to executeScript
    window.hasRun = true;
    // Select the node that will be observed for mutations
	const targetNode = document;

	// Options for the observer (which mutations to observe)
	const config = { childList: true, subtree: true };

	// do this once first
	chrome.runtime.sendMessage({content: document.all[0].outerHTML});

	// Callback function to execute when mutations are observed
	const callback = function(mutationsList, observer) {
	    // Use traditional 'for loops' for IE 11
	    for(let mutation of mutationsList) {
	        if (mutation.type === 'childList') {
	            console.log('A child node has been added or removed.');
	            chrome.runtime.sendMessage({content: document.all[0].outerHTML});
	        }
	    }
	};

	// Create an observer instance linked to the callback function
	const observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(targetNode, config);

	console.log("mutation observer activated");
    // No return value here, so the return value is "undefined" (without quotes).
})(); // <-- Invoke function. The return value is passed back to executeScript