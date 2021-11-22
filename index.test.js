const vars = require('./utils').vars;
const mixins = require('./utils').mixins;
const {
    RULE_USE_VARS,
    RULE_USE_ONE_OF_VARS,
    RULE_USE_MIXINS,
    RULE_USE_ONE_OF_MIXINS,
    messages,
    RULE_DO_NOT_USE_DARK_COLORS,
} = require('.');

testRule({
    plugins: [RULE_USE_VARS],
    ruleName: RULE_USE_VARS,
    config: true,
    fix: true,
    accept: [
        {
            code: `.class {
                padding-left: var(--gap-2xs);
            }`,
            description: 'singleline rule with single value',
        },
        {
            code: `.class {
                padding: var(--gap-xs) 0 var(--gap-m) 0;
            }`,
            description: 'singleline rule with multiple values',
        },
        {
            code: `.class {
                margin-top: var(--gap-xs);
                margin-bottom: var(--gap-l);
            }`,
            description: 'multiline rule',
        },
        {
            code: `.class {
                padding: var(--gap-xs) 0 var(--gap-m) 0;
                margin: var(--gap-l);
            }`,
            description: 'multiline rule',
        },
        {
            code: `.class {
                .inner {
                    padding: var(--gap-xs) 0 var(--gap-m) 0;
                    margin: var(--gap-l);
                }
            }`,
            description: 'nested rule',
        },
        {
            code: `.class {
                padding-left: 3px;
                color: #000;
            }`,
            description: 'custom value',
        },
        {
            code: `.class {
                box-shadow: 0 0 8px #B000B5, 0 0 8px #BADA55,
                0 4px 8px #C0FFEE;
            }`,
            description: 'singleline rule with multiline value',
        },
        {
            code: `.class {
                background-color: var(--color-light-bg-primary);
                background: var(--color-light-bg-primary);
                color: var(--color-light-text-primary);
            }`,
            description: 'colors',
        },
        {
            code: `.class {
                border-radius: var(--border-radius-s);
                border-radius: var(--border-radius-m);
                border-radius: var(--border-radius-l);
                border-radius: var(--border-radius-xl);
                border-radius: var(--border-radius-circle);
                border-radius: var(--border-radius-pill);
                border-top-left-radius: var(--border-radius-s);
                border-top-right-radius: var(--border-radius-s);
                border-bottom-left-radius: var(--border-radius-s);
                border-bottom-right-radius: var(--border-radius-s);
            }`,
            description: 'border-radius',
        },
        {
            code: `.class {
                background-color: #fff;
                background: #fff;
                border: 1px solid #0b1f35;
            }`,
            description: 'not exact match',
        },
    ],
    reject: [
        {
            code: `.class {\n    padding-top: 8px;\n}`,
            fixed: `.class {\n    padding-top: var(--gap-xs);\n}`,
            description: 'hardcode single gap',
            message: messages[RULE_USE_VARS].expected(['--gap-xs'], '8px'),
            line: 2,
            column: 18,
        },
        {
            code: `.class {\n    padding: 8px 12px 4px 16px;\n}`,
            fixed: `.class {\n    padding: var(--gap-xs) var(--gap-s) var(--gap-2xs) var(--gap-m);\n}`,
            description: 'hardcode multiple gaps',
            warnings: [
                {
                    message: messages[RULE_USE_VARS].expected(['--gap-2xs'], '4px'),
                    line: 2,
                    column: 23,
                },
                {
                    message: messages[RULE_USE_VARS].expected(['--gap-xs'], '8px'),
                    line: 2,
                    column: 14,
                },
                {
                    message: messages[RULE_USE_VARS].expected(['--gap-s'], '12px'),
                    line: 2,
                    column: 18,
                },
                {
                    message: messages[RULE_USE_VARS].expected(['--gap-m'], '16px'),
                    line: 2,
                    column: 27,
                },
            ],
        },
        {
            code: `.class {
                .inner {
                    padding: 8px 12px 4px 16px;
                }
            }`,
            fixed: `.class {
                .inner {
                    padding: var(--gap-xs) var(--gap-s) var(--gap-2xs) var(--gap-m);
                }
            }`,
            description: 'hardcode nested rule',
            warnings: [
                {
                    message: messages[RULE_USE_VARS].expected(['--gap-2xs'], '4px'),
                    line: 3,
                    column: 39,
                },
                {
                    message: messages[RULE_USE_VARS].expected(['--gap-xs'], '8px'),
                    line: 3,
                    column: 30,
                },
                {
                    message: messages[RULE_USE_VARS].expected(['--gap-s'], '12px'),
                    line: 3,
                    column: 34,
                },
                {
                    message: messages[RULE_USE_VARS].expected(['--gap-m'], '16px'),
                    line: 3,
                    column: 43,
                },
            ],
        },
        {
            code: `.class {\n    box-shadow: 0 0 4px rgba(11, 31, 53, 0.02), 0 2px 4px rgba(11, 31, 53, 0.04);\n}`,
            fixed: `.class {\n    box-shadow: var(--shadow-xs);\n}`,
            description: 'hardcode singleline shadow',
            message: messages[RULE_USE_VARS].expected(
                ['--shadow-xs'],
                '0 0 4px rgba(11, 31, 53, 0.02), 0 2px 4px rgba(11, 31, 53, 0.04)'
            ),
            line: 2,
            column: 17,
        },
        {
            code: `.class {\n    box-shadow: 0 0 4px rgba(11, 31, 53, 0.02), 0 2px 4px rgba(11, 31, 53, 0.04),
                0 2px 4px rgba(11, 31, 53, 0.16);\n}`,
            fixed: `.class {\n    box-shadow: var(--shadow-xs-hard);\n}`,
            description: 'hardcode multiline shadow',
            message: messages[RULE_USE_VARS].expected(
                ['--shadow-xs-hard'],
                '0 0 4px rgba(11, 31, 53, 0.02), 0 2px 4px rgba(11, 31, 53, 0.04), 0 2px 4px rgba(11, 31, 53, 0.16)'
            ),
            line: 2,
            column: 17,
        },
        {
            code: `.class {\n    color: #0b1f35;\n}`,
            fixed: `.class {\n    color: var(--color-light-text-primary);\n}`,
            description: 'hardcode single color',
            message: messages[RULE_USE_VARS].expected(['--color-light-text-primary'], '#0b1f35'),
            line: 2,
            column: 12,
        },
        {
            code: `.class {\n    padding-top: 8px;\n    box-shadow: 0 0 4px rgba(11, 31, 53, 0.02), 0 2px 4px rgba(11, 31, 53, 0.04);\n}`,
            fixed: `.class {\n    padding-top: var(--gap-xs);\n    box-shadow: var(--shadow-xs);\n}`,
            description: 'hardcode multiple props',
            warnings: [
                {
                    message: messages[RULE_USE_VARS].expected(['--gap-xs'], '8px'),
                    line: 2,
                    column: 18,
                },
                {
                    message: messages[RULE_USE_VARS].expected(
                        ['--shadow-xs'],
                        '0 0 4px rgba(11, 31, 53, 0.02), 0 2px 4px rgba(11, 31, 53, 0.04)'
                    ),
                    line: 3,
                    column: 17,
                },
            ],
        },
        {
            code: `.class {\n    border-radius: 8px;\n    border-top-left-radius: 4px;\n}`,
            fixed: `.class {\n    border-radius: var(--border-radius-m);\n    border-top-left-radius: var(--border-radius-s);\n}`,
            description: 'hardcode border-radius',
            warnings: [
                {
                    message: messages[RULE_USE_VARS].expected(['--border-radius-m'], '8px'),
                    line: 2,
                    column: 20,
                },
                {
                    message: messages[RULE_USE_VARS].expected(['--border-radius-s'], '4px'),
                    line: 3,
                    column: 29,
                }
            ]
        },
        ...Object.entries(vars.gaps).map(([value, vars]) => {
            const gapVar = vars[0];

            const props = [
                'padding',
                'margin',
                'padding-left',
                'padding-right',
                'padding-top',
                'padding-bottom',
                'margin-left',
                'margin-right',
                'margin-top',
                'margin-bottom',
            ];

            return {
                code: `.class {
                    ${props.map((prop) => `${prop}: ${value};`).join('\n')}
                }`,
                fixed: `.class {
                    ${props.map((prop) => `${prop}: var(${gapVar});`).join('\n')}
                }`,
                description: `should use ${gapVar}`,
                warnings: props.map((_) => ({
                    message: messages[RULE_USE_VARS].expected([gapVar], value),
                })),
            };
        }),
        ...Object.entries(vars.shadows).map(([value, vars]) => {
            const shadowVar = vars[0];

            return {
                code: `.class {
                    box-shadow: ${value};
                }`,
                fixed: `.class {
                    box-shadow: var(${shadowVar});
                }`,
                description: `should use ${shadowVar}`,
                message: messages[RULE_USE_VARS].expected([shadowVar], value),
            };
        }),
    ],
});

