
let requests = {};
let domainStats = {};
let isSidePanel = false;

chrome.action.onClicked.addListener((tab) => {
  if (isSidePanel) {
    chrome.sidePanel.close({ tabId: tab.id });
    chrome.action.setPopup({ popup: "popup.html" });
    isSidePanel = false;
  } else {
    chrome.action.setPopup({ popup: "" });
    chrome.sidePanel.open({ tabId: tab.id });
    isSidePanel = true;
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId > 0) {
      requests[details.requestId] = { startTime: Date.now() };
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId > 0 && requests[details.requestId]) {
      const request = requests[details.requestId];
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      request.url = details.url;
      request.type = details.type;
      request.size = details.responseHeaders.find(h => h.name.toLowerCase() === "content-length")?.value || 0;

      updateDomainStats(request);

      chrome.storage.local.get({ requests: [] }, (result) => {
        result.requests.push(request);
        chrome.storage.local.set({ requests: result.requests, domainStats: domainStats });
      });

      delete requests[details.requestId];

      // Notify popup to update in real-time
      chrome.runtime.sendMessage({ action: "updateStats" });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

function updateDomainStats(request) {
  const domain = new URL(request.url).hostname;
  if (!domainStats[domain]) {
    domainStats[domain] = { count: 0, totalDuration: 0, totalSize: 0 };
  }
  domainStats[domain].count++;
  domainStats[domain].totalDuration += request.duration;
  domainStats[domain].totalSize += parseInt(request.size);
}

// Add this function to handle messages from popup.js or sidepanel.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "togglePanel") {
    isSidePanel = !isSidePanel;
    if (isSidePanel) {
      chrome.action.setPopup({ popup: "" });
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      });
    } else {
      chrome.action.setPopup({ popup: "popup.html" });
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.sidePanel.close({ tabId: tabs[0].id });
      });
    }
    sendResponse({success: true});
  }
});