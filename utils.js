const fs = require('fs');
const path = require('path');

const CORE_COMPONENTS_PACKAGE = '@alfalab/core-components';
const CORE_COMPONENTS_VARS_PACKAGE = '@alfalab/core-components-vars';
const VAR_RE = /(?:^|\n)\s+(--[-\w]+):\s*([\s\S]+?);/gm;
const MIXIN_RE = /@define-mixin (.*?) {(.*?)}/g;
const BORDERS = {
    ' ': null,
    ';': null,
    undefined: null,
};
const TYPOGRAPHY_PROPS = ['font-size', 'line-height', 'font-weight'];

const vars = {
    gaps: loadVars('gaps.css'),
    shadows: loadVars('shadows-indigo.css'),
    colors: loadVars('colors-indigo.css'),
    borderRadiuses: loadVars('border-radius.css'),
};

const colorsSet = Object.values(vars.colors).reduce((acc, vars) => {
    vars.forEach(colorVar => acc.add(colorVar));

    return acc;
}, new Set());

const mixins = {
    typography: loadMixins('typography.css'),
};

const varsByProperties = {
    padding: vars.gaps,
    'padding-top': vars.gaps,
    'padding-right': vars.gaps,
    'padding-bottom': vars.gaps,
    'padding-left': vars.gaps,
    margin: vars.gaps,
    'margin-top': vars.gaps,
    'margin-right': vars.gaps,
    'margin-bottom': vars.gaps,
    'margin-left': vars.gaps,
    'box-shadow': vars.shadows,
    color: vars.colors,
    background: vars.colors,
    'background-color': vars.colors,
    border: vars.colors,
    'border-top': vars.colors,
    'border-right': vars.colors,
    'border-bottom': vars.colors,
    'border-left': vars.colors,
    'border-radius': vars.borderRadiuses,
    'border-top-left-radius': vars.borderRadiuses,
    'border-top-right-radius': vars.borderRadiuses,
    'border-bottom-left-radius': vars.borderRadiuses,
    'border-bottom-right-radius': vars.borderRadiuses,
};

const VARS_AVAILABLE = Boolean(getInstalledVarsPackage()) || runInsideCoreComponents();

function getInstalledVarsPackage() {
    try {
        require.resolve(`${CORE_COMPONENTS_PACKAGE}/package.json`);
        return CORE_COMPONENTS_PACKAGE;
    } catch (e) {
        try {
            require.resolve(`${CORE_COMPONENTS_VARS_PACKAGE}/package.json`);
            return CORE_COMPONENTS_VARS_PACKAGE;
        } catch (e) {
            return false;
        }
    }
}

function runInsideCoreComponents() {
    try {
        const rootPackage = require(path.join(__dirname, '../../../package.json'));
        return rootPackage.name === CORE_COMPONENTS_PACKAGE;
    } catch (e) {
        console.log(e);
        return false;
    }
}

function resolveVarsFile(file) {
    const packageName = getInstalledVarsPackage();
    if (packageName) {
        const fullPath =
            packageName === CORE_COMPONENTS_PACKAGE
                ? `${packageName}/vars/${file}`
                : `${packageName}/${file}`;

        return fs.readFileSync(require.resolve(fullPath));
    } else {
        return fs.readFileSync(path.resolve(__dirname, `../../../packages/vars/src/${file}`));
    }
}

function loadVars(file) {
    const result = {};

    try {
        const css = resolveVarsFile(file);

        while ((match = VAR_RE.exec(css)) !== null) {
            const value = toOneLine(match[2]);

            if (!result[value]) {
                result[value] = [];
            }

            result[value].push(match[1]);
        }
    } catch (e) {
        console.error('Add @alfalab/core-components to project dependencies');
    }

    return result;
}

