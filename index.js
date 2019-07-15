const patterns = {};
const patternSources = {};

function blankRange() {
    return makeRange(
        true,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        true
    );
}

function createRegExp(pattern) {
    const replacePattern = /{{([\w]+)}}/g;

    while (replacePattern.test(pattern)) {
        pattern = pattern.replace(replacePattern, (match, wanted) => {
            if (!patternSources[wanted]) {
                throw new Error(
                    `{{${wanted}}} not found during RegExp creation`
                );
            }

            return patternSources[wanted];
        });
    }

    return new RegExp(pattern, 'i');
}

function addPattern(name, pattern) {
    patternSources[name] = pattern;
    patterns[name] = createRegExp(pattern);
}

function setMinimum(range, number, inclusive) {
    if (range.min < number) {
        range.min = number;
        range.minInclusive = inclusive;
    } else if (range.min === number && range.minInclusive && !inclusive) {
        range.minInclusive = inclusive;
    }
}

function setMaximum(range, number, inclusive) {
    if (range.max > number) {
        range.max = number;
        range.maxInclusive = inclusive;
    } else if (range.max === number && range.maxInclusive && !inclusive) {
        range.maxInclusive = inclusive;
    }
}

function comparison(operator, number, range, lt, gt) {
    if (operator === '<') {
        lt(range, number, false);
    } else if (operator === '<=' || operator === '=<') {
        lt(range, number, true);
    } else if (operator === '=' || operator === '==') {
        lt(range, number, true);
        gt(range, number, true);
    } else if (operator === '>=' || operator === '=>') {
        gt(range, number, true);
    } else if (operator === '>') {
        gt(range, number, false);
    }
}

function rangeIsValid(range) {
    return (
        range.min < range.max ||
        (range.min === range.max && range.minInclusive && range.maxInclusive)
    );
}

function makeRange(minInclusive, min, max, maxInclusive) {
    if (patterns.infinityAnchored.test(min)) {
        min = Number.NEGATIVE_INFINITY;
    } else {
        min = +min;
    }

    if (patterns.infinityAnchored.test(max)) {
        max = Number.POSITIVE_INFINITY;
    } else {
        max = +max;
    }

    minInclusive = !!minInclusive;
    maxInclusive = !!maxInclusive;

    if (min > max) {
        let temp = min;
        min = max;
        max = temp;
        temp = minInclusive;
        minInclusive = maxInclusive;
        maxInclusive = temp;
    }

    return {
        minInclusive: minInclusive,
        min: min,
        max: max,
        maxInclusive: maxInclusive
    };
}

function or(list) {
    return {
        or: list
    };
}

function textToRange(input) {
    if (typeof input === 'number') {
        return makeRange(true, input, input, true);
    }

    if (typeof input !== 'string') {
        return null;
    }

    input = input.trim();

    for (const i of allowedFormats) {
        const matches = input.match(i.regExp);

        if (matches) {
            const result = i.handler(matches);

            if (result) {
                return result;
            }
        }
    }

    return null;
}

addPattern('space', '\\s');
addPattern('ws', '{{space}}?');
addPattern('digit', '\\d');
addPattern('integer', '[1-9]{{digit}}*|0');
addPattern('number', '-?(?:(?:{{integer}})(?:\\.{{digit}}*)?|\\.{{digit}}+)');
addPattern('infinity', '(?:\\*|\\$|(?:-{{ws}})?inf(?:inity)?)');
addPattern('infinityAnchored', '^{{infinity}}$');

addPattern('range', '{{ws}}(?:to|:|-|\\.\\.+|~){{ws}}');
addPattern('combine', '(?:,|&&|&|\\+|;|or|and|\\|\\||\\|)');
addPattern('combineOrWs', '(?:{{ws}}{{combine}}{{ws}}|{{space}}+)');
addPattern('rangeEnd', '(?:x{{ws}})?(?:{{number}}|{{infinity}})');
addPattern('numberRange', '{{rangeEnd}}{{range}}{{rangeEnd}}');
addPattern('matchNumberRange', '({{rangeEnd}}){{range}}({{rangeEnd}})');
addPattern('comparison', '(?:<=|>=|==|=<|=>|<|>|=)');
addPattern('simpleEquation', '{{comparison}}{{ws}}{{number}}');
addPattern(
    'matchSimpleEquationAnchored',
    '^{{ws}}({{comparison}}){{ws}}({{number}})'
);
addPattern('equation', '{{simpleEquation}}(?:{{ws}}{{simpleEquation}})*');
addPattern('equationVariableWs', '{{ws}}[a-z]*{{ws}}');
addPattern(
    'equationRange',
    '{{number}}{{ws}}{{comparison}}{{equationVariableWs}}{{comparison}}{{ws}}{{number}}'
);
addPattern(
    'matchEquationRange',
    '({{number}}){{ws}}({{comparison}}){{equationVariableWs}}({{comparison}}){{ws}}({{number}})'
);
addPattern('intervalStart', '(?:\\{|\\(|\\[|<|\\])');
addPattern('intervalEnd', '(?:\\}|\\)|\\]|>|\\[)');
addPattern('intervalSeparator', '(?:,|;|:)');
addPattern(
    'interval',
    '{{intervalStart}}{{ws}}{{number}}{{ws}}{{intervalSeparator}}{{ws}}{{number}}{{ws}}{{intervalEnd}}'
);
addPattern(
    'matchInterval',
    '({{intervalStart}}){{ws}}({{number}}){{ws}}{{intervalSeparator}}{{ws}}({{number}}){{ws}}({{intervalEnd}})'
);

