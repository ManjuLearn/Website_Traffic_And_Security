let chart;

document.getElementById('togglePanel').addEventListener('click', togglePanel);
document.addEventListener('DOMContentLoaded', () => {
  updateStats();
  document.getElementById('clearStats').addEventListener('click', clearStats);
  document.getElementById('typeFilter').addEventListener('change', updateStats);
  document.getElementById('viewCookies').addEventListener('click', toggleCookieInfo);
  document.getElementById('lightTheme').addEventListener('click', () => setTheme('light'));
  document.getElementById('darkTheme').addEventListener('click', () => setTheme('dark'));
  document.getElementById('autoTheme').addEventListener('click', () => setTheme('auto'));

  // Listen for real-time updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateStats") {
      updateStats();
    }
  });

  // Set initial theme
  setTheme(localStorage.getItem('theme') || 'auto');
});

function setTheme(theme) {
  localStorage.setItem('theme', theme);
  if (theme === 'auto') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  } else if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

function updateStats() {
  chrome.storage.local.get({ requests: [], domainStats: {} }, (result) => {
    const typeFilter = document.getElementById('typeFilter').value;
    const filteredRequests = typeFilter === 'all' ? result.requests : result.requests.filter(req => req.type === typeFilter);

    const totalRequests = filteredRequests.length;
    const avgResponseTime = filteredRequests.reduce((sum, req) => sum + req.duration, 0) / totalRequests || 0;
    const totalData = filteredRequests.reduce((sum, req) => sum + parseInt(req.size), 0) / 1024; // Convert to KB

    document.getElementById('totalRequests').textContent = totalRequests;
    document.getElementById('avgResponseTime').textContent = avgResponseTime.toFixed(2);
    document.getElementById('totalData').textContent = totalData.toFixed(2);

    updateChart(filteredRequests);
    updateDomainStats(result.domainStats);
  });
}

function updateChart(requests) {
  // ... (same as in popup.js)
}

function updateDomainStats(domainStats) {
  // ... (same as in popup.js)
}

function clearStats() {
  // ... (same as in popup.js)
}

function toggleCookieInfo() {
  const cookieInfo = document.getElementById('cookieInfo');
  if (cookieInfo.style.display === 'none') {
    cookieInfo.style.display = 'block';
    updateCookieInfo();
  } else {
    cookieInfo.style.display = 'none';
  }
}

function updateCookieInfo() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab) {
      chrome.cookies.getAll({url: currentTab.url}, function(cookies) {
        const cookieList = document.getElementById('cookieList');
        cookieList.innerHTML = '';
        if (cookies.length > 0) {
          cookies.forEach(cookie => {
            const cookieItem = document.createElement('div');
            cookieItem.className = 'cookie-item';
            cookieItem.innerHTML = `
              <strong>${cookie.name}</strong>: ${cookie.value}<br>
              Domain: ${cookie.domain}<br>
              Expires: ${new Date(cookie.expirationDate * 1000).toLocaleString()}<br>
              Secure: ${cookie.secure ? 'Yes' : 'No'}, HttpOnly: ${cookie.httpOnly ? 'Yes' : 'No'}<br>
              SameSite: ${cookie.sameSite}<br>
              Priority: ${cookie.priority}
            `;
            cookieList.appendChild(cookieItem);
          });
        } else {
          cookieList.innerHTML = '<p>No cookies found for this site.</p>';
        }
      });
    }
  });
}


function togglePanel() {
  chrome.runtime.sendMessage({action: "togglePanel"}, function(response) {
    if (response.success) {
      window.close(); // Close the current window (popup or side panel)
    }
  });
}