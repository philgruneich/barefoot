"use strict";

class LittleFoot {
    constructor(options={}) {
      const DEFAULTS = {
        scope: document,
       divFootnotesQuery: ".footnotes",
       footnotesQuery: "[id^='fn']",
       fnButtonMarkup: "<button class=\"footnote-button\" id=\"{{FOOTNOTEREFID}}\" data-footnote=\"{{FOOTNOTEID}}\" alt=\"See Footnote {{FOOTNOTENUMBER}}\" rel=\"footnote\" data-fn-number=\"{{FOOTNOTENUMBER}}\" data-fn-content=\"{{FOOTNOTECONTENT}}\"></button>",
       fnContentMarkup: "<div class=\"littlefoot-footnote\" id=\"{{FOOTNOTEID}}\"><div class=\"footnote-wrapper\"><div class=\"footnote-content\">{{FOOTNOTECONTENT}}</div></div><div class=\"footnote-tooltip\" aria-hidden=\"true\"></div>"
      }

      this.config = Object.assign({}, DEFAULTS, options);

      // A selector could select multiple containers
      this.divFootnotes = [].slice.call(this.config.scope.querySelectorAll(this.config.divFootnotesQuery));

      // Returns if no container
      if (!this.divFootnotes) return false;

      // Groups all footnotes within every group.
      this.footnotes = this.divFootnotes.map((el) => {
        return el.querySelectorAll(this.config.footnotesQuery);
      });

      // Discovers the transition event for the current browser
    }

    init() {
      // Makes pretty footnote buttons
      this.footnoteButtonsBuilder();
      this.actionSetup();
    }

    removeBackLinks(fnHtml, backId) {
      let regex;

      if (backId.indexOf(' ') >= 0) {
        backId = backId.trim().replace(/\s+/g, "|").replace(/(.*)/g, "($1)");
      }

      regex = new RegExp(`(\\s|&nbsp;)*<\\s*a[^#<]*#${backId}[^>]*>(.*?)<\\s*/\\s*a>`, "g");

      return fnHtml.replace(regex, "").replace("[]", "");
    }

    buildButton(ref, id, n, content) {
      return this.config.fnButtonMarkup.replace(/\{\{FOOTNOTEREFID\}\}/g, ref).replace(/\{\{FOOTNOTEID\}\}/g, id).replace(/\{\{FOOTNOTENUMBER\}\}/g, n).replace(/\{\{FOOTNOTECONTENT\}\}/g, content);
    }

    buildContent(id, content) {
      return this.config.fnContentMarkup.replace(/\{\{FOOTNOTEID\}\}/g, id).replace(/\{\{FOOTNOTECONTENT\}\}/g, content);
    }

    clickAction(ev) {
      let btn, content, id, fnHtml, fn, windowHeight;

      btn = ev.target;
      content = btn.getAttribute('data-fn-content');
      id = btn.getAttribute("data-footnote");

      this.removeFootnotes()

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

    calculateOffset(fn, btn) {
      let tooltip, container, btnOffset, btnWidth, contWidth, contOffset, wrapWidth, wrapMove, wrapOffset, tipWidth, tipOffset, windowWidth;

      btn = btn || fn.previousElementSibling;

      btnOffset = btn.offsetLeft;
      btnWidth = btn.offsetWidth;
      tooltip = fn.querySelector('.footnote-tooltip');
      tipWidth = tooltip.clientWidth;
      container = fn.parentNode;
      contWidth = container.clientWidth;
      contOffset = container.offsetLeft;
      wrapWidth = fn.offsetWidth;
      wrapMove = -((wrapWidth / 2) - (contWidth / 2));

      windowWidth = window.outerWidth || window.availWidth;

      if ((contOffset + wrapMove) < 0) {
        wrapMove = (wrapMove - (contOffset + wrapMove));
      } else if ((contOffset + wrapMove + wrapWidth) > windowWidth) {
        wrapMove = (wrapMove - (contOffset + wrapMove + wrapWidth - windowWidth));
      }

      fn.style.left = wrapMove + "px";
      wrapOffset = contOffset + wrapMove;
      tipOffset = (contOffset - wrapOffset + (contWidth / 2) - (tipWidth / 2));
      tooltip.style.left = tipOffset + "px";
    }

    removeFootnoteChild(el) {
      return el.parentNode.removeChild(el);
    }

    debounce(func, wait, immediate) {
      var timeout;
      return function() {
        var context = this
          , args = arguments;

        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };

        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      }
    }

