(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);

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

  document.addEventListener('DOMContentLoaded', setupMicroInteractions);
})();
