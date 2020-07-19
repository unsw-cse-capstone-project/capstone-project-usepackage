# Rexpack

Rexpack is a minimal Express, Webpack, & React boilerplate app that serves an image, adds some styling and some basic functionality, just to show everything working at the most basic level. This project can then be used as a template for other more complex apps.

Stack: Node (ES6+), Express, Webpack, React, Jest, and Enzyme that has Hot Module Reloading and can be deployed to Google App Engine with a single command. It has dev and prod builds, where the prod build outputs a minified, uglified bundle where images are encoded in Base64 directly into the css file.

Rexpack can be run locally on your machine, or pushed to Google App Engine Flexible Environment.

## Installation

    npm install

## Create a Development build

    npm run buildDev

## Create a Production build

    npm run buildProd

## Run the code on a local webserver

    npm start

Then navigate to `http://localhost:8080`

## Deploy to Google App Engine Flex

    npm run deploy

## Run test

    npm test

## Generate coverage report

    npm run coverage

## Run the backend on a local webserver

    npm run backend

The backend is located at `http://localhost:5000`
Please note: Simply running the backend won't work.
Ensure the following commands are executed
before running the backend:

    ttyd1: mongod
    ttyd2: mongo (followed by use usepackage)

