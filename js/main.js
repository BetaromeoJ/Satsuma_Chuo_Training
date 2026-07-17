/* ============================================================
   鹿児島県立薩摩中央高等学校 教職員ICT研修サイト
   main.js
   ------------------------------------------------------------
   ・オープニング演出の終了処理
   ・スマートフォン用メニュー
   ・追従ナビゲーションの現在地ハイライト
   ・トップへ戻るボタン
   ・プロンプトのコピー機能
   ・FAQ／手順アコーディオン
   ・スクロール連動フェードイン
   ------------------------------------------------------------
   このファイルが読み込まれなくても、黒幕はCSSアニメーションだけで
   自動的に開くため、サイトの閲覧に支障は出ません。
   ============================================================ */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. オープニング演出の終了処理
     ---------------------------------------------------------- */
  function initCurtain() {
    var curtain = document.getElementById('curtain');
    if (!curtain) { return; }

    function finishIntro() {
      curtain.setAttribute('data-done', 'true');
      try {
        sessionStorage.setItem('ictIntroShown', '1');
      } catch (e) {
        /* sessionStorageが使用できない場合は何もしない */
      }
    }

    // 既に同じセッションで再生済みなら即終了扱いにする
    try {
      if (sessionStorage.getItem('ictIntroShown') === '1') {
        finishIntro();
        return;
      }
    } catch (e) { /* noop */ }

    curtain.addEventListener('animationend', function (evt) {
      // 黒幕本体のアニメーションが終わったタイミングで確定させる
      if (evt.target === curtain) {
        finishIntro();
      }
    });

    // 万一animationendが発火しない環境向けの保険（最大3秒で終了扱い）
    window.setTimeout(finishIntro, prefersReducedMotion ? 1200 : 3000);
  }

  /* ----------------------------------------------------------
     2. スマートフォン用メニュー（ハンバーガーメニュー）
     ---------------------------------------------------------- */
  function initMobileNav() {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('global-nav');
    if (!toggle || !nav) { return; }

    function closeNav() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    function openNav() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.contains('is-open');
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    // ナビ内のリンクをクリックしたらメニューを閉じる
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeNav();
      });
    });

    // 画面幅が広がったら開閉状態をリセット
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) {
        closeNav();
      }
    });

    // Escキーで閉じる
    document.addEventListener('keydown', function (evt) {
      if (evt.key === 'Escape') {
        closeNav();
      }
    });
  }

  /* ----------------------------------------------------------
     3. 現在地のナビハイライト（IntersectionObserver）
     ---------------------------------------------------------- */
  function initActiveNavHighlight() {
    var navLinks = document.querySelectorAll('[data-nav]');
    if (!navLinks.length || !('IntersectionObserver' in window)) { return; }

    var sections = [];
    navLinks.forEach(function (link) {
      var id = link.getAttribute('href');
      if (id && id.charAt(0) === '#') {
        var target = document.querySelector(id);
        if (target) { sections.push({ id: id, el: target, link: link }); }
      }
    });

    if (!sections.length) { return; }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var match = sections.filter(function (s) { return s.el === entry.target; })[0];
        if (!match) { return; }
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('active'); });
          match.link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { observer.observe(s.el); });
  }

  /* ----------------------------------------------------------
     4. トップへ戻るボタン
     ---------------------------------------------------------- */
  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) { return; }

    function toggleVisibility() {
      if (window.scrollY > 480) {
        btn.hidden = false;
      } else {
        btn.hidden = true;
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------------------------------------
     5. プロンプトのコピー機能・コピー完了通知
     ---------------------------------------------------------- */
  function initCopyButtons() {
    var buttons = document.querySelectorAll('.copy-btn');
    var toast = document.getElementById('copy-toast');
    var toastTimer = null;

    function showToast(message) {
      if (!toast) { return; }
      toast.textContent = message;
      toast.hidden = false;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(function () {
        toast.hidden = true;
      }, 2200);
    }

    function fallbackCopy(text) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      var success = false;
      try {
        success = document.execCommand('copy');
      } catch (e) {
        success = false;
      }
      document.body.removeChild(textarea);
      return success;
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('data-copy-target');
        var target = targetId ? document.getElementById(targetId) : null;
        if (!target) { return; }
        var text = target.textContent;

        function onSuccess() {
          btn.classList.add('copied');
          window.setTimeout(function () { btn.classList.remove('copied'); }, 1500);
          showToast('コピーしました');
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(onSuccess, function () {
            if (fallbackCopy(text)) { onSuccess(); }
          });
        } else {
          if (fallbackCopy(text)) { onSuccess(); }
        }
      });
    });
  }

  /* ----------------------------------------------------------
     6. アコーディオン（フォーム手順・FAQ共通）
     ---------------------------------------------------------- */
  function initAccordions() {
    var triggers = document.querySelectorAll('.accordion-trigger');

    triggers.forEach(function (trigger) {
      var panel = trigger.parentElement.nextElementSibling;
      if (!panel || !panel.classList.contains('accordion-panel')) { return; }

      trigger.addEventListener('click', function () {
        var expanded = trigger.getAttribute('aria-expanded') === 'true';

        if (expanded) {
          trigger.setAttribute('aria-expanded', 'false');
          panel.style.maxHeight = null;
        } else {
          trigger.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });

    // ウィンドウリサイズ時、開いているパネルの高さを再計算
    window.addEventListener('resize', function () {
      document.querySelectorAll('.accordion-trigger[aria-expanded="true"]').forEach(function (trigger) {
        var panel = trigger.parentElement.nextElementSibling;
        if (panel) { panel.style.maxHeight = panel.scrollHeight + 'px'; }
      });
    });
  }

  /* ----------------------------------------------------------
     7. スクロール連動フェードイン（控えめ）
     ---------------------------------------------------------- */
  function initFadeIn() {
    var items = document.querySelectorAll('.fade-in');
    if (!items.length) { return; }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ----------------------------------------------------------
     初期化
     ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initCurtain();
    initMobileNav();
    initActiveNavHighlight();
    initBackToTop();
    initCopyButtons();
    initAccordions();
    initFadeIn();
  });
})();
