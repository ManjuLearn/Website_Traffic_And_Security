let chart;

document.getElementById('togglePanel').addEventListener('click', togglePanel);
document.addEventListener('DOMContentLoaded', () => {
  updateStats();
  document.getElementById('clearStats').addEventListener('click', clearStats);
  document.getElementById('typeFilter').addEventListener('change', updateStats);
  document.getElementById('viewCookies').addEventListener('click', toggleCookieInfo);//+

  // Listen for real-time updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateStats") {
      updateStats();
    }
  });
});

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
  const ctx = document.getElementById('requestChart').getContext('2d');
  const requestTypes = {};

  requests.forEach(req => {
    requestTypes[req.type] = (requestTypes[req.type] || 0) + 1;
  });

  const data = {
    labels: Object.keys(requestTypes),
    datasets: [{
      data: Object.values(requestTypes),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ]
    }]
  };

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Request Types'
        }
      }
    }
  });
}

function updateDomainStats(domainStats) {
  const domainStatsDiv = document.getElementById('domainStats');
  domainStatsDiv.innerHTML = '';

  for (const [domain, stats] of Object.entries(domainStats)) {
    const domainDiv = document.createElement('div');
    domainDiv.className = 'domain-stat';
    domainDiv.innerHTML = `
      <h3>${domain}</h3>
      <p>Requests: ${stats.count}</p>
      <p>Avg Response Time: ${(stats.totalDuration / stats.count).toFixed(2)} ms</p>
      <p>Total Data: ${(stats.totalSize / 1024).toFixed(2)} KB</p>
    `;
    domainStatsDiv.appendChild(domainDiv);
  }
}

function clearStats() {
  chrome.storage.local.set({ requests: [], domainStats: {} }, () => {
    updateStats();
  });
}

function toggleCookieInfo() {//+
  const cookieInfo = document.getElementById('cookieInfo');//+
  if (cookieInfo.style.display === 'none') {//+
    cookieInfo.style.display = 'block';//+
    updateCookieInfo();//+
  } else {//+
    cookieInfo.style.display = 'none';//+
  }//+
}//+
//+
function updateCookieInfo() {//+
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {//+
    const currentTab = tabs[0];//+
    if (currentTab) {//+
      chrome.cookies.getAll({url: currentTab.url}, function(cookies) {//+
        const cookieList = document.getElementById('cookieList');//+
        cookieList.innerHTML = '';//+
        if (cookies.length > 0) {//+
          cookies.forEach(cookie => {//+
            const cookieItem = document.createElement('div');//+
            cookieItem.className = 'cookie-item';//+
            cookieItem.innerHTML = `//+
              <strong>${cookie.name}</strong>: ${cookie.value}<br>//+
              Domain: ${cookie.domain}<br>//+
              Expires: ${new Date(cookie.expirationDate * 1000).toLocaleString()}<br>//+
              Secure: ${cookie.secure ? 'Yes' : 'No'}, HttpOnly: ${cookie.httpOnly ? 'Yes' : 'No'}//+
            `;//+
            cookieList.appendChild(cookieItem);//+
          });//+
        } else {//+
          cookieList.innerHTML = '<p>No cookies found for this site.</p>';//+
        }//+
      });//+
    }//+
  });
// {"source":"chat"}
}

// Add this near the top of your DOMContentLoaded event listener
document.getElementById('togglePanel').addEventListener('click', togglePanel);

// ... rest of your existing code ...

// Add this function at the end of the file
function togglePanel() {
  chrome.runtime.sendMessage({action: "togglePanel"}, function(response) {
    if (response.success) {
      window.close(); // Close the current window (popup or side panel)
    }
  });
}