addPattern('anything', '(?:{{number}}|{{numberRange}}|{{equation}}|{{equationRange}}|{{interval}})');
addPattern(
    'matchAnythingCombined',
    '({{anything}})((?:{{combineOrWs}}{{anything}})*)'
);

const allowedFormats = [
    {
        pattern: '{{matchAnythingCombined}}',
        handler: m => {
            // Some formats hit this pattern but don't have the second clause.
            // Can't make second clause mandatory otherwise those patterns fail.
            // For example, equation wants spaces between terms and would be parsed
            // as two equations instead of a single equation if matchAnythingCombined
            // changes the * near the end to a +.
            if (!m[2]) {
                return null;
            }

            const first = textToRange(m[1]);
            const unhandledInput = m[2].replace(patterns.combineOrWs, '');
            const rest = textToRange(unhandledInput);

            if (!rest) {
                return null;
            }

            if (rest.or) {
                return or([first, ...rest.or]);
            }

            return or([first, rest]);
        }
    },
    {
        pattern: '({{number}})',
        handler: m => {
            return makeRange(true, m[1], m[1], true);
        }
    },
    {
        pattern: '{{matchNumberRange}}',
        handler: m => {
            let minInclusive = true;
            let maxInclusive = true;
            let min = m[1];
            let max = m[2];

            if (min.charAt(0).toLowerCase() === 'x') {
                min = min.substr(1);
                minInclusive = false;
            }

            if (max.charAt(0).toLowerCase() === 'x') {
                max = max.substr(1);
                maxInclusive = false;
            }

            return makeRange(minInclusive, min, max, maxInclusive);
        }
    },
    {
        pattern: '{{equation}}',
        handler: m => {
            let input = m[0];
            const range = blankRange();
            let matches = input.match(patterns.matchSimpleEquationAnchored);

            while (matches) {
                comparison(
                    matches[1],
                    matches[2],
                    range,
                    setMaximum,
                    setMinimum
                );
                input = input.replace(matches[0], '');
                matches = input.match(patterns.matchSimpleEquationAnchored);
            }

            if (rangeIsValid(range)) {
                return range;
            }

            return null;
        }
    },
    {
        pattern: '{{matchEquationRange}}',
        handler: m => {
            const range = blankRange();

            comparison(m[2], m[1], range, setMinimum, setMaximum);
            comparison(m[3], m[4], range, setMaximum, setMinimum);

            if (rangeIsValid(range)) {
                return range;
            }

            return null;
        }
    },
    {
        pattern: '{{matchInterval}}',
        handler: m => {
            return makeRange(m[1] === '[', m[2], m[3], m[4] === ']');
        }
    }
];

for (const item of allowedFormats) {
    item.regExp = createRegExp(`^{{ws}}${item.pattern}{{ws}}$`);
}


function rangeToEquation(range) {
    if (!range || typeof range !== 'object') {
        return null;
    }

    if (range.or) {
        const values = range.or.map(r => rangeToEquation(r));

        return values.join(', ');
    }

    if (range.minInclusive && range.maxInclusive && range.min === range.max) {
        return range.min.toString();
    }

    const result = [];

    if (!range.minInclusive || range.min !== Number.NEGATIVE_INFINITY) {
        result.push((range.minInclusive ? '>=' : '>') + range.min.toString());
    }

    if (!range.maxInclusive || range.max !== Number.POSITIVE_INFINITY) {
        result.push((range.maxInclusive ? '<=' : '<') + range.max.toString());
    }

    return result.join(' ');
}


function rangeToInterval(range) {
    if (!range || typeof range !== 'object') {
        return null;
    }

    if (range.or) {
        const values = range.or.map(r => rangeToInterval(r));

        return values.join(', ');
    }

    if (range.minInclusive && range.maxInclusive && range.min === range.max) {
        return range.min.toString();
    }

    return [
        range.minInclusive ? '[' : '(',
        range.min.toString(),
        ',',
        range.max.toString(),
        range.maxInclusive ? ']' : ')'
    ].join('');
}


module.exports.textToRange = textToRange;
module.exports.rangeToEquation = rangeToEquation;
module.exports.rangeToInterval = rangeToInterval;
module.exports.default = textToRange;
