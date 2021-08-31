# Unique Session

Easily protect your clients from session hijacking.

[![.github/workflows/build.yml](https://github.com/molaga/unique-session/actions/workflows/build.yml/badge.svg)](https://github.com/molaga/unique-session/actions/workflows/build.yml)
<span class="badge-npmversion"><a href="https://npmjs.org/package/unique-session" title="View this project on NPM"><img src="https://img.shields.io/npm/v/unique-session.svg" alt="NPM version" /></a></span>

## Motivation

The most ancient method of using a hijacked cookie in order to takeover the end-user session should be gone already.

Once a session is created on the BE, we create a unique hash signature with all the relevant user-specific identifications such as User Agent to client's country by IP. if this session is being use by a different client/machine/country, the session will be immediatly destroyed.

## Key Features

- Protect your client almost entirely from hijacking his session
- Super light & straight-forward, ~4 KB (unpacked)
- Plug & play - zero configuration
- StronglyTyped with build-in Typescript typings
- Fully customizable with flex configuration

## Usage

#### 1. Install the package

```
$ npm install -S unique-session
```

#### 2. Integrate with your app

```js
const app = express();
const uniqueSession = require('unique-session');

// ...

app.use(uniqueSession());

// ... rest of routes and stuff ...

app.listen(process.env.PORT || 8080);
```

That's it.

#### Optional configuration

```js

const options = {
    hashFields: ['accept', 'accept-language', 'user-agent'], // which keys to pick from request.headers
    ipField: 'headers.x-forwarded-for', // the IP target path on your BE request
    redirectTo: '/logout-reported' // where do redirect the user after malicious activity (default '/') 
};

app.use(uniqueSession(options));
```

## Debugging

In order to have visibility on what's going on in the background requests on the server, you can simply set the DEBUG environment variable to start seeing relevant logs fired from this package

You might want to see that all the relevant fields such as IP and headers are correctly passed for the hash signature. this could be easily achieved with -

```
$ DEBUG=unique-session* node app.js
```

Then you'll see variety logs such as -

- Which configuration were loaded
- Raw payload before the generated hash signature
- The result hash signature
- In case of malicious activity, you'll get an indication log