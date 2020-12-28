const stylelint = require('stylelint');
const toOneLine = require('./utils').toOneLine;
const formatVar = require('./utils').formatVar;
const findVar = require('./utils').findVar;
const findTypographyMixin = require('./utils').findTypographyMixin;

const ruleName = 'stylelint-core-vars/use-vars';

const messages = stylelint.utils.ruleMessages(ruleName, {
    expectedVar: (variable, value) => {
        return `Use variable '${variable}' instead of plain value '${value}'`;
    },
    expectedVars: (variables, value) => {
        const variablesPart = variables.map((v) => ` - ${v}`).join('\n');

        return `Use variables instead of plain value '${value}':\n${variablesPart}\n`;
    },
    expectedMixin: (mixin) => {
        return `Use mixin '${mixin}' instead of plain values`;
    },
    expectedMixins: (mixins) => {
        const mixinsPart = mixins
            .map(({ name, props }) => ` - ${name} (${Object.values(props).join('|')})`)
            .join('\n');
        return `Use mixins instead of plain values:\n${mixinsPart}\n`;
    },
});

const checkVars = (decl, result, context) => {
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

        const messageTemplate = exactVar ? messages.expectedVar : messages.expectedVars;

        if (!fixed) {
            stylelint.utils.report({
                result,
                ruleName,
                message: messageTemplate(substitution.variable, substitution.value),
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

const checkTypography = (rule, result, context) => {
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

    if (!fixed) {
        if (exactMixin) {
            stylelint.utils.report({
                result,
                ruleName,
                message: messages.expectedMixin(mixin.name),
                node: rule,
                word: 'font-size',
                index: 0,
            });
        } else {
            stylelint.utils.report({
                result,
                ruleName,
                message: messages.expectedMixins(mixin),
                node: rule,
                word: 'font-size',
                index: 0,
            });
        }
    }
};

module.exports = stylelint.createPlugin(ruleName, (_, _2, context) => {
    return (root, result) => {
        root.walkRules((rule) => {
            checkTypography(rule, result, context);

            rule.walkDecls((decl) => {
                checkVars(decl, result, context);
            });
        });
    };
});

module.exports.ruleName = ruleName;
module.exports.messages = messages;
