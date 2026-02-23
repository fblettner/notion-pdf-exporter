(function () {
  'use strict';

  // ── Export logic ─────────────────────────────────────────────────────────

  function scrollToLoadAll() {
    return new Promise((resolve) => {
      const scroller =
        document.querySelector('.notion-scroller.vertical') ||
        document.querySelector('.notion-frame') ||
        document.documentElement;
      const totalHeight = Math.max(scroller.scrollHeight, document.body.scrollHeight);
      let pos = 0;
      const timer = setInterval(() => {
        pos += 800;
        scroller.scrollTop = pos;
        window.scrollTo(0, pos);
        if (pos >= totalHeight) { clearInterval(timer); resolve(); }
      }, 60);
    });
  }

  function injectAndPrint() {
    document.getElementById('notion-pdf-style')?.remove();
    const dividerSelectors = new Set([
      '.notion-divider-block',
      '[data-block-type="divider"]',
    ]);
    document.querySelectorAll('[class*="divider"]').forEach(el => {
      Array.from(el.classList).filter(c => /divider/i.test(c))
        .forEach(c => dividerSelectors.add('.' + CSS.escape(c)));
    });
    document.querySelectorAll('[data-block-id]').forEach(el => {
      if (el.querySelector('hr'))
        Array.from(el.classList).forEach(c => dividerSelectors.add('.' + CSS.escape(c)));
    });
    let divSel = [...dividerSelectors].map(s => s.trim()).filter(Boolean).join(', ');
    try { document.querySelectorAll(divSel); }
    catch (e) { divSel = '.notion-divider-block, [data-block-type="divider"]'; }

    const style = document.createElement('style');
    style.id = 'notion-pdf-style';
    style.textContent = `
      @media print {
        html, body, .notion-app-inner, .notion-frame,
        .notion-scroller, .notion-scroller.vertical,
        .notion-page-content, .notion-page-content-inner {
          height: auto !important; max-height: none !important;
          overflow: visible !important; transform: none !important;
          will-change: auto !important; contain: none !important;
        }
        ${divSel} {
          page-break-after: always !important; break-after: page !important;
          border: none !important; background: none !important;
          height: 0 !important; overflow: hidden !important;
          margin: 0 !important; padding: 0 !important;
        }
        [class*="header-block"], h1, h2, h3 {
          page-break-after: avoid !important; break-after: avoid !important;
        }
        [class*="image-block"], [class*="callout"], [class*="quote"],
        [class*="code-block"], [class*="table-block"] {
          page-break-inside: avoid !important; break-inside: avoid !important;
        }
        [class*="code-block"] *, [class*="code-block"] pre,
        [class*="code-block"] code, [class*="code-block"] span {
          white-space: pre !important;
        }
        .notion-sidebar-container, [class*="sidebar"],
        .notion-topbar, [class*="topbar"],
        .notion-overlay-container, [class*="overlay"],
        [class*="dragHandle"], [class*="drag-handle"],
        #notion-pdf-export-btn, #notion-pdf-dialog,
        nav, aside { display: none !important; }
        body, html { width: 100% !important; margin: 0 !important; padding: 0 !important; }
        .notion-frame, [class*="notionFrame"] {
          width: 100% !important; max-width: 100% !important;
          margin-left: 0 !important; padding-left: 0 !important;
        }
        .notion-scroller, .notion-scroller.vertical {
          width: 100% !important; max-width: 100% !important;
          padding-left: 0 !important; padding-right: 0 !important; margin-left: 0 !important;
        }
        .notion-page-content, .notion-page-content-inner {
          width: 100% !important; max-width: 100% !important;
          padding-left: 0 !important; padding-right: 0 !important;
          margin-left: 0 !important; margin-right: 0 !important;
        }
        img { max-width: 100% !important; height: auto !important; }
      }
    `;
    document.head.appendChild(style);
    setTimeout(() => window.print(), 400);
  }

  async function runExport(statusEl) {
    statusEl.textContent = 'Scrolling to load all content…';
    await scrollToLoadAll();
    await new Promise(r => setTimeout(r, 1800));
    const s = document.querySelector('.notion-scroller.vertical') || document.documentElement;
    s.scrollTop = 0;
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 300));
    statusEl.textContent = 'Opening print dialog…';
    injectAndPrint();
  }

  // ── Dialog ───────────────────────────────────────────────────────────────

  function showDialog(anchorBtn) {
    // Remove existing dialog
    document.getElementById('notion-pdf-dialog')?.remove();

    const dialog = document.createElement('div');
    dialog.id = 'notion-pdf-dialog';
    dialog.style.cssText = `
      position: fixed;
      z-index: 9999;
      background: #fff;
      border: 1px solid rgba(55,53,47,0.16);
      border-radius: 8px;
      box-shadow: rgba(15,15,15,0.1) 0px 0px 0px 1px, rgba(15,15,15,0.2) 0px 3px 6px, rgba(15,15,15,0.4) 0px 9px 24px;
      padding: 16px;
      width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      color: inherit;
    `;

    // Position below the anchor button
    const rect = anchorBtn.getBoundingClientRect();
    dialog.style.top  = (rect.bottom + 8) + 'px';
    dialog.style.right = (window.innerWidth - rect.right) + 'px';

    dialog.innerHTML = `
      <!-- Header -->
      <div style="
        background: linear-gradient(135deg, #2f2f2f 0%, #1a1a1a 100%);
        margin: -16px -16px 14px -16px;
        padding: 18px 20px 14px;
        border-radius: 8px 8px 0 0;
        color: white;
      ">
        <div style="font-size:15px;font-weight:600;letter-spacing:-0.3px;display:flex;align-items:center;gap:8px;"><img src="data:image/png;base64,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" style="width:24px;height:24px;border-radius:50%;flex-shrink:0;"> Notion PDF Exporter</div>
        <div style="font-size:11px;opacity:0.6;margin-top:2px;">Page breaks at dividers — free &amp; open</div>
        <div style="
          display:inline-block;
          background:rgba(255,255,255,0.15);
          border:1px solid rgba(255,255,255,0.2);
          border-radius:20px;
          font-size:10px;
          padding:2px 8px;
          margin-top:6px;
        ">Free Forever</div>
      </div>

      <!-- Info box -->
      <div style="
        background:#f7f6f3;
        border:1px solid #e8e8e8;
        border-radius:8px;
        padding:11px 13px;
        font-size:12px;
        line-height:1.6;
        color:#555;
        margin-bottom:10px;
      ">
        <strong style="color:#1a1a1a;">How it works:</strong> Place <code style="background:rgba(135,131,120,0.15);border-radius:3px;padding:1px 4px;">---</code> divider blocks where you want page breaks. The extension scrolls to load all content, then opens the print dialog.
      </div>

      <!-- Warning box -->
      <div style="
        background:#fffbeb;
        border:1px solid #f0e0a0;
        border-radius:8px;
        padding:9px 13px;
        font-size:11.5px;
        line-height:1.5;
        color:#7a5c00;
        margin-bottom:14px;
      ">⏱️ Takes ~3s to scroll and load all content — this is normal.</div>

      <!-- Status -->
      <div id="notion-pdf-status" style="font-size:11.5px;color:#888;text-align:center;min-height:16px;margin-bottom:10px;"></div>

      <!-- Export button -->
      <button id="notion-pdf-confirm" style="
        width:100%;padding:11px 16px;
        background:#2f2f2f;color:#fff;
        border:none;border-radius:8px;
        font-size:13px;font-weight:600;
        cursor:pointer;transition:background 0.15s;
      "><img src="data:image/png;base64,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" style="width:16px;height:16px;border-radius:50%;margin-right:8px;vertical-align:middle;"> Export to PDF</button>

      <!-- Footer -->
      <div style="margin-top:12px;font-size:10.5px;color:#bbb;text-align:center;border-top:1px solid #f0f0f0;padding-top:10px;">
        Open source • Works with Notion dividers (—)
      </div>
    `;

    document.body.appendChild(dialog);

    const confirmBtn = dialog.querySelector('#notion-pdf-confirm');
    const statusEl   = dialog.querySelector('#notion-pdf-status');

    confirmBtn.addEventListener('mouseenter', () => confirmBtn.style.background = '#111');
    confirmBtn.addEventListener('mouseleave', () => confirmBtn.style.background = '#2f2f2f');

    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = '⏳ Loading…';
      confirmBtn.style.background = 'rgba(55,53,47,0.3)';
      await runExport(statusEl);
      // Close dialog after print triggered
      setTimeout(() => dialog.remove(), 3000);
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!dialog.contains(e.target) && e.target !== anchorBtn) {
          dialog.remove();
          document.removeEventListener('click', handler);
        }
      });
    }, 0);
  }

  // ── Inject button into Notion topbar ─────────────────────────────────────

  function createButton() {
    const btn = document.createElement('button');
    btn.id = 'notion-pdf-export-btn';
    btn.innerHTML = '<img src="data:image/png;base64,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" style="width:16px;height:16px;border-radius:50%;margin-right:6px;vertical-align:middle;flex-shrink:0;"> Export to PDF';
    btn.style.cssText = `
      display: inline-flex;
      align-items: center;
      height: 28px;
      padding: 0 10px;
      margin-right: 6px;
      border: none;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: inherit;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.15s;
    `;
    btn.addEventListener('mouseenter', () => btn.style.background = 'var(--notion-hover-background, rgba(55,53,47,0.08))');
    btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDialog(btn);
    });
    return btn;
  }

  function injectButton() {
    if (document.getElementById('notion-pdf-export-btn')) return;

    // Find the Share button — our button goes just before it.
    // Notion renders a button/div with text "Share" in the topbar.
    let shareBtn = null;
    document.querySelectorAll('[class*="topbar"] button, [class*="topbar"] [role="button"]').forEach(el => {
      if (el.textContent.trim().startsWith('Share') && !shareBtn) shareBtn = el;
    });

    if (!shareBtn) return;

    const btn = createButton();
    shareBtn.parentElement.insertBefore(btn, shareBtn);
  }

  function init() {
    injectButton();
    const observer = new MutationObserver(() => {
      if (!document.getElementById('notion-pdf-export-btn')) injectButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);

})();
