class Ajaxinate {
  constructor(config) {
    const settings = config || {};

    const defaults = {
      method: 'scroll',
      container: '#AjaxinateContainer',
      pagination: '#AjaxinatePagination',
      productCard: '.product-card',
      offset: 0,
      loadingText: 'Loading',
      callback: null,
      saveHistory: false,
      loader: false,
    };

    // Merge custom configs with defaults
    this.settings = Object.assign(defaults, settings);

    // Selectors
    this.containerElement = document.querySelector(this.settings.container);
    this.paginationElement = document.querySelector(this.settings.pagination);
    this.productCardElement = document.querySelectorAll(this.settings.productCard);

    // Variables
    this.isLoaded = false;

    this.initialize();
  }

  initialize() {
    if (!this.containerElement) { return; }
    const initializers = {
      click: this.addClickListener.bind(this),
      scroll: this.addScrollListeners.bind(this),
    };

    initializers[this.settings.method]();

    if (this.settings.saveHistory) {
      this.addClickListenerProductCard();
    }
    
    console.log('isLoaded: ' + this.isLoaded);
    if (this.settings.saveHistory && this.isLoaded == false) {
      console.log('adding event listener ' + this.isLoaded);
      this.loadPreviousContent();
      this.isLoaded = true;
    }
  }

  addScrollListeners() {
    if (!this.paginationElement) { return; }
  
    document.addEventListener('scroll', this.checkIfPaginationInView);
    window.addEventListener('resize', this.checkIfPaginationInView);
    window.addEventListener('orientationchange', this.checkIfPaginationInView);
  }
  
  addClickListener() {
    if (!this.paginationElement) { return; }
  
    this.nextPageLinkElement = this.paginationElement.querySelector('a');
    this.clickActive = true;
  
    if (typeof this.nextPageLinkElement !== 'undefined' && this.nextPageLinkElement !== null) {
      this.nextPageLinkElement.addEventListener('click', this.preventMultipleClicks);
    }
  }
  
  preventMultipleClicks(event) {
    event.preventDefault();
  
    if (!this.clickActive) { return; }
  
    this.nextPageLinkElement.innerText = this.settings.loadingText;
    this.nextPageUrl = this.nextPageLinkElement.href;
    this.clickActive = false;
  
    this.loadMore();
  }
  
  checkIfPaginationInView() {
    const top = this.paginationElement.getBoundingClientRect().top - this.settings.offset;
    const bottom = this.paginationElement.getBoundingClientRect().bottom + this.settings.offset;
  
    if (top <= window.innerHeight && bottom >= 0) {
      this.nextPageLinkElement = this.paginationElement.querySelector('a');
      this.removeScrollListener();
  
      if (this.nextPageLinkElement) {
        this.nextPageLinkElement.innerText = this.settings.loadingText;
        this.nextPageUrl = this.nextPageLinkElement.href;
  
        this.loadMore();
      }
    }
  }
  
  addClickListenerProductCard() {
    if (!this.productCardElement) { return; }
  
    if (!this.containerElement.hasClickListener) {
      const clickOrTouchHandler = function(event) {
        const productCard = event.target.closest('.product-card');
  
        if (productCard && this.contains(productCard)) {
          sessionStorage.setItem('scrollPosition', window.scrollY);
          console.log('product card clicked');
        }
      };
  
      this.containerElement.addEventListener('click', clickOrTouchHandler);
      this.containerElement.addEventListener('touchstart', clickOrTouchHandler);
  
      this.containerElement.hasClickListener = true;
    }
  }
  
  addLoader() {
    const loaderContainer = document.createElement('div');
    loaderContainer.className = 'loader-container';
    const loader = document.createElement('div');
    loader.className = 'loader';
    loaderContainer.appendChild(loader);
    this.containerElement.appendChild(loaderContainer);
  }
  
  removeLoader() {
    this.containerElement.removeChild(document.querySelector('.loader-container'));
  }
  
  async loadPreviousContent() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const page = urlParams.get('page');
  
    if (page === null) {
      this.scrollToSavedPosition();
      return;
    }
  
    if(this.settings.loader) {
      this.addLoader();
    }
    
    const promises = [];
    
    for (let i = page - 1; i >= 1; i--) {
      console.log('loading previous page ' + i);
      this.request = new XMLHttpRequest();
      const url = window.location.origin + window.location.pathname + `?page=${i}`;
  
      promises.push(new Promise((resolve) => {
        this.request.onreadystatechange = function success() {
          if (this.request.readyState !== 4) { return; }
          if (!this.request.responseXML || this.request.status !== 200) { return; }
  
          const newContainer = this.request.responseXML.querySelectorAll(this.settings.container)[0];
          const newPagination = this.request.responseXML.querySelectorAll(this.settings.pagination)[0];
  
          this.containerElement.insertAdjacentHTML('afterbegin', newContainer.innerHTML);
  
          if (typeof newPagination === 'undefined') {
            // this.removePaginationElement();
          } else {
            this.initialize();
          }
  
          resolve();
        }.bind(this);
  
        this.request.open('GET', url);
        this.request.responseType = 'document';
        this.request.send();
      }));
    }
  
    await Promise.all(promises);
  
    this.scrollToSavedPosition();
  
    if(this.settings.loader) {
      this.removeLoader();
    }
  }
  
  
  scrollToSavedPosition() {
    const savedPosition = sessionStorage.getItem('scrollPosition');
    if (savedPosition) {
      console.log('scrolling to saved position');
      window.scrollTo({ top: savedPosition, behavior: 'smooth' });
      sessionStorage.removeItem('scrollPosition');
    }
  }
  
  loadMore() {
    this.request = new XMLHttpRequest();
  
    this.request.onreadystatechange = function success() {
      if (!this.request.responseXML) { return; }
      if (!this.request.readyState === 4 || !this.request.status === 200) { return; }
  
      const newContainer = this.request.responseXML.querySelectorAll(this.settings.container)[0];
      const newPagination = this.request.responseXML.querySelectorAll(this.settings.pagination)[0];
  
      this.containerElement.insertAdjacentHTML('beforeend', newContainer.innerHTML);
  
      if (typeof newPagination === 'undefined') {
        if (this.settings.saveHistory) {
          window.history.pushState({ path: this.nextPageUrl }, '', this.nextPageUrl);
        }
        this.removePaginationElement();
      } else {
        this.paginationElement.innerHTML = newPagination.innerHTML;
  
        if (this.settings.saveHistory) {
          window.history.pushState({ path: this.nextPageUrl }, '', this.nextPageUrl);
        }
  
        if (this.settings.callback && typeof this.settings.callback === 'function') {
          this.settings.callback(this.request.responseXML);
        }
  
        this.initialize();
      }
    }.bind(this);
  
    this.request.open('GET', this.nextPageUrl);
    this.request.responseType = 'document';
    this.request.send();
  }
  
  removeClickListener() {
    this.nextPageLinkElement.removeEventListener('click', this.preventMultipleClicks);
  }
  
  removePaginationElement() {
    this.paginationElement.innerHTML = '';
    this.destroy();
  }
  
  removeScrollListener() {
    document.removeEventListener('scroll', this.checkIfPaginationInView);
    window.removeEventListener('resize', this.checkIfPaginationInView);
    window.removeEventListener('orientationchange', this.checkIfPaginationInView);
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