function loadMixins(file) {
    const result = {};

    try {
        const css = toOneLine(resolveVarsFile(file).toString());

        while ((match = MIXIN_RE.exec(css)) !== null) {
            const name = match[1];

            if (
                name.startsWith('system_') ||
                name.startsWith('styrene_') ||
                name.startsWith('legacy_')
            ) {
                continue;
            }

            const decls = match[2]
                .trim()
                .split(';')
                .filter((s) => s.trim())
                .reduce((acc, decl) => {
                    const [prop, value] = decl.split(/:\s+/);
                    acc[prop.trim()] = value.trim();
                    return acc;
                }, {});

            result[name] = decls;
        }
    } catch (e) {
        console.error('Add @alfalab/core-components to project dependencies');
    }

    return result;
}

function formatVar(variable) {
    return `var(${variable})`;
}

function findInValue(haystack, needle, fromIndex) {
    const index = haystack.indexOf(needle, fromIndex);

    return (
        index > -1 &&
        haystack[index - 1] in BORDERS &&
        haystack[index + needle.length] in BORDERS &&
        index
    );
}

function choiceVars(variables, prop, group) {
    if (group === 'colors') {
        const colorVariants = () => {
            switch (prop) {
                case 'color':
                    return ['text'];
                case 'background-color':
                case 'background':
                    return ['bg', 'specialbg', 'graphic'];
                case 'border':
                case 'border-top':
                case 'border-right':
                case 'border-bottom':
                case 'border-left':
                    return ['border', 'graphic', 'bg', 'specialbg'];
                default:
                    return [];
            }
        };

        const variants = colorVariants();

        const condition = (variable) =>
            variants.some((variant) => variable.startsWith(`--color-light-${variant}`));

        return sortVarsByUsage(variables, variants).filter(condition);
    }

    return variables;
}

function findVars(cssValue, prop) {
    const vars = varsByProperties[prop];
    if (!vars) return;

    const group = getVarsGroup(vars);

    for (const [value, variables] of Object.entries(vars)) {
        const chosen = choiceVars(variables, prop, group);

        if (!chosen || !chosen.length) continue;

        const index = findInValue(cssValue, value);

        if (index !== false) {
            return {
                index,
                value,
                variables: chosen,
            };
        }
    }
}

function findTypographyMixins(ruleProps) {
    const findMixin = (exact) => {
        return Object.entries(mixins.typography)
            .filter(([_, mixinProps]) => {
                if (exact) {
                    return TYPOGRAPHY_PROPS.every((prop) => ruleProps[prop] === mixinProps[prop]);
                } else {
                    return TYPOGRAPHY_PROPS.every(
                        (prop) => !ruleProps[prop] || ruleProps[prop] === mixinProps[prop]
                    );
                }
            })
            .map(([name, props]) => ({ name, props }));
    };

    const exact = findMixin(true);
    if (exact.length) {
        return exact;
    } else {
        const mixins = findMixin(false);
        return mixins.length > 0 ? mixins : null;
    }
}

function toOneLine(string) {
    return string.replace(/\s\s+/g, ' ').replace(/\n/g, '');
}

function getVarsGroup(varsSet) {
    return Object.keys(vars).find((group) => vars[group] === varsSet);
}

function sortVarsByUsage(arr, sortingArr) {
    return [...arr].sort(function (a, b) {
        const aUsage = a.slice(2).split('-')[2];
        const bUsage = b.slice(2).split('-')[2];
        const aIndex = sortingArr.indexOf(aUsage);
        const bIndex = sortingArr.indexOf(bUsage);
        if (aIndex === -1 || bIndex === -1) return 0;
        return aIndex - bIndex;
    });
}

module.exports.VARS_AVAILABLE = VARS_AVAILABLE;
module.exports.vars = vars;
module.exports.colorsSet = colorsSet;
module.exports.mixins = mixins;
module.exports.findVars = findVars;
module.exports.formatVar = formatVar;
module.exports.toOneLine = toOneLine;
module.exports.findTypographyMixins = findTypographyMixins;
