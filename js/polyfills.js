// Polyfills y soporte para navegadores antiguos
(function() {
  // Polyfill para Element.closest
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      do {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  // Polyfill para Array.from
  if (!Array.from) {
    Array.from = function(arrayLike) {
      return Array.prototype.slice.call(arrayLike);
    };
  }

  // Polyfill para Object.assign
  if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      target = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source != null) {
          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }
      }
      return target;
    };
  }

  // Polyfill para requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      setTimeout(callback, 16);
    };
  }

  // Polyfill para IntersectionObserver (versión simplificada)
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = function(callback) {
      this.observe = function(element) {
        // Simulación básica: activar después de un delay
        setTimeout(function() {
          callback([{ isIntersecting: true, target: element }]);
        }, 100);
      };
    };
  }
})();