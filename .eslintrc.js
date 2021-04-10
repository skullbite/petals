module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "indent": [
            "error",
            4
        ],
        "prefer-const": [
            "error"
        ],
        "no-multiple-empty-lines": [
            "error",
            { "max": 1, "maxEOF": 0 }
        ],
        "@typescript-eslint/explicit-function-return-type": [ 
            "off" 
        ],
        "comma-dangle": [
            "error"
        ],
        "@typescript-eslint/no-unused-vars": [
            "error"
        ],
        "no-case-declarations": [
            "off"
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "never"
        ]
    }
}