testRule({
    plugins: [RULE_USE_ONE_OF_VARS],
    ruleName: RULE_USE_ONE_OF_VARS,
    config: true,
    fix: true,
    accept: [
        {
            code: `.class {
                padding-left: var(--gap-2xs);
            }`,
            description: 'singleline rule with single value',
        },
        {
            code: `.class {
                padding: var(--gap-xs) 0 var(--gap-m) 0;
            }`,
            description: 'singleline rule with multiple values',
        },
        {
            code: `.class {
                margin-top: var(--gap-xs);
                margin-bottom: var(--gap-l);
            }`,
            description: 'multiline rule',
        },
        {
            code: `.class {
                padding: var(--gap-xs) 0 var(--gap-m) 0;
                margin: var(--gap-l);
            }`,
            description: 'multiline rule',
        },
        {
            code: `.class {
                .inner {
                    padding: var(--gap-xs) 0 var(--gap-m) 0;
                    margin: var(--gap-l);
                }
            }`,
            description: 'multiline nested rule',
        },
        {
            code: `.class {
                padding-left: 3px;
                color: #000;
            }`,
            description: 'custom value',
        },
        {
            code: `.class {
                box-shadow: 0 0 8px #B000B5, 0 0 8px #BADA55,
                0 4px 8px #C0FFEE;
            }`,
            description: 'singleline rule with multiline value',
        },
        {
            code: `.class {
                background-color: var(--color-light-bg-primary);
                background: var(--color-light-bg-primary);
                color: var(--color-light-text-primary);
            }`,
            description: 'colors',
        },
        {
            code: `.class {
                border-radius: var(--border-radius-s);
                border-radius: var(--border-radius-m);
                border-radius: var(--border-radius-l);
                border-radius: var(--border-radius-xl);
                border-radius: var(--border-radius-circle);
                border-radius: var(--border-radius-pill);
                border-top-left-radius: var(--border-radius-s);
                border-top-right-radius: var(--border-radius-s);
                border-bottom-left-radius: var(--border-radius-s);
                border-bottom-right-radius: var(--border-radius-s);
            }`,
            description: 'border-radius',
        },
    ],
    reject: [
        {
            code: `.class {
                background-color: #fff;
                background: #fff;
                border: 1px solid #0b1f35;
            }`,
            fixed: `.class {
                background-color: #fff;
                background: #fff;
                border: 1px solid #0b1f35;
            }`,
            unfixable: true,
            description: 'hardcode colors',
            warnings: [
                {
                    column: 35,
                    line: 2,
                    message: messages[RULE_USE_ONE_OF_VARS].expected(
                        [
                            '--color-light-bg-primary',
                            '--color-light-specialbg-secondary-grouped',
                            '--color-light-graphic-primary-inverted',
                        ],
                        '#fff'
                    ),
                },
                {
                    column: 29,
                    line: 3,
                    message: messages[RULE_USE_ONE_OF_VARS].expected(
                        [
                            '--color-light-bg-primary',
                            '--color-light-specialbg-secondary-grouped',
                            '--color-light-graphic-primary-inverted',
                        ],
                        '#fff'
                    ),
                },
                {
                    column: 35,
                    line: 4,
                    message: messages[RULE_USE_ONE_OF_VARS].expected(
                        [
                            '--color-light-border-key',
                            '--color-light-graphic-primary',
                            '--color-light-bg-primary-inverted',
                        ],
                        '#0b1f35'
                    ),
                },
            ],
        },
        {
            code: `.class {
                .inner {
                    background-color: #fff;
                    background: #fff;
                    border: 1px solid #0b1f35;
                }
            }`,
            fixed: `.class {
                .inner {
                    background-color: #fff;
                    background: #fff;
                    border: 1px solid #0b1f35;
                }
            }`,
            unfixable: true,
            description: 'hardcode colors in nested rule',
            warnings: [
                {
                    column: 39,
                    line: 3,
                    message: messages[RULE_USE_ONE_OF_VARS].expected(
                        [
                            '--color-light-bg-primary',
                            '--color-light-specialbg-secondary-grouped',
                            '--color-light-graphic-primary-inverted',
                        ],
                        '#fff'
                    ),
                },
                {
                    column: 33,
                    line: 4,
                    message: messages[RULE_USE_ONE_OF_VARS].expected(
                        [
                            '--color-light-bg-primary',
                            '--color-light-specialbg-secondary-grouped',
                            '--color-light-graphic-primary-inverted',
                        ],
                        '#fff'
                    ),
                },
                {
                    column: 39,
                    line: 5,
                    message: messages[RULE_USE_ONE_OF_VARS].expected(
                        [
                            '--color-light-border-key',
                            '--color-light-graphic-primary',
                            '--color-light-bg-primary-inverted',
                        ],
                        '#0b1f35'
                    ),
                },
            ],
        },
    ],
});

