(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);

  function setupStickerPanel() {
    const button = $('#stickerButton');
    const input = $('#messageInput');
    const form = $('#messageForm');
    if (!button || !input) return;

    let panel = $('.sticker-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'sticker-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'استیکر و شکلک');
      const emojis = ['😀','😂','😍','🥹','😎','🔥','❤️','💙','💜','🎮','🕹️','🏆','⚡','👑','🚀','💀','😭','🤝','👏','👍','👀','✨','🎯','😈','🤯','🥳','😴','🤔','💯','🎉'];
      panel.innerHTML = emojis.map(e => `<button type="button" class="sticker-item" data-sticker="${e}">${e}</button>`).join('');
      (form || button.parentElement)?.appendChild(panel);
    }

    const toggle = (force) => {
      const open = typeof force === 'boolean' ? force : !panel.classList.contains('is-open');
      panel.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    };

    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggle();
    });

    panel.addEventListener('click', (event) => {
      const item = event.target.closest('[data-sticker]');
      if (!item) return;
      const sticker = item.dataset.sticker || '';
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.value = input.value.slice(0, start) + sticker + input.value.slice(end);
      input.focus();
      input.setSelectionRange(start + sticker.length, start + sticker.length);
    });

    document.addEventListener('click', (event) => {
      if (!panel.contains(event.target) && event.target !== button) toggle(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') toggle(false);
    });
  }

  function setupMicroInteractions() {
    document.querySelectorAll('button, a').forEach((element) => {
      if (element.dataset.polished) return;
      element.dataset.polished = '1';
      element.addEventListener('pointerdown', () => element.classList.add('is-pressed'));
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(type =>
        element.addEventListener(type, () => element.classList.remove('is-pressed'))
      );
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupStickerPanel();
    setupMicroInteractions();
  });
})();
