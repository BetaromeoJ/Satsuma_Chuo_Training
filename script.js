// ============================================================
// 紫原小学校 ICT研修ポータル 共通スクリプト
// （薩摩中央高等学校版 main.js のロジックをそのまま流用。
//   機能・挙動は変更していません。SESSION_VIEW_IDSにsession0を
//   追加した点と、末尾のinitActionCards()のみ新規追加です）
//
// 構成:
//   1. initSplash()        … オープニング演出。濃いオレンジの幕が
//                              下から上へ流れて2秒程度で消える。
//                              sessionStorageを使い、同一セッション中は
//                              一度だけ表示する。
//   2. initMobileNav()     … 固定ヘッダーのハンバーガーメニュー開閉。
//   3. initBackToTop()     … 一定量スクロールしたら「トップへ戻る」ボタンを表示。
//   4. initCopyButtons()   … プロンプトのコピー機能＋「コピーしました」トースト。
//   5. initAccordions()    … 「よくある質問」「プロンプト集」などの開閉。
//   6. initSmoothAnchors() … ページ内リンクのスムーススクロール。
//   7. initSessionViews()  … SESSION 0〜5の全画面ビュー開閉＋幕演出。
//   8. initTapLift()       … ボタンをタップしたときの小さな浮き上がり演出。
//   9. initActionCards()   … 「明日からやること」選択カード（新規追加）。
// ============================================================

function initSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storageKey = 'mb-splash-shown:' + location.pathname;
  const alreadyShown = sessionStorage.getItem(storageKey) === '1';

  if (alreadyShown || prefersReducedMotion) {
    splash.remove();
    return;
  }

  sessionStorage.setItem(storageKey, '1');

  const closeSplash = () => {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 650);
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => splash.classList.add('show'));
  });

  // 演出は2秒程度で終わり、操作を妨げない（濃いオレンジの幕が下から上へ流れて消える）
  setTimeout(closeSplash, 2000);
}

function initMobileNav() {
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('mobileNav');
  const overlay = document.getElementById('navOverlay');
  const closeBtn = document.getElementById('navCloseBtn');
  if (!menuBtn || !nav || !overlay) return;

  const openNav = () => {
    nav.classList.add('open');
    overlay.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
  };
  const closeNav = () => {
    nav.classList.remove('open');
    overlay.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  };

  menuBtn.addEventListener('click', () => {
    const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
    expanded ? closeNav() : openNav();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  overlay.addEventListener('click', closeNav);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
}

function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  const toggle = () => {
    if (window.scrollY > 480) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  };
  window.addEventListener('scroll', toggle, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  toggle();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const label = toast.querySelector('.toast-label');
  if (label) label.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2000);
}

function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    const targetSel = btn.getAttribute('data-copy-target');
    const source = targetSel ? document.querySelector(targetSel) : null;
    if (!source) return;

    const defaultLabel = btn.querySelector('.copy-label');
    const originalText = defaultLabel ? defaultLabel.textContent : '';
    const liveRegion = document.getElementById('copy-announcer');

    btn.addEventListener('click', () => {
      const text = source.innerText || source.textContent || '';

      const onSuccess = () => {
        btn.classList.add('copied');
        if (defaultLabel) defaultLabel.textContent = 'コピーしました';
        if (liveRegion) liveRegion.textContent = 'プロンプトをコピーしました';
        showToast('コピーしました');
        setTimeout(() => {
          btn.classList.remove('copied');
          if (defaultLabel) defaultLabel.textContent = originalText;
        }, 2000);
      };

      const fallbackCopy = () => {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          onSuccess();
        } catch (err) {
          if (liveRegion) liveRegion.textContent = 'コピーに失敗しました。テキストを選択して手動でコピーしてください。';
        }
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  });
}

function initAccordions() {
  document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const panelId = trigger.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.classList.toggle('open', !expanded);
    });
  });
}