testRule({
    plugins: [RULE_USE_MIXINS],
    ruleName: RULE_USE_MIXINS,
    config: true,
    fix: true,
    accept: [
        {
            code: `.class {
                @mixin headline_xlarge;
            }`,
            description: 'typography',
        },
        {
            code: `.class {
                font-size: 14px;
            }`,
            description: 'not exact match',
        },
        {
            code: `.class {
                .inner {
                    @mixin headline_xlarge;
                }
            }`,
            description: 'typography nested rule',
        },
    ],
    reject: [
        {
            code: `.class {
                background-color: var(--color-light-bg-primary);
                font-size: 48px;
                line-height: 64px;
                background: var(--color-light-bg-primary);
                font-weight: 500;
                color: var(--color-light-text-primary);
            }`,
            fixed: `.class {
                @mixin headline_xlarge;
                background-color: var(--color-light-bg-primary);
                background: var(--color-light-bg-primary);
                color: var(--color-light-text-primary);
            }`,
            description: 'typography',
            message: messages[RULE_USE_MIXINS].expected([{ name: 'headline_xlarge' }]),
            line: 3,
            column: 17,
        },
        {
            code: `.class {
                font-size: 48px;
                line-height: 64px;
                font-weight: 500;
            }`,
            fixed: `.class {
                @mixin headline_xlarge;
            }`,
            description: 'typography',
            message: messages[RULE_USE_MIXINS].expected([{ name: 'headline_xlarge' }]),
            line: 2,
            column: 17,
        },
        {
            code: `.class {
                font-size: 14px;
                line-height: 20px;
                font-weight: 400;
            }`,
            fixed: `.class {
                @mixin paragraph_primary_small;
            }`,
            description: 'typography',
            message: messages[RULE_USE_MIXINS].expected([{ name: 'paragraph_primary_small' }]),
            line: 2,
            column: 17,
        },
        {
            code: `.class {
                .inner {
                    font-size: 48px;
                    line-height: 64px;
                    font-weight: 500;
                }
            }`,
            fixed: `.class {
                .inner {
                    @mixin headline_xlarge;
                }
            }`,
            description: 'typography nested rule',
            message: messages[RULE_USE_MIXINS].expected([{ name: 'headline_xlarge' }]),
            line: 3,
            column: 21,
        },
    ],
});

