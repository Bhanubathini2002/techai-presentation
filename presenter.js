// Build Lab Presenter Mode
// Simple keyboard navigation and presenter functionality

(function() {
  'use strict';

  const deck = document.querySelector('.deck');
  if (!deck) return;

  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  let currentSlide = 0;
  let presenterWindow = null;

  // Initialize slide numbers
  slides.forEach((slide, index) => {
    const numberEl = slide.querySelector('.slide-number');
    if (numberEl) {
      numberEl.setAttribute('data-current', index + 1);
      numberEl.setAttribute('data-total', totalSlides);
    }
  });

  // Show specific slide
  function showSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    currentSlide = index;

    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('is-active');
        slide.style.opacity = '1';
      } else {
        slide.classList.remove('is-active');
        slide.style.opacity = '0';
      }
    });

    updatePresenterWindow();

    // Keep ?slide=N in sync so any slide is deep-linkable
    if (previewIndexParam() === null) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('slide', index + 1);
        history.replaceState(null, '', url);
      } catch (e) {
        // file:// origins may block replaceState — deep links still work on load
      }
    }
  }

  // Update presenter window if open
  function updatePresenterWindow() {
    if (!presenterWindow || presenterWindow.closed) return;

    const currentNotes = slides[currentSlide].querySelector('.notes');
    const nextNotes = slides[currentSlide + 1]?.querySelector('.notes');

    presenterWindow.postMessage({
      type: 'slide-change',
      current: currentSlide + 1,
      total: totalSlides,
      notes: currentNotes ? currentNotes.innerHTML : '',
      nextNotes: nextNotes ? nextNotes.innerHTML : ''
    }, '*');
  }

  // Open presenter mode
  function openPresenterMode() {
    if (presenterWindow && !presenterWindow.closed) {
      presenterWindow.focus();
      return;
    }

    const deckUrl = window.location.href.split('?')[0];
    presenterWindow = window.open('', 'PresenterMode', 'width=1200,height=800');
    presenterWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Presenter Mode - Build Lab</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #faf9f6; }
    .presenter-container { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 200px; height: 100vh; gap: 1rem; padding: 1rem; }
    .current-slide { background: #fffdf8; border-radius: 8px; padding: 2rem; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    .next-slide { background: #fffdf8; border-radius: 8px; padding: 2rem; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    .notes { grid-column: 1 / -1; background: #edfaf9; border-radius: 8px; padding: 1.5rem; overflow-y: auto; font-size: 1rem; line-height: 1.6; }
    .slide-info { position: fixed; top: 1rem; right: 1rem; font-family: 'IBM Plex Mono', 'SF Mono', monospace; font-size: 0.875rem; color: #6b6b6b; }
    .timer { position: fixed; top: 1rem; left: 1rem; font-family: 'IBM Plex Mono', 'SF Mono', monospace; font-size: 1.5rem; font-weight: 600; }
    .timer.warning { color: #b07a1f; }
    .timer.danger { color: #c44d1c; }
  </style>
</head>
<body>
  <div class="timer" id="timer">00:00</div>
  <div class="slide-info" id="slideInfo">1 / ${totalSlides}</div>
  <div class="presenter-container">
    <div class="current-slide" id="currentSlide">
      <iframe src="" style="width: 100%; height: 100%; border: none;"></iframe>
    </div>
    <div class="next-slide" id="nextSlide">
      <iframe src="" style="width: 100%; height: 100%; border: none;"></iframe>
    </div>
    <div class="notes" id="notes"></div>
  </div>
  <script>
    const deckUrl = ${JSON.stringify(deckUrl)};
    let seconds = 0;
    setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      const timer = document.getElementById('timer');
      timer.textContent = mins + ':' + secs;
      if (seconds > 3600) timer.classList.add('danger');
      else if (seconds > 2700) timer.classList.add('warning');
    }, 1000);

    window.addEventListener('message', (e) => {
      if (e.data.type === 'slide-change') {
        document.getElementById('slideInfo').textContent = e.data.current + ' / ' + e.data.total;
        document.getElementById('notes').innerHTML = e.data.notes || '<p style="color: #999;">No notes for this slide</p>';

        // Update current slide iframe
        const currentIframe = document.querySelector('#currentSlide iframe');
        if (currentIframe) {
          currentIframe.src = deckUrl + '?preview=' + (e.data.current - 1);
        }

        // Update next slide iframe
        const nextIframe = document.querySelector('#nextSlide iframe');
        if (nextIframe && e.data.current < e.data.total) {
          nextIframe.src = deckUrl + '?preview=' + e.data.current;
        } else {
          nextIframe.src = 'about:blank';
        }
      }
    });
  </script>
</body>
</html>
    `);
    presenterWindow.document.close();
    setTimeout(updatePresenterWindow, 100);
  }

  // Floating navigation buttons
  if (previewIndexParam() === null) {
    const baseStyle = [
      'position:fixed',
      'bottom:1.5rem',
      'z-index:1000',
      'padding:0.75rem 1.25rem',
      'font:600 0.95rem/1 "IBM Plex Mono","SF Mono",monospace',
      'color:#fffdf8',
      'background:#1a1a1a',
      'border:none',
      'border-radius:8px',
      'cursor:pointer',
      'box-shadow:0 4px 12px rgba(0,0,0,0.25)'
    ].join(';');

    const prevBtn = document.createElement('button');
    prevBtn.id = 'prevSlideBtn';
    prevBtn.type = 'button';
    prevBtn.textContent = '← Back';
    prevBtn.setAttribute('aria-label', 'Previous slide');
    prevBtn.style.cssText = baseStyle + ';right:8.5rem';
    prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
    document.body.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.id = 'nextSlideBtn';
    nextBtn.type = 'button';
    nextBtn.textContent = 'Next →';
    nextBtn.setAttribute('aria-label', 'Next slide');
    nextBtn.style.cssText = baseStyle + ';right:1.5rem';
    nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
    document.body.appendChild(nextBtn);
  }

  function previewIndexParam() {
    return new URLSearchParams(window.location.search).get('preview');
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Don't interfere if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch(e.key) {
      case 'ArrowRight':
      case ' ':
      case 'Enter':
        e.preventDefault();
        showSlide(currentSlide + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        showSlide(currentSlide - 1);
        break;
      case 'Home':
        e.preventDefault();
        showSlide(0);
        break;
      case 'End':
        e.preventDefault();
        showSlide(totalSlides - 1);
        break;
      case 's':
      case 'S':
        e.preventDefault();
        openPresenterMode();
        break;
    }
  });

  // Check for preview mode (for presenter window)
  const params = new URLSearchParams(window.location.search);
  const previewIndex = params.get('preview');
  const slideParam = params.get('slide');
  if (previewIndex !== null) {
    showSlide(parseInt(previewIndex));
    document.body.classList.add('presenter-preview');
  } else if (slideParam !== null) {
    // Deep link: 1-based, clamped to valid range
    const target = Math.min(Math.max(parseInt(slideParam, 10) || 1, 1), totalSlides);
    showSlide(target - 1);
  } else {
    // Initialize first slide
    showSlide(0);
  }

  console.log('Build Lab Presentation loaded');
  console.log('Controls: Arrow keys to navigate, S for presenter mode');
})();