    resizeAction() {
      let footnotes = document.querySelectorAll('.footnote-is-active');

      if (footnotes) {
        for (let fn of footnotes) {
          console.log(fn);
          this.calculateOffset(fn);
          this.calculateSpacing(fn);
        }
      }
    }

    calculateSpacing(fn) {
      let bcr, bch, bcb, margins, windowHeight;

      margins = this.calculateMargins(fn);
      windowHeight = window.innerHeight || window.availHeight;

      bcr = fn.getBoundingClientRect();
      bch = bcr.height;
      bcb = bcr.bottom;

      if (bcb > (windowHeight - margins.bottom)) {
        fn.classList.add("footnote-is-top");
      } else if (windowHeight  - (bch + margins.top) > bcb && fn.classList.contains("footnote-is-top")) {
        fn.classList.remove("footnote-is-top");
      }
    }

    scrollAction() {
      let footnotes = document.querySelectorAll('.footnote-is-active');

      if (footnotes) {
        let windowHeight = window.innerHeight || window.availHeight
          , margins = this.calculateMargins(footnotes[0]);

        [].forEach.call(footnotes, (el) => {
          this.calculateSpacing(el);
        });
      }
    }

    calculateMargins(fn) {
      let computedStyle = window.getComputedStyle(fn, null);
      return {
        top: parseFloat(computedStyle.marginTop),
        right: parseFloat(computedStyle.marginRight),
        bottom: parseFloat(computedStyle.marginBottom),
        left: parseFloat(computedStyle.marginLeft)
      }
    }

    closestClass(el, _class) {
      do {
        try {
          if (el.classList.contains(_class)) {
            return el;
          }
        } catch(e) {
          if (e instanceof TypeError) {
            return null;
          }
        }
      } while (!!(el = el.parentNode));

      return null;
    }

    documentAction(ev) {
      if (!this.closestClass(ev.target, "footnote-container")) this.removeFootnotes();
    }

    removeFootnotes() {
      let footnotes = document.querySelectorAll('.footnote-is-active');

      if (footnotes) {
        [].forEach.call(footnotes, (el) => {
          el.previousElementSibling.classList.remove('is-active');
          el.addEventListener('transitionend', this.removeFootnoteChild(el), false);
          el.classList.remove("footnote-is-active");
        })
      }

      if (document.body.classList.contains("footnote-backdrop")) document.body.classList.remove("footnote-backdrop");
    }

    footnoteButtonsBuilder() {
      [].forEach.call(this.footnotes, (fns, i) => {
        [].forEach.call(fns, (fn, i) => {
          let fnContent
            , fnHrefId
            , fnId
            , ref
            , fnRefN
            , footnote
          ;

          fnRefN = i + 1;
          fnHrefId = fn.querySelector('a[href^="#fnref"]').getAttribute('href').substring(1);
          // Removes the hash from the href attribute. I had to appeal to this because there has been some issues parsing IDs with colons on querySelector. Yes, I tried to escape them, but no good.
          fnContent = this.removeBackLinks(fn.innerHTML.trim(), fnHrefId);

          fnContent = fnContent.replace(/"/g, "&quot;").replace(/&lt;/g, "&ltsym;").replace(/&gt;/g, "&gtsym;");

          if (fnContent.indexOf("<") !== 0) fnContent = "<p>" + fnContent + "</p>";

          ref = document.getElementById(fnHrefId);

          footnote = `<div class=\"footnote-container\">${this.buildButton(fnHrefId, fn.id, fnRefN, fnContent)}</div>`;

          ref.insertAdjacentHTML('afterend', footnote);
          ref.parentNode.removeChild(ref);
        });
      });
    }

    actionSetup() {
      let buttons = this.config.scope.querySelectorAll('.footnote-button');

      [].forEach.call(buttons, (el) => {
        el.addEventListener("click", this.clickAction.bind(this));
      });

      window.addEventListener("resize", this.debounce(this.resizeAction.bind(this), 100));
      window.addEventListener("scroll", this.debounce(this.scrollAction.bind(this), 100));
      document.body.addEventListener("click", this.documentAction.bind(this));
      document.body.addEventListener("touchend", this.documentAction.bind(this));

      // Remove the footnote container
      this.divFootnotes.forEach((el) => {
        return el.parentNode.removeChild(el);
      });
    }
}

var lf = new LittleFoot;
lf.init();
