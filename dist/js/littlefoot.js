"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LittleFoot = function () {
  function LittleFoot() {
    var _this = this;

    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, LittleFoot);

    var DEFAULTS = {
      scope: document,
      divFootnotesQuery: ".footnotes",
      footnotesQuery: "[id^='fn']",
      fnButtonMarkup: "<button class=\"footnote-button\" id=\"{{FOOTNOTEREFID}}\" data-footnote=\"{{FOOTNOTEID}}\" alt=\"See Footnote {{FOOTNOTENUMBER}}\" rel=\"footnote\" data-fn-number=\"{{FOOTNOTENUMBER}}\" data-fn-content=\"{{FOOTNOTECONTENT}}\"></button>",
      fnContentMarkup: "<div class=\"littlefoot-footnote\" id=\"{{FOOTNOTEID}}\"><div class=\"footnote-wrapper\"><div class=\"footnote-content\">{{FOOTNOTECONTENT}}</div></div><div class=\"footnote-tooltip\" aria-hidden=\"true\"></div>"
    };

    this.config = Object.assign({}, DEFAULTS, options);

    // A selector could select multiple containers
    this.divFootnotes = [].slice.call(this.config.scope.querySelectorAll(this.config.divFootnotesQuery));

    // Returns if no container
    if (!this.divFootnotes) return false;

    // Groups all footnotes within every group.
    this.footnotes = this.divFootnotes.map(function (el) {
      return el.querySelectorAll(_this.config.footnotesQuery);
    });

    // Discovers the transition event for the current browser
  }

  _createClass(LittleFoot, [{
    key: "init",
    value: function init() {
      // Makes pretty footnote buttons
      this.footnoteButtonsBuilder();
      this.actionSetup();
    }
  }, {
    key: "removeBackLinks",
    value: function removeBackLinks(fnHtml, backId) {
      var regex = void 0;

      if (backId.indexOf(' ') >= 0) {
        backId = backId.trim().replace(/\s+/g, "|").replace(/(.*)/g, "($1)");
      }

      regex = new RegExp("(\\s|&nbsp;)*<\\s*a[^#<]*#" + backId + "[^>]*>(.*?)<\\s*/\\s*a>", "g");

      return fnHtml.replace(regex, "").replace("[]", "");
    }
  }, {
    key: "buildButton",
    value: function buildButton(ref, id, n, content) {
      return this.config.fnButtonMarkup.replace(/\{\{FOOTNOTEREFID\}\}/g, ref).replace(/\{\{FOOTNOTEID\}\}/g, id).replace(/\{\{FOOTNOTENUMBER\}\}/g, n).replace(/\{\{FOOTNOTECONTENT\}\}/g, content);
    }
  }, {
    key: "buildContent",
    value: function buildContent(id, content) {
      return this.config.fnContentMarkup.replace(/\{\{FOOTNOTEID\}\}/g, id).replace(/\{\{FOOTNOTECONTENT\}\}/g, content);
    }
  }, {
    key: "clickAction",
    value: function clickAction(ev) {
      var btn = void 0,
          content = void 0,
          id = void 0,
          fnHtml = void 0,
          fn = void 0,
          windowHeight = void 0;

      btn = ev.target;
      content = btn.getAttribute('data-fn-content');
      id = btn.getAttribute("data-footnote");

      this.removeFootnotes();

      if (!btn.nextElementSibling) {
        fnHtml = this.buildContent(id, content);
        btn.insertAdjacentHTML('afterend', fnHtml);
        fn = btn.nextElementSibling;

        //windowHeight = window.innerHeight || window.availHeight;
        //windowHeight = (window.innerHeight > 0) ? window.innerHeight : window.availHeight;

        this.calculateOffset(fn, btn);
        this.calculateSpacing(fn);

        btn.classList.add('is-active');
        fn.classList.add('footnote-is-active');

        if ('ontouchstart' in document.documentElement) {
          document.body.classList.add("footnote-backdrop");
        }
      }
    }
  }, {
    key: "calculateOffset",
    value: function calculateOffset(fn, btn) {
      var tooltip = void 0,
          container = void 0,
          btnOffset = void 0,
          btnWidth = void 0,
          contWidth = void 0,
          contOffset = void 0,
          wrapWidth = void 0,
          wrapMove = void 0,
          wrapOffset = void 0,
          tipWidth = void 0,
          tipOffset = void 0,
          windowWidth = void 0;

      btn = btn || fn.previousElementSibling;

      btnOffset = btn.offsetLeft;
      btnWidth = btn.offsetWidth;
      tooltip = fn.querySelector('.footnote-tooltip');
      tipWidth = tooltip.clientWidth;
      container = fn.parentNode;
      contWidth = container.clientWidth;
      contOffset = container.offsetLeft;
      wrapWidth = fn.offsetWidth;
      wrapMove = -(wrapWidth / 2 - contWidth / 2);

      windowWidth = window.outerWidth || window.availWidth;

      if (contOffset + wrapMove < 0) {
        wrapMove = wrapMove - (contOffset + wrapMove);
      } else if (contOffset + wrapMove + wrapWidth > windowWidth) {
        wrapMove = wrapMove - (contOffset + wrapMove + wrapWidth - windowWidth);
      }

      fn.style.left = wrapMove + "px";
      wrapOffset = contOffset + wrapMove;
      tipOffset = contOffset - wrapOffset + contWidth / 2 - tipWidth / 2;
      tooltip.style.left = tipOffset + "px";
    }
  }, {
    key: "removeFootnoteChild",
    value: function removeFootnoteChild(el) {
      return el.parentNode.removeChild(el);
    }
  }, {
    key: "debounce",
    value: function debounce(func, wait, immediate) {
      var timeout;
      return function () {
        var context = this,
            args = arguments;

        var later = function later() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };

        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    }
  }, {
    key: "resizeAction",
    value: function resizeAction() {
      var footnotes = document.querySelectorAll('.footnote-is-active');

      if (footnotes) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = footnotes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var fn = _step.value;

            console.log(fn);
            this.calculateOffset(fn);
            this.calculateSpacing(fn);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }
  }, {
    key: "calculateSpacing",
    value: function calculateSpacing(fn) {
      var bcr = void 0,
          bch = void 0,
          bcb = void 0,
          margins = void 0,
          windowHeight = void 0;

      margins = this.calculateMargins(fn);
      windowHeight = window.innerHeight || window.availHeight;

      bcr = fn.getBoundingClientRect();
      bch = bcr.height;
      bcb = bcr.bottom;

      if (bcb > windowHeight - margins.bottom) {
        fn.classList.add("footnote-is-top");
      } else if (windowHeight - (bch + margins.top) > bcb && fn.classList.contains("footnote-is-top")) {
        fn.classList.remove("footnote-is-top");
      }
    }
  }, {
    key: "scrollAction",
    value: function scrollAction() {
      var _this2 = this;

      var footnotes = document.querySelectorAll('.footnote-is-active');

      if (footnotes) {
        var windowHeight = window.innerHeight || window.availHeight,
            margins = this.calculateMargins(footnotes[0]);

        [].forEach.call(footnotes, function (el) {
          _this2.calculateSpacing(el);
        });
      }
    }
  }, {
    key: "calculateMargins",
    value: function calculateMargins(fn) {
      var computedStyle = window.getComputedStyle(fn, null);
      return {
        top: parseFloat(computedStyle.marginTop),
        right: parseFloat(computedStyle.marginRight),
        bottom: parseFloat(computedStyle.marginBottom),
        left: parseFloat(computedStyle.marginLeft)
      };
    }
  }, {
    key: "closestClass",
    value: function closestClass(el, _class) {
      do {
        try {
          if (el.classList.contains(_class)) {
            return el;
          }
        } catch (e) {
          if (e instanceof TypeError) {
            return null;
          }
        }
      } while (!!(el = el.parentNode));

      return null;
    }
  }, {
    key: "documentAction",
    value: function documentAction(ev) {
      if (!this.closestClass(ev.target, "footnote-container")) this.removeFootnotes();
    }
  }, {
    key: "removeFootnotes",
    value: function removeFootnotes() {
      var _this3 = this;

      var footnotes = document.querySelectorAll('.footnote-is-active');

      if (footnotes) {
        [].forEach.call(footnotes, function (el) {
          el.previousElementSibling.classList.remove('is-active');
          el.addEventListener('transitionend', _this3.removeFootnoteChild(el), false);
          el.classList.remove("footnote-is-active");
        });
      }

      if (document.body.classList.contains("footnote-backdrop")) document.body.classList.remove("footnote-backdrop");
    }
  }, {
    key: "footnoteButtonsBuilder",
    value: function footnoteButtonsBuilder() {
      var _this4 = this;

      [].forEach.call(this.footnotes, function (fns, i) {
        [].forEach.call(fns, function (fn, i) {
          var fnContent = void 0,
              fnHrefId = void 0,
              fnId = void 0,
              ref = void 0,
              fnRefN = void 0,
              footnote = void 0;

          fnRefN = i + 1;
          fnHrefId = fn.querySelector('a[href^="#fnref"]').getAttribute('href').substring(1);
          // Removes the hash from the href attribute. I had to appeal to this because there has been some issues parsing IDs with colons on querySelector. Yes, I tried to escape them, but no good.
          fnContent = _this4.removeBackLinks(fn.innerHTML.trim(), fnHrefId);

          fnContent = fnContent.replace(/"/g, "&quot;").replace(/&lt;/g, "&ltsym;").replace(/&gt;/g, "&gtsym;");

          if (fnContent.indexOf("<") !== 0) fnContent = "<p>" + fnContent + "</p>";

          ref = document.getElementById(fnHrefId);

          footnote = "<div class=\"footnote-container\">" + _this4.buildButton(fnHrefId, fn.id, fnRefN, fnContent) + "</div>";

          ref.insertAdjacentHTML('afterend', footnote);
          ref.parentNode.removeChild(ref);
        });
      });
    }
  }, {
    key: "actionSetup",
    value: function actionSetup() {
      var _this5 = this;

      var buttons = this.config.scope.querySelectorAll('.footnote-button');

      [].forEach.call(buttons, function (el) {
        el.addEventListener("click", _this5.clickAction.bind(_this5));
      });

      window.addEventListener("resize", this.debounce(this.resizeAction.bind(this), 100));
      window.addEventListener("scroll", this.debounce(this.scrollAction.bind(this), 100));
      document.body.addEventListener("click", this.documentAction.bind(this));
      document.body.addEventListener("touchend", this.documentAction.bind(this));

      // Remove the footnote container
      this.divFootnotes.forEach(function (el) {
        return el.parentNode.removeChild(el);
      });
    }
  }]);

  return LittleFoot;
}();

var lf = new LittleFoot();
lf.init();