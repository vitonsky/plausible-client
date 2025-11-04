[![](https://img.shields.io/npm/v/plausible-client.svg)](https://www.npmjs.com/package/plausible-client) ![](https://img.shields.io/bundlejs/size/plausible-client) ![](https://img.shields.io/npm/l/plausible-client) [![](https://img.shields.io/github/contributors/vitonsky/plausible-client
)](https://github.com/vitonsky/plausible-client/graphs/contributors)

Plausible client to collect analytics in browser with no hassle.

# Why?

There are official [`plausible-tracker` package](https://github.com/plausible/plausible-tracker), it have quite few code, but have a lot of bugs like
- "enableAutoOutboundTracking breaks target="_blank" and probably noopener security" [#12](https://github.com/plausible/plausible-tracker/issues/12)
- uses XHR API that loses analytics on static sites with no SPA approach (like [Astro](https://astro.build/) does) [#16](https://github.com/plausible/plausible-tracker/issues/16)
- uses callbacks, that will not be called on localhost, that force users write code that works different locally and on production

![](./assets/plausible-tracker-maintenance.png)

Current package is lightweight too, but written and maintained by those who use a plausible analytics on production. See [dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food).

# Usage

Install package with `npm i plausible-client`

Create instance and play

```ts
import { Plausible } from 'plausible-client';

const plausible = new Plausible({
	apiHost: 'https://plausible.io',
	domain: 'example.org',
});

plausible.sendEvent('test', {
  props: {
    foo: 1,
    bar: 'string',
    baz: null,
  },
  revenue: {
    currency: 'USD',
    amount: 5,
  },
});
```

## Automatically track pageviews

To track page views automatically, call `enableAutoPageviews`:

```ts
import { Plausible, enableAutoPageviews } from 'plausible-client';

const plausible = new Plausible({
  apiHost: 'https://plausible.io',
  domain: 'example.org',
});

// Function returns cleanup callback and starts track pageviews
enableAutoPageviews(plausible);
```

## Automatically track outbound clicks

To track outbound clicks automatically, call `enableAutoOutboundTracking`:

```ts
import { Plausible, enableAutoOutboundTracking } from 'plausible-client';

const plausible = new Plausible({
  apiHost: 'https://plausible.io',
  domain: 'example.org',
});

// Function returns cleanup callback and starts track outbound clicks
enableAutoOutboundTracking(plausible);
```

## Filter events

You may filter out specific events.

It may be useful to skip events of users who should not be tracked, ignore irrelevant events by its props, and for development purposes.

Just define predicate `filter` in config:
- it receive event object as first parameter and event name as second
- it must return `true` to send request and `false` to skip

```ts
import { Plausible } from 'plausible-client';

const plausible = new Plausible({
  apiHost: 'https://plausible.io',
  domain: 'example.org',
  filter(event, eventName) {
    // Skip all events while development
    if (location.hostname === 'localhost') {
      console.warn('Analytics event is skipped, since run on localhost', event);
      return false;
    }

    // Skip all events for users who don't want to be tracked
    if (window.localStorage.plausible_ignore === 'true') return false;

    // Skip events by event props
    if (event.props.group === 'no-track') return false;

    // Skip events by its name, for users who does not participate in preview program
    if (!event.props.previewEnabled && eventName.startsWith('preview:')) return false;

    // Pass all events otherwise
    return true;
  }
});
```

### Default filters

You may use default filters

```ts
import { Plausible, filters, skipByFlag, skipForHosts } from 'plausible-client';

const plausible = new Plausible({
  apiHost: 'https://plausible.io',
  domain: 'example.org',
  filter: filters(
    // Ignore events if flag is set as 'true' in provided storage
    skipByFlag('plausible_ignore', localStorage),
    // Ignore events sent from listed hostnames
    skipForHosts(['localhost'])
  )
});
```

## Transform events

You may transform events.

It may be useful to enrich events data or redact some collected data.

Just define option `transform` in config
- it receive event object and event name
- it must return new event object.

```ts
import { Plausible } from 'plausible-client';

const plausible = new Plausible({
  apiHost: 'https://plausible.io',
  domain: 'example.org',
  transform(event, eventName) {
    event.props = {
      ...event.props,
      group: 'clients',
      userId: event.props.uid ? "uuid:" + event.props.uid : undefined,
      isPreferDarkTheme: window.matchMedia("(prefers-color-scheme: dark)").matches,
    };

    return event;
  }
});
```

Transformation hook runs after filter.

### Inject user ID

You may automatically inject user id to all events via default transformer:

```ts
import { Plausible, userId } from 'plausible-client';

const plausible = new Plausible({
  apiHost: 'https://plausible.io',
  domain: 'example.org',
  transform: userId(),
});
```

If no config provided to a transformer, user ID will be persist in `localStorage` with key `plausible_uid`.

You may customize how user ID is stored via `storage` option. You may pass any implementation of [`Storage`](https://developer.mozilla.org/docs/Web/API/Storage) like `localStorage` or `sessionStorage`.

Also you may pass `CookieStorage` that implements `Storage` interface.

```ts
import { Plausible, userId, BrowserUIDStorage, CookieStorage } from 'plausible-client';

const plausible = new Plausible({
  apiHost: 'https://plausible.io',
  domain: 'example.org',

  // User ID will be persist in localStorage with key `plausible_uid`
  transform: userId({ 
    storage: new BrowserUIDStorage({
      // Store UID in JS cookies
      store: CookieStorage(),
      // Customize storage key to persist ID
      key: 'uid'
    }),
  }),
});
```

# Development

`plausible-client` is an truth open source project, so you are welcome on [project github repository](https://github.com/vitonsky/plausible-client/) to contribute a code, [make issues](https://github.com/vitonsky/plausible-client/issues/new/choose) with feature requests and bug reports.

You may contribute to a project if you tell about `plausible-client` to your friends.