testRule({
    plugins: [RULE_USE_ONE_OF_MIXINS],
    ruleName: RULE_USE_ONE_OF_MIXINS,
    config: true,
    fix: true,
    accept: [
        {
            code: `.class {
                @mixin headline_xlarge;
            }`,
            description: 'typography',
        },
    ],
    reject: [
        {
            code: `.class {
                font-size: 14px;
                line-height: 20px;
            }`,
            fixed: `.class {
                font-size: 14px;
                line-height: 20px;
            }`,
            unfixable: true,
            description: 'typography',
            message: messages[RULE_USE_ONE_OF_MIXINS].expected([
                {
                    name: 'paragraph_primary_small',
                    props: mixins.typography['paragraph_primary_small'],
                },
                { name: 'accent_primary_small', props: mixins.typography['accent_primary_small'] },
                { name: 'action_primary_small', props: mixins.typography['action_primary_small'] },
            ]),
            line: 2,
            column: 17,
        },
        {
            code: `.class {
                font-size: 14px;
            }`,
            fixed: `.class {
                font-size: 14px;
            }`,
            unfixable: true,
            description: 'typography',
            message: messages[RULE_USE_ONE_OF_MIXINS].expected([
                {
                    name: 'paragraph_primary_small',
                    props: mixins.typography['paragraph_primary_small'],
                },
                { name: 'accent_primary_small', props: mixins.typography['accent_primary_small'] },
                { name: 'action_primary_small', props: mixins.typography['action_primary_small'] },
            ]),
            line: 2,
            column: 17,
        },
        {
            code: `.class {
                .inner {
                    font-size: 14px;
                }
            }`,
            fixed: `.class {
                .inner {
                    font-size: 14px;
                }
            }`,
            unfixable: true,
            description: 'typography nested rule',
            message: messages[RULE_USE_ONE_OF_MIXINS].expected([
                {
                    name: 'paragraph_primary_small',
                    props: mixins.typography['paragraph_primary_small'],
                },
                { name: 'accent_primary_small', props: mixins.typography['accent_primary_small'] },
                { name: 'action_primary_small', props: mixins.typography['action_primary_small'] },
            ]),
            line: 3,
            column: 21,
        },
    ],
});

testRule({
    plugins: [RULE_DO_NOT_USE_DARK_COLORS],
    ruleName: RULE_DO_NOT_USE_DARK_COLORS,
    config: true,
    fix: true,
    accept: [
        {
            code: `.class {
                color: var(--color-light-text-primary);
                border: 1px solid var(--color-light-border-primary);
            }`,
            description: 'allowed colors',
        },
        {
            code: `.class {
                color: var(--color-dark-indigo);
            }`,
            description: 'old colors',
        },
    ],
    reject: [
        {
            code: `.class {
                color: var(--color-dark-text-primary);
                border: 1px solid var(--color-dark-border-primary);
            }`,
            fixed: `.class {
                color: var(--color-dark-text-primary);
                border: 1px solid var(--color-dark-border-primary);
            }`,
            unfixable: true,
            description: 'dark colors',
            warnings: [
                {
                    column: 28,
                    line: 2,
                    message: messages[RULE_DO_NOT_USE_DARK_COLORS].expected(),
                },
                {
                    column: 39,
                    line: 3,
                    message: messages[RULE_DO_NOT_USE_DARK_COLORS].expected(),
                },
            ],
        },
    ],
});
