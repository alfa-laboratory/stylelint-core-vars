# stylelint-core-vars

[![NPM Version](https://img.shields.io/npm/v/stylelint-core-vars.svg)](https://www.npmjs.com/package/stylelint-core-vars)

[Stylelint](http://stylelint.io) плагин, проверяющий использование [дизайн-токенов](https://github.com/alfa-laboratory/core-components/tree/master/packages/vars/src)

## Установка

```
yarn add --dev stylelint stylelint-core-vars
```

или

```
npm install --save-dev stylelint stylelint-core-vars
```

## Использование

Добавьте в свой stylelint конфиг:

```
{
  "plugins": [
    "@alfalab/stylelint-core-vars"
  ],
  "rules": {
      "stylelint-core-vars/use-vars": true,
      "stylelint-core-vars/use-mixins": true,
      "stylelint-core-vars/use-one-of-vars": [
          true,
          {
              "severity": "warning"
          }
      ],
      "stylelint-core-vars/use-one-of-mixins": [
          true,
          {
              "severity": "warning"
          }
      ]
  },
}
```
