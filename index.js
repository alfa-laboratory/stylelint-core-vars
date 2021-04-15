const stylelint = require('stylelint');
const toOneLine = require('./utils').toOneLine;
const formatVar = require('./utils').formatVar;
const findVar = require('./utils').findVar;
const findTypographyMixin = require('./utils').findTypographyMixin;
const VARS_AVAILABLE = require('./utils').VARS_AVAILABLE;

const RULE_USE_VARS = 'stylelint-core-vars/use-vars';
const RULE_USE_ONE_OF_VARS = 'stylelint-core-vars/use-one-of-vars';
const RULE_USE_MIXINS = 'stylelint-core-vars/use-mixins';
const RULE_USE_ONE_OF_MIXINS = 'stylelint-core-vars/use-one-of-mixins';

const messages = {
    [RULE_USE_VARS]: stylelint.utils.ruleMessages(RULE_USE_VARS, {
        expected: (variable, value) => {
            return `Use variable '${variable}' instead of plain value '${value}'`;
        },
    }),
    [RULE_USE_ONE_OF_VARS]: stylelint.utils.ruleMessages(RULE_USE_ONE_OF_VARS, {
        expected: (variableOrVariables, value) => {
            const variables = Array.isArray(variableOrVariables)
                ? variableOrVariables
                : [variableOrVariables];

            const variablesPart = variables.map((v) => ` - ${v}`).join('\n');

            return `Use variables instead of plain value '${value}':\n${variablesPart}\n`;
        },
    }),
    [RULE_USE_MIXINS]: stylelint.utils.ruleMessages(RULE_USE_MIXINS, {
        expected: (mixin) => {
            return `Use mixin '${mixin.name}' instead of plain values`;
        },
    }),
    [RULE_USE_ONE_OF_MIXINS]: stylelint.utils.ruleMessages(RULE_USE_ONE_OF_MIXINS, {
        expected: (mixinOrMixins) => {
            const mixins = Array.isArray(mixinOrMixins) ? mixinOrMixins : [mixinOrMixins];

            const mixinsPart = mixins
                .map(({ name, props }) => ` - ${name} (${Object.values(props).join('|')})`)
                .join('\n');
            return `Use mixins instead of plain values:\n${mixinsPart}\n`;
        },
    }),
};

const checkVars = (decl, result, context, ruleName) => {
    const { prop, raws } = decl;

    let value = toOneLine(decl.value);

    let substitution;
    const previousValues = [];

    while ((substitution = findVar(value, prop))) {
        let fixed = false;

        const exactVar = Array.isArray(substitution.variable) === false;
        const fixedValue = formatVar(exactVar ? substitution.variable : substitution.variable[0]);

        value = value.replace(substitution.value, fixedValue);

        if (context.fix && exactVar) {
            decl.value = value;
            fixed = true;
        }

        const originalValueIndex = previousValues.reduce(
            (acc, sub) => (acc > sub.index + sub.diff ? acc - sub.diff : acc),
            substitution.index
        );

        const shouldReport = !fixed && (ruleName === RULE_USE_ONE_OF_VARS || exactVar);

        if (shouldReport) {
            stylelint.utils.report({
                result,
                ruleName,
                message: messages[ruleName].expected(substitution.variable, substitution.value),
                node: decl,
                word: value,
                index: originalValueIndex + prop.length + raws.between.length,
            });
        }

        previousValues.unshift({
            ...substitution,
            diff: fixedValue.length - substitution.value.length,
        });
    }
};

const checkTypography = (rule, result, context, ruleName) => {
    const typographyProps = rule.nodes.reduce((acc, node) => {
        if (['font-size', 'line-height', 'font-weight'].includes(node.prop)) {
            acc[node.prop] = node.value;
        }
        return acc;
    }, {});

    const hasTypography = 'font-size' in typographyProps;
    if (!hasTypography) return;

    const mixin = findTypographyMixin(typographyProps);

    if (!mixin) return;

    const exactMixin = Array.isArray(mixin) === false;

    let fixed = false;
    if (context.fix && exactMixin) {
        fixed = true;
        const { name, props } = mixin;

        const before = rule.nodes[0].raws.before;
        rule.walkDecls((decl) => {
            if (decl.prop in props) {
                decl.remove();
            }
        });

        rule.prepend(`${before}@mixin ${name};\n`);
    }

    const shouldReport =
        !fixed &&
        (ruleName === RULE_USE_ONE_OF_MIXINS || (ruleName === RULE_USE_MIXINS && exactMixin));

    if (shouldReport) {
        stylelint.utils.report({
            result,
            ruleName,
            message: messages[ruleName].expected(mixin),
            node: rule,
            word: 'font-size',
            index: 0,
        });
    }
};

module.exports = [
    stylelint.createPlugin(RULE_USE_VARS, (enabled, _, context) => {
        if (!enabled || !VARS_AVAILABLE) {
            return () => {};
        }

        return (root, result) => {
            root.walkRules((rule) => {
                rule.walkDecls((decl) => {
                    checkVars(decl, result, context, RULE_USE_VARS);
                });
            });
        };
    }),
    stylelint.createPlugin(RULE_USE_ONE_OF_VARS, (enabled, _, context) => {
        if (!enabled || !VARS_AVAILABLE) {
            return () => {};
        }

        return (root, result) => {
            root.walkRules((rule) => {
                rule.walkDecls((decl) => {
                    checkVars(decl, result, context, RULE_USE_ONE_OF_VARS);
                });
            });
        };
    }),
    stylelint.createPlugin(RULE_USE_MIXINS, (enabled, _, context) => {
        if (!enabled || !VARS_AVAILABLE) {
            return () => {};
        }

        return (root, result) => {
            root.walkRules((rule) => {
                checkTypography(rule, result, context, RULE_USE_MIXINS);
            });
        };
    }),
    stylelint.createPlugin(RULE_USE_ONE_OF_MIXINS, (enabled, _, context) => {
        if (!enabled || !VARS_AVAILABLE) {
            return () => {};
        }

        return (root, result) => {
            root.walkRules((rule) => {
                checkTypography(rule, result, context, RULE_USE_ONE_OF_MIXINS);
            });
        };
    }),
];

module.exports.messages = messages;
module.exports.RULE_USE_VARS = RULE_USE_VARS;
module.exports.RULE_USE_ONE_OF_VARS = RULE_USE_ONE_OF_VARS;
module.exports.RULE_USE_MIXINS = RULE_USE_MIXINS;
module.exports.RULE_USE_ONE_OF_MIXINS = RULE_USE_ONE_OF_MIXINS;