// SESSION 0〜5は「全画面ビュー」として扱うため、通常のスムーススクロール対象から除外する
const SESSION_VIEW_IDS = ['session0', 'session1', 'session2', 'session3', 'session4', 'session5'];

function initSmoothAnchors() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const targetId = link.getAttribute('href').slice(1);
    if (SESSION_VIEW_IDS.includes(targetId)) return;
    link.addEventListener('click', (e) => {
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}

// SESSIONの全画面ビュー：メニューやボタンのリンク（href="#session0"等）をクリックすると、
// そのSESSIONだけを全画面表示する。入場時は幕（カーテン）が下から上へ流れて消える演出を行う。
function initSessionViews() {
  const views = document.querySelectorAll('.session-view');
  if (!views.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const openView = (id) => {
    const view = document.getElementById(id + '-view');
    if (!view) return;

    // 別のSESSIONが開いている場合は先に閉じる（「次のSESSIONへ」リンクで一度に1つだけ表示するため）
    document.querySelectorAll('.session-view.open').forEach((openViewEl) => {
      if (openViewEl !== view) closeView(openViewEl);
    });

    document.body.classList.add('session-view-open');
    view.classList.add('open');
    view.scrollTop = 0;

    const curtain = view.querySelector('.session-curtain');
    if (curtain) {
      if (prefersReducedMotion) {
        curtain.classList.add('hide');
      } else {
        curtain.classList.remove('hide', 'show');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => curtain.classList.add('show'));
        });
        clearTimeout(curtain._hideTimer);
        curtain._hideTimer = setTimeout(() => curtain.classList.add('hide'), 850);
      }
    }

    view.setAttribute('tabindex', '-1');
    view.focus({ preventScroll: true });
  };

  const closeView = (view) => {
    view.classList.remove('open');
    document.body.classList.remove('session-view-open');
    const curtain = view.querySelector('.session-curtain');
    if (curtain) {
      clearTimeout(curtain._hideTimer);
      curtain.classList.remove('show', 'hide');
    }
  };

  // href="#session0"〜"#session5" を持つリンクはすべて全画面ビューを開くトリガーにする
  const sessionLinkSelector = SESSION_VIEW_IDS.map((id) => `a[href="#${id}"]`).join(', ');
  document.querySelectorAll(sessionLinkSelector).forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const view = document.getElementById(id + '-view');
      if (!view) return;
      e.preventDefault();
      openView(id);
    });
  });

  views.forEach((view) => {
    view.querySelectorAll('.session-close-btn').forEach((btn) => {
      btn.addEventListener('click', () => closeView(view));
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.session-view.open').forEach(closeView);
    }
  });
}

function initTapLift() {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.classList.add('lift');
      setTimeout(() => btn.classList.remove('lift'), 260);
    });
  });
}

// ------------------------------------------------------------
// 「明日からやること」選択カード（新規追加）
// チェックした項目の数だけ、下に短いメッセージを表示する。
// サーバーへの送信や保存は行わない、その場だけの簡単な仕掛け。
// ------------------------------------------------------------
function initActionCards() {
  document.querySelectorAll('.action-list').forEach((list) => {
    const summary = list.parentElement ? list.parentElement.querySelector('.action-summary') : null;
    const checkboxes = list.querySelectorAll('input[type="checkbox"]');
    if (!checkboxes.length) return;

    const update = () => {
      const checkedCount = list.querySelectorAll('input[type="checkbox"]:checked').length;
      if (!summary) return;
      if (checkedCount === 0) {
        summary.textContent = '';
      } else {
        summary.textContent = `${checkedCount}つ選びました。明日、実際にやってみましょう。`;
      }
    };

    checkboxes.forEach((cb) => cb.addEventListener('change', update));
    update();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSplash();
  initMobileNav();
  initBackToTop();
  initCopyButtons();
  initAccordions();
  initSessionViews();
  initSmoothAnchors();
  initTapLift();
  initActionCards();
});
