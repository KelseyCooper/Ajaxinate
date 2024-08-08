class Ajaxinate {
  constructor(config) {
    const settings = config || {};

    const defaults = {
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

  initialize() {
    if (!this.containerElement) {
      return;
    }
    const initializers = {
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
  }

  addScrollListeners() {
    if (!this.paginationElement) {
      return;
    }

    document.addEventListener("scroll", this.checkIfPaginationInView);
    window.addEventListener("resize", this.checkIfPaginationInView);
    window.addEventListener("orientationchange", this.checkIfPaginationInView);
  }

  addClickListener() {
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
  }

  preventMultipleClicks(event) {
    event.preventDefault();

    if (!this.clickActive) {
      return;
    }

    this.nextPageLinkElement.innerText = this.settings.loadingText;
    this.nextPageUrl = this.nextPageLinkElement.href;
    this.clickActive = false;

    this.loadMore();
  }

  checkIfPaginationInView() {
    const top =
      this.paginationElement.getBoundingClientRect().top - this.settings.offset;
    const bottom =
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
  }

  addClickListenerProductCard() {
    if (!this.productCardElement) {
      return;
    }

    if (!this.containerElement.hasClickListener) {
      const clickOrTouchHandler = function (event) {
        const productCard = event.target.closest(".product-card");

        if (productCard && this.contains(productCard)) {
          sessionStorage.setItem("scrollPosition", window.scrollY);
          sessionStorage.setItem("productId", productCard.id);
        }
      };

      this.containerElement.addEventListener("click", clickOrTouchHandler);
      this.containerElement.addEventListener("touchstart", clickOrTouchHandler);

      this.containerElement.hasClickListener = true;
    }
  }

  addLoader() {
    const loaderContainer = document.createElement("div");
    loaderContainer.className = "loader-container";
    const loader = document.createElement("div");
    loader.className = "loader";
    loaderContainer.appendChild(loader);
    this.containerElement.appendChild(loaderContainer);
  }

  removeLoader() {
    this.containerElement.removeChild(
      document.querySelector(".loader-container")
    );
  }

  async loadPreviousContent() {
    // Check if the method is already running and exit if it is
    if (this.isLoadingPreviousContent) {
      return;
    }

    // Set the flag to true to indicate the method is now running
    this.isLoadingPreviousContent = true;

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const page = urlParams.get("page");

    if (page === null) {
      this.scrollToSavedPosition();
      // Reset the flag before exiting
      this.isLoadingPreviousContent = false;
      return;
    }

    if (this.settings.loader) {
      this.addLoader();
    }

    const htmlContents = [];
    const promises = [];

    for (let i = page - 1; i >= 1; i--) {
      const url =
        window.location.origin + window.location.pathname + `?page=${i}`;

      promises.push(
        new Promise((resolve) => {
          const request = new XMLHttpRequest();
          request.onreadystatechange = function () {
            if (request.readyState !== 4) return;
            if (!request.responseXML || request.status !== 200) return;

            const newContainer = request.responseXML.querySelectorAll(
              this.settings.container
            )[0];
            htmlContents[i] = newContainer.innerHTML; // Store the HTML content in the array

            resolve();
          }.bind(this);

          request.open("GET", url);
          request.responseType = "document";
          request.send();
        })
      );
    }

    await Promise.all(promises);

    // Concatenate and insert the HTML contents in one go
    const combinedHTML = htmlContents
      .filter((content) => content !== undefined)
      .join("");
    this.containerElement.insertAdjacentHTML("afterbegin", combinedHTML);

    this.scrollToSavedPosition();

    if (this.settings.loader) {
      this.removeLoader();
    }

    // Reset the flag to indicate the method has finished executing
    this.isLoadingPreviousContent = false;
  }

  scrollToSavedPosition() {
    const savedPosition = sessionStorage.getItem("scrollPosition");
    const productId = sessionStorage.getItem("productId");
    if (savedPosition && this.settings.scrollHistory) {
      window.scrollTo({ top: savedPosition, behavior: "auto" });
      sessionStorage.removeItem("scrollPosition");
    }

    if (productId && this.settings.scrollHistory) {
      const product = document.getElementById(productId);
      if (product) {
        product.scrollIntoView({ behavior: "auto", block: "center" });
        sessionStorage.removeItem("productId");
      }
    }
  }

  loadMore() {
    this.request = new XMLHttpRequest();

    this.request.onreadystatechange = function success() {
      if (!this.request.responseXML) {
        return;
      }
      if (!this.request.readyState === 4 || !this.request.status === 200) {
        return;
      }

      const newContainer = this.request.responseXML.querySelectorAll(
        this.settings.container
      )[0];
      const newPagination = this.request.responseXML.querySelectorAll(
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
  }

  removeClickListener() {
    this.nextPageLinkElement.removeEventListener(
      "click",
      this.preventMultipleClicks
    );
  }

  removePaginationElement() {
    this.paginationElement.innerHTML = "";
    this.destroy();
  }

  removeScrollListener() {
    document.removeEventListener("scroll", this.checkIfPaginationInView);
    window.removeEventListener("resize", this.checkIfPaginationInView);
    window.removeEventListener(
      "orientationchange",
      this.checkIfPaginationInView
    );
  }

  destroy() {
    const destroyers = {
      click: this.removeClickListener,
      scroll: this.removeScrollListener,
    };

    destroyers[this.settings.method]();

    return this;
  }
}
export default Ajaxinate;
