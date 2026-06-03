document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const btnExport = document.getElementById('btn-export');

  function setStatus(msg, type = '') {
    statusEl.textContent = msg;
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (e) {
    setStatus('❌ Cannot get tab: ' + e.message, 'error');
    return;
  }

  const isNotion = tab?.url && (
    tab.url.includes('app.notion.com') || tab.url.includes('notion.so') || tab.url.includes('notion.site')
  );

  document.getElementById('notion-view').style.display = isNotion ? 'block' : 'none';
  document.getElementById('not-notion-view').style.display = isNotion ? 'none' : 'block';
  if (!isNotion) return;

  btnExport.addEventListener('click', async () => {
    btnExport.disabled = true;
    btnExport.textContent = '⏳ Loading content...';
    setStatus('Scrolling to load all blocks...');

    try {
      // Step 1: scroll through entire page so Notion renders all virtualised blocks
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrollToLoadAll
      });

      await new Promise(r => setTimeout(r, 1800));

      // Step 2: scroll back to top
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const s = document.querySelector('.notion-scroller.vertical') || document.documentElement;
          s.scrollTop = 0;
          window.scrollTo(0, 0);
        }
      });

      await new Promise(r => setTimeout(r, 300));

      // Step 3: inject CSS + print
      setStatus('Injecting styles...');
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectAndPrint
      });

      const result = results?.[0]?.result;
      if (result?.error) {
        setStatus('❌ ' + result.error, 'error');
      } else {
        setStatus('✅ Print dialog opened! Choose "Save as PDF"', 'success');
      }
    } catch (e) {
      setStatus('❌ ' + e.message, 'error');
    }

    btnExport.disabled = false;
    btnExport.innerHTML = '🖨️ Export to PDF';
  });
});

// ── Scroll entire page so Notion's virtual renderer loads all blocks ──────────
function scrollToLoadAll() {
  return new Promise((resolve) => {
    const scroller =
      document.querySelector('.notion-scroller.vertical') ||
      document.querySelector('.notion-frame') ||
      document.documentElement;

    const totalHeight = Math.max(scroller.scrollHeight, document.body.scrollHeight);
    let pos = 0;
    const step = 800;
    const delay = 60;

    const timer = setInterval(() => {
      pos += step;
      scroller.scrollTop = pos;
      window.scrollTo(0, pos);
      if (pos >= totalHeight) {
        clearInterval(timer);
        resolve();
      }
    }, delay);
  });
}

// ── Inject @media print CSS and trigger window.print() ───────────────────────
function injectAndPrint() {
  try {
    document.getElementById('notion-pdf-style')?.remove();

    // Build divider selector — find class names actually present on this page
    const dividerSelectors = new Set([
      '.notion-divider-block',
      '[data-block-type="divider"]',
    ]);

    document.querySelectorAll('[class*="divider"]').forEach(el => {
      Array.from(el.classList)
        .filter(c => /divider/i.test(c))
        .forEach(c => dividerSelectors.add('.' + CSS.escape(c)));
    });

    document.querySelectorAll('[data-block-id]').forEach(el => {
      if (el.querySelector('hr')) {
        Array.from(el.classList).forEach(c => dividerSelectors.add('.' + CSS.escape(c)));
      }
    });

    let divSel = [...dividerSelectors].map(s => s.trim()).filter(s => s.length > 0).join(', ');
    try { document.querySelectorAll(divSel); }
    catch (e) { divSel = '.notion-divider-block, [data-block-type="divider"]'; }

    const style = document.createElement('style');
    style.id = 'notion-pdf-style';
    style.textContent = `
      @media print {

        /* ── Unlock scroll containers so page breaks work ── */
        html, body,
        .notion-app-inner,
        .notion-frame,
        .notion-scroller,
        .notion-scroller.vertical,
        .notion-page-content,
        .notion-page-content-inner {
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          transform: none !important;
          will-change: auto !important;
          contain: none !important;
        }

        /* ── Page breaks at dividers ── */
        ${divSel} {
          page-break-after: always !important;
          break-after: page !important;
          border: none !important;
          background: none !important;
          height: 0 !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* ── Keep headings with next content ── */
        [class*="header-block"], h1, h2, h3 {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }

        /* ── Avoid breaks inside atomic blocks ── */
        [class*="image-block"],
        [class*="callout"],
        [class*="quote"],
        [class*="code-block"],
        [class*="table-block"] {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* ── Preserve line breaks inside code blocks ── */
        [class*="code-block"] *,
        [class*="code-block"] pre,
        [class*="code-block"] code,
        [class*="code-block"] span {
          white-space: pre !important;
        }

        /* ── Hide Notion UI chrome ── */
        .notion-sidebar-container,
        [class*="sidebar"],
        .notion-topbar,
        [class*="topbar"],
        .notion-overlay-container,
        [class*="overlay"],
        [class*="dragHandle"],
        [class*="drag-handle"],
        nav, aside {
          display: none !important;
        }

        /* ── Full width layout ── */
        body, html {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .notion-frame,
        [class*="notionFrame"] {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
        }

        .notion-scroller,
        .notion-scroller.vertical {
          width: 100% !important;
          max-width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-left: 0 !important;
        }

        .notion-page-content,
        .notion-page-content-inner {
          width: 100% !important;
          max-width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        img { max-width: 100% !important; height: auto !important; }

      } /* end @media print */
    `;

    document.head.appendChild(style);
    setTimeout(() => window.print(), 400);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}
