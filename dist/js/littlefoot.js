(function() {
	"use strict";
	var littleFoot = {
		init: function() {
			var divFootnotes,
				actualFootnotes;
			divFootnotes = this.config.scope.querySelector(this.config.divFootnotesQuery);
            if (!divFootnotes) {
                return false;
            }
			actualFootnotes = divFootnotes.querySelectorAll(this.config.footnotesQuery);

			this.footnoteButtonsBuilder(actualFootnotes);
			divFootnotes.parentNode.removeChild(divFootnotes);
			this.actionSetup();
		},

		removeBackLinks: function(footnoteHTML, backlinkID) {
			var regex;
			if (backlinkID.indexOf(' ') >= 0) {
				backlinkID = backlinkID.trim().replace(/\s+/g, "|").replace(/(.*)/g, "($1)");
			}
			regex = new RegExp("(\\s|&nbsp;)*<\\s*a[^#<]*#" + backlinkID + "[^>]*>(.*?)<\\s*/\\s*a>", "g");
			return footnoteHTML.replace(regex, "").replace("[]", "");
		},

		buildButton: function(refId, id, number, content) {
			return this.config.fnButtonMarkup.replace(/\{\{FOOTNOTEREFID\}\}/g, refId).replace(/\{\{FOOTNOTEID\}\}/g, id).replace(/\{\{FOOTNOTENUMBER\}\}/g, number).replace(/\{\{FOOTNOTECONTENT\}\}/g, content);
		},

		buildContent: function(id, content) {
        	return this.config.fnContentMarkup.replace(/\{\{FOOTNOTEID\}\}/g, id).replace(/\{\{FOOTNOTECONTENT\}\}/g, content);
        },

        clickAction: function(event) {
        	var button,
        		content,
        		refId,
        		footnoteHtml,
        		footnote,
                windowHeight;
        	button = event.target;
        	content = button.getAttribute("data-fn-content");
        	refId = button.getAttribute("data-footnote");

        	if (button.nextElementSibling) {
        		this.removeFootnotes();
        		return;
        	}

        	this.removeFootnotes();

        	footnoteHtml = this.buildContent(refId, content);
        	button.insertAdjacentHTML('afterend', footnoteHtml);

        	footnote = button.nextElementSibling;

            windowHeight = (window.innerHeight > 0) ? window.innerHeight : window.availHeight; 
        	this.calculateOffset(footnote, button);
        	this.calculateSpacing(footnote, this.calculateMargins(footnote), windowHeight);
            button.classList.add("is-active");
        	footnote.classList.add("footnote-is-active");

            if ("ontouchstart" in document.documentElement) {
                document.body.classList.add("footnote-backdrop");
            }
        },

        calculateOffset: function(fn, btn) {
        	var tooltip, container, buttonOffset, buttonWidth, containerWidth, containerOffset, wrapperWidth, wrapperMove, wrapperOffset, tooltipWidth, tooltipOffset, windowWidth;

        	btn = typeof btn !== "undefined" ? btn : fn.previousElementSibling;

        	buttonOffset = btn.offsetLeft;
        	buttonWidth = btn.offsetWidth;
        	tooltip = fn.querySelector(".footnote-tooltip");
        	tooltipWidth = tooltip.clientWidth;
        	container = fn.parentNode;
        	containerWidth = container.clientWidth;
        	containerOffset = container.offsetLeft;
        	wrapperWidth = fn.offsetWidth;
        	wrapperMove = -((wrapperWidth / 2) - (containerWidth / 2));

            windowWidth = (window.outerWidth > 0) ? window.outerWidth : window.availWidth;

        	if ((containerOffset + wrapperMove) < 0) {
        		wrapperMove = (wrapperMove - (containerOffset + wrapperMove));
        	} else if ((containerOffset + wrapperMove + wrapperWidth) > windowWidth) {
        		wrapperMove = (wrapperMove - (containerOffset + wrapperMove + wrapperWidth - windowWidth));
        	}

        	fn.style.left = wrapperMove + "px";
        	wrapperOffset = (containerOffset + wrapperMove);
        	tooltipOffset = (containerOffset - wrapperOffset + (containerWidth / 2) - (tooltipWidth / 2));
			tooltip.style.left = tooltipOffset + "px";
        },

        getTransitionEvent: function() {
        	var t, el, transitions;
        	el = document.createElement("fake");
        	transitions = {
        		'transition':'transitionend',
			    'OTransition':'oTransitionEnd',
			    'MozTransition':'transitionend',
			    'WebkitTransition':'webkitTransitionEnd'
        	};

        	for(t in transitions) {
        		if ( el.style[t] !== undefined ) {
        			return transitions[t];
        		}
        	}
        },

        removeFootnoteChild: function(element) {
        	element.parentNode.removeChild(element);
        },

        removeFootnotes: function() {
        	var footnotes, transitionEvent;
        	transitionEvent = this.getTransitionEvent();
        	footnotes = document.querySelectorAll(".footnote-is-active");
        	if (footnotes.length > 0) {
        		Array.prototype.forEach.call(footnotes, function(el) {
                    el.previousElementSibling.classList.remove("is-active");
        			if (transitionEvent) {
        				el.addEventListener(transitionEvent, this.removeFootnoteChild.bind(this, el), false);
        			} else {
        				this.once(this.removeFootnoteChild(el));
        			}
        			el.classList.remove("footnote-is-active");
        		}.bind(this));

                if (document.body.classList.contains("footnote-backdrop")) {
                    document.body.classList.remove("footnote-backdrop");
                }

        	}
        },

        // Credits: http://davidwalsh.name/javascript-debounce-function

        debounce: function(func, wait, immediate) {
        	var timeout;
        	return function() {
				var context = this, args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) { func.apply(context, args); }
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) { func.apply(context, args); }
			};
        },

        resizeAction: function() {
        	var footnotes;

        	footnotes = document.querySelectorAll(".footnote-is-active");
        	if (footnotes.length > 0) {
        		Array.prototype.forEach.call(footnotes, function(el) {
        			this.calculateOffset(el);
        			this.calculateSpacing(el);
        		}.bind(this));
        	}
        },

        calculateSpacing: function(fn, margins, windowHeight) {
        	var boundingClientRect,
        		boundingClientHeight,
        		boundingClientBottom;

        	margins = typeof margins !== "undefined" ? margins : this.calculateMargins(fn);
        	windowHeight = typeof windowHeight !== "undefined" ? windowHeight : window.innerHeight;
            windowHeight = (windowHeight > 0) ? windowHeight : window.availHeight;

        	boundingClientRect = fn.getBoundingClientRect();
			boundingClientHeight = boundingClientRect.height;
			boundingClientBottom = boundingClientRect.bottom;

			if (boundingClientBottom > (windowHeight - margins[1])) {
				fn.classList.add("footnote-is-top");
			} else if (windowHeight  - (boundingClientHeight + margins[0]) > boundingClientBottom && fn.classList.contains("footnote-is-top")){
				fn.classList.remove("footnote-is-top");
			}
        },

        scrollAction: function() {
        	var footnotes;

        	footnotes = document.querySelectorAll(".footnote-is-active");
        	if (footnotes.length > 0) {
        		var windowHeight, margins;
        		windowHeight = (window.innerHeight > 0) ? window.innerHeight : window.availHeight; 
        		margins = this.calculateMargins(footnotes[0]);

        		Array.prototype.forEach.call(footnotes, function(el) {
        			this.calculateSpacing(el, margins, windowHeight);
        		}.bind(this));
        	}
        },

        calculateMargins: function(el) {
        	var computedStyle = window.getComputedStyle(el, null);
        	return [parseFloat(computedStyle.marginTop), parseFloat(computedStyle.marginBottom)];
        },

        closestClass: function(el, tag) {
        	do {
        		try {
        			if (el.classList.contains(tag)) {
	        			return el;
	        		}
        		} catch(e) {
        			if (e instanceof TypeError) {
        				return null;
        			}
        		}
        	} while (!!(el = el.parentNode));

        	return null;
        },

        documentAction: function(event) {
        	if (!this.closestClass(event.target, "footnote-container")) {
        		this.removeFootnotes();
        	}
        },

        actionSetup: function() {
        	var buttons;
        	buttons = this.config.scope.querySelectorAll(".footnote-button");
        	Array.prototype.forEach.call(buttons, function(el) {
        		el.addEventListener("click", this.clickAction.bind(this));
        	}.bind(this));

        	window.addEventListener("resize", this.debounce(this.resizeAction.bind(this), 100));
        	window.addEventListener("scroll", this.debounce(this.scrollAction.bind(this), 100));
        	document.body.addEventListener("click", this.documentAction.bind(this));
            document.body.addEventListener("touchend", this.documentAction.bind(this));

        },

        footnoteButtonsBuilder: function(footnotes) {
        	Array.prototype.forEach.call(footnotes, function(el, i) {
        		var fnContent,
        			fnHrefId,
        			fnId,
        			ref,
        			fnRefNumber,
        			footnote;
        		fnRefNumber = i + 1;
        		fnId = el.id;
        		fnHrefId = el.querySelector("a[href^='#fnref']").getAttribute('href').substring(1);
        		// Removes the hash from the href attribute. I had to appeal to this because there has been some issues parsing IDs with colons on querySelector. Yes, I tried to escape them, but no good.
        		fnContent = this.removeBackLinks(el.innerHTML.trim(), fnHrefId);
        		fnContent = fnContent.replace(/"/g, "&quot;").replace(/&lt;/g, "&ltsym;").replace(/&gt;/g, "&gtsym;");
        		if (fnContent.indexOf("<") !== 0) {
                    fnContent = "<p>" + fnContent + "</p>";
                }

                ref = document.getElementById(fnHrefId);

				footnote = "<div class=\"footnote-container\">" + this.buildButton(fnHrefId, fnId, fnRefNumber, fnContent) + "</div>";

				ref.insertAdjacentHTML('afterend', footnote);

				ref.parentNode.removeChild(ref);

        	}.bind(this));
			return;
        },
		config: {
			scope: document,
			divFootnotesQuery: ".footnotes",
			footnotesQuery: "[id^='fn']",
			fnButtonMarkup: "<button class=\"footnote-button\" id=\"{{FOOTNOTEREFID}}\" data-footnote=\"{{FOOTNOTEID}}\" alt=\"See Footnote {{FOOTNOTENUMBER}}\" rel=\"footnote\" data-fn-number=\"{{FOOTNOTENUMBER}}\" data-fn-content=\"{{FOOTNOTECONTENT}}\"></button>",
			fnContentMarkup: "<div class=\"littlefoot-footnote\" id=\"{{FOOTNOTEID}}\"><div class=\"footnote-wrapper\"><div class=\"footnote-content\">{{FOOTNOTECONTENT}}</div></div><div class=\"footnote-tooltip\" aria-hidden=\"true\"></div>"
		}
	};
	littleFoot.init();
})();