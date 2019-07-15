import { rangeToEquation, rangeToInterval, textToRange } from '..';
import test from 'ava';

[
    // Invalid input
    { input: null, interval: null, equation: null, name: 'null input' },
    { input: '', interval: null, equation: null, name: 'empty string' },
    {
        input: 'asdf',
        interval: null,
        equation: null,
        name: 'unparsable string'
    },

    // Numeric
    { input: 32, interval: '32', equation: '32', name: 'numeric input' },

    // Single number
    { input: ' 123 ', interval: '123' },
    { input: ' 12.34 ', interval: '12.34' },
    { input: '01', interval: null, name: 'octals are not supported' },
    { input: '0', interval: '0' },
    { input: '.345', interval: '0.345' },
    { input: '5.', interval: '5' },
    { input: '-57', interval: '-57' },
    { input: '-.2', interval: '-0.2' },

    // List of numbers
    { input: '2 3', interval: '2, 3', equation: '2, 3' },
    { input: ' 12, 4', interval: '12, 4' },
    { input: '4 ; 5 ', interval: '4, 5' },
    { input: '5+6', interval: '5, 6' },
    { input: '6 & 7 ', interval: '6, 7' },
    { input: '1, 2, 3', interval: '1, 2, 3' },
    { input: '1 or 2 and 3', interval: '1, 2, 3' },
    { input: '1 | 2 || 3', interval: '1, 2, 3' },
    { input: '1 & 2 && 3', interval: '1, 2, 3' },

    // Ranges
    { input: '9 to 13', interval: '[9,13]', equation: '>=9 <=13' },
    { input: ' 1..17 ', interval: '[1,17]' },
    { input: '4-8', interval: '[4,8]' },
    { input: '3:12', interval: '[3,12]' },
    { input: '-9--8', interval: '[-9,-8]' },
    { input: '2~3', interval: '[2,3]' },
    { input: '*-0', interval: '[-Infinity,0]', equation: '<=0' },
    { input: '0-$', interval: '[0,Infinity]', equation: '>=0' },
    { input: '- infinity TO INF', interval: '[-Infinity,Infinity]' },
    { input: 'x 2 - x 5', interval: '(2,5)' },

    // List of ranges
    { input: '1, 2', interval: '1, 2' },
    { input: '1-2 , 3..4', interval: '[1,2], [3,4]' },
    { input: '1:2+3to4', interval: '[1,2], [3,4]' },

    // Equations
    { input: '>10', interval: '(10,Infinity]' },
    { input: '<=10', interval: '[-Infinity,10]' },
    { input: '<51 >=27', interval: '[27,51)' },
    { input: '<5 >5', interval: null, name: 'conflicting operations' },
    { input: '=2', interval: '2' },
    { input: '==22', interval: '22' },

    // Equation Ranges
    { input: '1 <= x <= 12', interval: '[1,12]' },
    { input: '-3>x>-11', interval: '(-11,-3)' },

    // Intervals
    { input: '[1,2]', interval: '[1,2]' },
    { input: '(1,2)', interval: '(1,2)' },
    { input: '<1,2>', interval: '(1,2)' },
    { input: '{1,2}', interval: '(1,2)' },
    { input: ']1,2[', interval: '(1,2)' },

    // Functionality
    { input: '9 to 5', interval: '[5,9]', name: 'reversed min/max' },
    { input: '1, 6-7', interval: '1, [6,7]', name: 'mixed formats' },
    { input: '[3,4],[5,6] 7-8', interval: '[3,4], [5,6], [7,8]' }
].forEach(scenario => {
    test(scenario.name || `parses: ${JSON.stringify(scenario.input)}`, t => {
        const range = textToRange(scenario.input);
        const equation = rangeToEquation(range);
        const interval = rangeToInterval(range);

        if ('equation' in scenario) {
            t.is(equation, scenario.equation);
        }

        if ('interval' in scenario) {
            t.is(interval, scenario.interval);
        }
    });
});
