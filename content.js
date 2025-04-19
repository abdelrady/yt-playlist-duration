function parseDuration(durationText) {
  const parts = durationText.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else {
    return 0;
  }
}

function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs}h ${mins}m ${secs}s`;
}

function getAllDurations() {
  return Array.from(document.querySelectorAll(
    '#items.playlist-items #text.style-scope.ytd-thumbnail-overlay-time-status-renderer'
  )).map(el => parseDuration(el.textContent.trim()));
}

function getRemainingDurations() {
  const all = Array.from(document.querySelectorAll(
    '#secondary #items.playlist-items ytd-playlist-panel-video-renderer'
  ));

  const selectedIndex = all.findIndex(el =>
    el.matches('ytd-playlist-panel-video-renderer[selected]')
  );

  // Fallback: If selected not found, assume 0
  const remaining = selectedIndex >= 0 ? all.slice(selectedIndex) : [];

  return remaining.map(el => {
    const timeEl = el.querySelector('#text.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    return timeEl ? parseDuration(timeEl.textContent.trim()) : 0;
  });
}


function insertDurationAfterTitle() {
  const titleEl = document.querySelector('#secondary #playlist h3.ytd-playlist-panel-renderer');

  if (titleEl) {

    const totalSeconds = getAllDurations().reduce((a, b) => a + b, 0);
    console.log(`Total Duration: ${totalSeconds}`);
    const remainingSeconds = getRemainingDurations().reduce((a, b) => a + b, 0);
    console.log(`Remaining Duration: ${remainingSeconds}`);

    let totalSpan = document.querySelector('#playlist-duration-injected');
    if (!totalSpan) {
      const totalSpan = document.createElement('div');
      totalSpan.id = 'playlist-duration-injected';
      totalSpan.textContent = `Total: ${formatDuration(totalSeconds)}`;
      totalSpan.style.fontSize = '14px';
      totalSpan.style.color = '#909090';
      titleEl.appendChild(totalSpan);
    }
    else totalSpan.textContent = `Total: ${formatDuration(totalSeconds)}`;

    let remainingSpan = document.querySelector('#playlist-remaining-duration');
    if (!remainingSpan) {
      const remainingSpan = document.createElement('div');
      remainingSpan.id = 'playlist-remaining-duration';
      remainingSpan.textContent = `Remaining: ${formatDuration(remainingSeconds)}`;
      remainingSpan.style.fontSize = '14px';
      remainingSpan.style.color = 'orange';
      remainingSpan.style.marginTop = '4px';
      titleEl.appendChild(remainingSpan);
    }
    else remainingSpan.textContent = `Remaining: ${formatDuration(remainingSeconds)}`;
  }
}

function observePlaylistChanges() {
  const container = document.querySelector('#secondary #items.playlist-items');
  if (!container) return;

  const observer = new MutationObserver((mutationsList) => {
    let shouldUpdate = false;

    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
        shouldUpdate = true;
        break;
      }
    }

    if (shouldUpdate) {
      console.log('🔁 Playlist changed — recalculating durations');
      setTimeout(insertDurationAfterTitle, 500); // delay to let DOM settle
    }
  });

  observer.observe(container, {
    childList: true,
    subtree: false // only monitor direct children (the video items)
  });
}

// Wait for the page to load the title and video durations
const observer = new MutationObserver(() => {
  if (
    document.querySelectorAll('#items.playlist-items #text').length > 0
  ) {
    console.log('Playlist loaded');
    const interval = setInterval(() => {
      const videosLoaded = document.querySelectorAll(
        '#items.playlist-items #text'
      ).length > 0;

      if (videosLoaded) {
        insertDurationAfterTitle();
        observePlaylistChanges();
        clearInterval(interval);
      }
    }, 500); // Try every 0.5 seconds
    observer.disconnect(); // Done
  }
});

observer.observe(document, { childList: true, subtree: true });

let lastUrl = location.href;

new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log('🎯 URL changed to:', currentUrl);
    setTimeout(() => {
      insertDurationAfterTitle(); // re-inject your duration logic
    }, 1000); // wait for DOM to settle
  }
}).observe(document, { subtree: true, childList: true });