module.exports = {
    "plugins": ["react"],
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "parser": "babel-eslint",
    "settings": {
        "react": {
            "version": "detect"
        }
    },
    "env": {
        "browser": true,
        "es6": true
    },
    "rules": {
        "global-require": "off"
    }
};