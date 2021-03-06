# Rump tweets
 
### Build status
[![Production](https://travis-ci.com/Capdt/rumptweets.svg?token=AxChYBy4KoAyjsd75Ua6&branch=master)](https://travis-ci.com/Capdt/rumptweets)

 ___
This is the Web app for Rump Tweets. the application uses the prpl pattern to load 
pages the html pages and loads the pages into the index.html page so it's one 
file.

The PRPL pattern, in a nutshell:

* **Push** components required for the initial route
* **Render** initial route ASAP
* **Pre-cache** components for remaining routes
* **Lazy-load** and progressively upgrade next routes on-demand


### Setup

##### Prerequisites

First, install [Polymer CLI](https://github.com/Polymer/polymer-cli) using
[npm](https://www.npmjs.com).
    
    nvm install v6.10.10 #use nvm to install node 6.
    npm install -g polymer-cli@0.18.1
    npm install -g bower@1.8.0

##### Clone this repository

    mkdir webapps
    cd webapps
    git clone https://remote_server_location.git

You cana also use the git for desktop software to clone the project.

### Start the development server

This command serves the app at `http://localhost:8080` and provides basic URL
routing for the app:

    polymer serve --open

### Build

This command performs HTML, CSS, and JS minification on the application
dependencies, and generates a service-worker.js file with code to pre-cache the
dependencies based on the entrypoint and fragments specified in `polymer.json`.
The minified files are output to the `build/unbundled` folder, and are suitable
for serving from a HTTP/2+Push compatible server.

In addition the command also creates a fallback `build/bundled` folder,
generated using fragment bundling, suitable for serving from non
H2/push-compatible servers or to clients that do not support H2/Push.

    polymer build

### Preview the build

This command serves the minified version of the app at `http://localhost:8080`
in an unbundled state, as it would be served by a push-compatible server:

    polymer serve build/unbundled

This command serves the minified version of the app at `http://localhost:8080`
generated using fragment bundling:

    polymer serve build/bundled

### Run tests

This command will run [Web Component Tester](https://github.com/Polymer/web-component-tester)
against the browsers currently installed on your machine:

    polymer test

### Adding a new view

You can extend the app by adding more views that will be demand-loaded
e.g. based on the route, or to progressively render non-critical sections of the
application. Each new demand-loaded fragment should be added to the list of
`fragments` in the included `polymer.json` file. This will ensure those
components and their dependencies are added to the list of pre-cached components
and will be included in the `bundled` build.

Consider taking a look at the polymer getting started guide [here](https://www.polymer-project.org/1.0/start/toolbox/set-up) it's explains the structure of an app 
and how to create new pages.
