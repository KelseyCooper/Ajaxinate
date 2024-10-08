"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

function _asyncToGenerator(fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }
        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(
            function (value) {
              step("next", value);
            },
            function (err) {
              step("throw", err);
            }
          );
        }
      }
      return step("next");
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Ajaxinate = (function () {
  function Ajaxinate(config) {
    _classCallCheck(this, Ajaxinate);

    var settings = config || {};

    var defaults = {
      method: "scroll",
      container: "#AjaxinateContainer",
      pagination: "#AjaxinatePagination",
      productCard: ".product-card",
      offset: 0,
      loadingText: "Loading",
      callback: null,
      saveHistory: false,
      loader: false,
      scrollHistory: false,
    };

    // Merge custom configs with defaults
    this.settings = Object.assign(defaults, settings);

    // Selectors
    this.containerElement = document.querySelector(this.settings.container);
    this.paginationElement = document.querySelector(this.settings.pagination);
    this.productCardElement = document.querySelectorAll(
      this.settings.productCard
    );

    // Functions
    this.addClickListener = this.addClickListener.bind(this);
    this.preventMultipleClicks = this.preventMultipleClicks.bind(this);
    this.checkIfPaginationInView = this.checkIfPaginationInView.bind(this);
    this.addScrollListeners = this.addScrollListeners.bind(this);
    this.addClickListenerProductCard =
      this.addClickListenerProductCard.bind(this);
    this.loadPreviousContent = this.loadPreviousContent.bind(this);
    this.scrollToSavedPosition = this.scrollToSavedPosition.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.removeClickListener = this.removeClickListener.bind(this);
    this.removePaginationElement = this.removePaginationElement.bind(this);
    this.removeScrollListener = this.removeScrollListener.bind(this);
    this.destroy = this.destroy.bind(this);

    // Variables
    this.isLoaded = false;

    this.initialize();
  }

  _createClass(Ajaxinate, [
    {
      key: "initialize",
      value: function initialize() {
        if (!this.containerElement) {
          return;
        }
        var initializers = {
          click: this.addClickListener.bind(this),
          scroll: this.addScrollListeners.bind(this),
        };

        initializers[this.settings.method]();

        if (this.settings.saveHistory) {
          this.addClickListenerProductCard();
        }

        if (this.settings.saveHistory && this.isLoaded == false) {
          this.loadPreviousContent();
          this.isLoaded = true;
        }

        if (!this.settings.saveHistory && this.settings.scrollHistory) {
          this.addClickListenerProductCard();
          this.scrollToSavedPosition();
        }
      },
    },
    {
      key: "addScrollListeners",
      value: function addScrollListeners() {
        if (!this.paginationElement) {
          return;
        }

        document.addEventListener("scroll", this.checkIfPaginationInView);
        window.addEventListener("resize", this.checkIfPaginationInView);
        window.addEventListener(
          "orientationchange",
          this.checkIfPaginationInView
        );
      },
    },
    {
      key: "addClickListener",
      value: function addClickListener() {
        if (!this.paginationElement) {
          return;
        }

        this.nextPageLinkElement = this.paginationElement.querySelector("a");
        this.clickActive = true;

        if (
          typeof this.nextPageLinkElement !== "undefined" &&
          this.nextPageLinkElement !== null
        ) {
          this.nextPageLinkElement.addEventListener(
            "click",
            this.preventMultipleClicks
          );
        }
      },
    },
    {
      key: "preventMultipleClicks",
      value: function preventMultipleClicks(event) {
        event.preventDefault();

        if (!this.clickActive) {
          return;
        }

        this.nextPageLinkElement.innerText = this.settings.loadingText;
        this.nextPageUrl = this.nextPageLinkElement.href;
        this.clickActive = false;

        this.loadMore();
      },
    },
    {
      key: "checkIfPaginationInView",
      value: function checkIfPaginationInView() {
        var top =
          this.paginationElement.getBoundingClientRect().top -
          this.settings.offset;
        var bottom =
          this.paginationElement.getBoundingClientRect().bottom +
          this.settings.offset;

        if (top <= window.innerHeight && bottom >= 0) {
          this.nextPageLinkElement = this.paginationElement.querySelector("a");
          this.removeScrollListener();

          if (this.nextPageLinkElement) {
            this.nextPageLinkElement.innerText = this.settings.loadingText;
            this.nextPageUrl = this.nextPageLinkElement.href;

            this.loadMore();
          }
        }
      },
    },
    {
      key: "addClickListenerProductCard",
      value: function addClickListenerProductCard() {
        if (!this.productCardElement) {
          return;
        }

        if (!this.containerElement.hasClickListener) {
          var clickOrTouchHandler = function clickOrTouchHandler(event) {
            var productCard = event.target.closest(".product-card");

            if (productCard && this.contains(productCard)) {
              sessionStorage.setItem("scrollPosition", window.scrollY);
              sessionStorage.setItem("productId", productCard.id);
            }
          };

          this.containerElement.addEventListener("click", clickOrTouchHandler);
          this.containerElement.addEventListener(
            "touchstart",
            clickOrTouchHandler
          );

          this.containerElement.hasClickListener = true;
        }
      },
    },
    {
      key: "addLoader",
      value: function addLoader() {
        var loaderContainer = document.createElement("div");
        loaderContainer.className = "loader-container";
        var loader = document.createElement("div");
        loader.className = "loader";
        loaderContainer.appendChild(loader);
        this.containerElement.appendChild(loaderContainer);
      },
    },
    {
      key: "removeLoader",
      value: function removeLoader() {
        this.containerElement.removeChild(
          document.querySelector(".loader-container")
        );
      },
    },
    {
      key: "loadPreviousContent",
      value: (function () {
        var _ref = _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee() {
            var _this = this;

            var queryString,
              urlParams,
              page,
              htmlContents,
              promises,
              _loop,
              i,
              combinedHTML;

            return regeneratorRuntime.wrap(
              function _callee$(_context) {
                while (1) {
                  switch ((_context.prev = _context.next)) {
                    case 0:
                      if (!this.isLoadingPreviousContent) {
                        _context.next = 3;
                        break;
                      }

                      return _context.abrupt("return");

                    case 3:
                      // Set the flag to true to indicate the method is now running
                      this.isLoadingPreviousContent = true;

                      queryString = window.location.search;
                      urlParams = new URLSearchParams(queryString);
                      page = urlParams.get("page");

                      if (!(page === null)) {
                        _context.next = 11;
                        break;
                      }

                      this.scrollToSavedPosition();
                      // Reset the flag before exiting
                      this.isLoadingPreviousContent = false;
                      return _context.abrupt("return");

                    case 11:
                      if (this.settings.loader) {
                        this.addLoader();
                      }

                      htmlContents = [];
                      promises = [];

                      _loop = function _loop(i) {
                        var url =
                          window.location.origin +
                          window.location.pathname +
                          ("?page=" + i);

                        promises.push(
                          new Promise(function (resolve) {
                            var request = new XMLHttpRequest();
                            request.onreadystatechange = function () {
                              if (request.readyState !== 4) return;
                              if (
                                !request.responseXML ||
                                request.status !== 200
                              )
                                return;

                              var newContainer =
                                request.responseXML.querySelectorAll(
                                  this.settings.container
                                )[0];
                              htmlContents[i] = newContainer.innerHTML; // Store the HTML content in the array

                              resolve();
                            }.bind(_this);

                            request.open("GET", url);
                            request.responseType = "document";
                            request.send();
                          })
                        );
                      };

                      for (i = page - 1; i >= 1; i--) {
                        _loop(i);
                      }

                      _context.next = 18;
                      return Promise.all(promises);

                    case 18:
                      // Concatenate and insert the HTML contents in one go
                      combinedHTML = htmlContents
                        .filter(function (content) {
                          return content !== undefined;
                        })
                        .join("");

                      this.containerElement.insertAdjacentHTML(
                        "afterbegin",
                        combinedHTML
                      );

                      this.scrollToSavedPosition();

                      if (this.settings.loader) {
                        this.removeLoader();
                      }

                      // Reset the flag to indicate the method has finished executing
                      this.isLoadingPreviousContent = false;

                    case 23:
                    case "end":
                      return _context.stop();
                  }
                }
              },
              _callee,
              this
            );
          })
        );

        function loadPreviousContent() {
          return _ref.apply(this, arguments);
        }

        return loadPreviousContent;
      })(),
    },
    {
      key: "scrollToSavedPosition",
      value: function scrollToSavedPosition() {
        var savedPosition = sessionStorage.getItem("scrollPosition");
        var productId = sessionStorage.getItem("productId");
        if (savedPosition && this.settings.scrollHistory) {
          window.scrollTo({ top: savedPosition, behavior: "auto" });
          sessionStorage.removeItem("scrollPosition");
        }

        if (productId && this.settings.scrollHistory) {
          var product = document.getElementById(productId);
          if (product) {
            product.scrollIntoView({ behavior: "auto", block: "center" });
            sessionStorage.removeItem("productId");
          }
        }
      },
    },
    {
      key: "loadMore",
      value: function loadMore() {
        this.request = new XMLHttpRequest();

        this.request.onreadystatechange = function success() {
          if (!this.request.responseXML) {
            return;
          }
          if (!this.request.readyState === 4 || !this.request.status === 200) {
            return;
          }

          var newContainer = this.request.responseXML.querySelectorAll(
            this.settings.container
          )[0];
          var newPagination = this.request.responseXML.querySelectorAll(
            this.settings.pagination
          )[0];

          this.containerElement.insertAdjacentHTML(
            "beforeend",
            newContainer.innerHTML
          );

          if (typeof newPagination === "undefined") {
            window.history.pushState(
              { path: this.nextPageUrl },
              "",
              this.nextPageUrl
            );
            this.removePaginationElement();
          } else {
            this.paginationElement.innerHTML = newPagination.innerHTML;
            window.history.pushState(
              { path: this.nextPageUrl },
              "",
              this.nextPageUrl
            );

            if (
              this.settings.callback &&
              typeof this.settings.callback === "function"
            ) {
              this.settings.callback(this.request.responseXML);
            }

            this.initialize();
          }
        }.bind(this);

        this.request.open("GET", this.nextPageUrl);
        this.request.responseType = "document";
        this.request.send();
      },
    },
    {
      key: "removeClickListener",
      value: function removeClickListener() {
        this.nextPageLinkElement.removeEventListener(
          "click",
          this.preventMultipleClicks
        );
      },
    },
    {
      key: "removePaginationElement",
      value: function removePaginationElement() {
        this.paginationElement.innerHTML = "";
        this.destroy();
      },
    },
    {
      key: "removeScrollListener",
      value: function removeScrollListener() {
        document.removeEventListener("scroll", this.checkIfPaginationInView);
        window.removeEventListener("resize", this.checkIfPaginationInView);
        window.removeEventListener(
          "orientationchange",
          this.checkIfPaginationInView
        );
      },
    },
    {
      key: "destroy",
      value: function destroy() {
        var destroyers = {
          click: this.removeClickListener,
          scroll: this.removeScrollListener,
        };

        destroyers[this.settings.method]();

        return this;
      },
    },
  ]);

  return Ajaxinate;
})();

exports.default = Ajaxinate;
