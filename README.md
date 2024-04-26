[![Build Status](https://travis-ci.org/Elkfox/Ajaxinate.svg?branch=master)](https://travis-ci.org/Elkfox/Ajaxinate)

# Ajaxinate (Forked from Elkfox)

Ajax pagination plugin for Shopify themes

### Usage

1. Include in your `Ajaxinate` script.
```html
import {Ajaxinate} from 'fork-ajaxinate'
```
2. Initialize the plugin.

```html
 new Ajaxinate({
  container: '.ajaxinate',
  pagination: '.paginate-button',
  loadingText: 'Loading more...',
  method: 'click',
  saveHistory: true,
  loader: true
 });
```

### License

The code is available under an MIT License. All copyright notices must remain untouched.
