Text To Range
=============

Parse text range descriptions into objects with numerical ranges. It can handle many different formats of ranges and provides the results as a structured object.

Examples:

    import { rangeToEquation, rangeToInterval, textToRange } from 'text-to-range';

    const example1 = textToRange('<10 >7'));
    console.log(example1);

    // { minInclusive: false, min: 7, max: 10, maxInclusive: false }

    console.log(rangeToEquation(example1));

    // <7 >10

    const example2 = textToRange('2 <= x <= 100');
    console.log(example2);

    // { minInclusive: true, min: 2, max: 100, maxInclusive: true }

    console.log(rangeToInterval(example2));

    // [2,100]

    const example3 = textToRange('1, 4.5 to 8, [12,14), 19-22.18');
    console.log(example3);

    // {
    //   or: [
    //     { minInclusive: true, min: 1, max: 1, maxInclusive: true },
    //     { minInclusive: true, min: 4.5, max: 8, maxInclusive: true },
    //     { minInclusive: true, min: 12, max: 14, maxInclusive: false },
    //     { minInclusive: true, min: 19, max: 22.18, maxInclusive: true }
    //   ]
    // }

    console.log(rangeToEquation(example3));

    // 1, >=4.5 <=8, >=12 <14, >=19 <=22.18

    console.log(rangeToInterval(example3));

    // 1, [4.5,8], [12,14), [19,22.18]


Using the Library
-----------------

This is a typical `npm` library. Run `npm install text-to-range` and then include it in your project.

    import { rangeToEquation, rangeToInterval, textToRange } from 'text-to-range';

From there, it's a matter of calling `textToRange` to create a range object or use another exported function to convert the range to a string.

This module could run in a browser. It has no dependencies. I'd recommend making sure you bundle it using Webpack or a similar tool. Also, it relies heavily on regular expressions, so the browser's really needs to support them. There are several sample in the tests that you could use in a browser to ensure that the functionality is operating as expected.


Object Format
-------------

Ranges will either be simple ranges or joined ranges. Simple ranges have the minimum, maximum, and flags indicating if the minimum/maximum should be included. If you parse `>4`, `minInclusive` will be `false`, but if you parse `>=4` then it will be set to `true`.

    // Simple range
    {
        minInclusive: boolean;
        min: number | Number.NEGATIVE_INFINITY;
        max: number | Number.POSITIVE_INFINITY;
        maxInclusive: boolean;
    }

The joined ranges have a single `or` property, which is an array of simple ranges. While technically there could be any number of array elements, the practical minimum from the parser is 2.

    // Joined range
    {
        or: SimpleRange[];
    }


Range Specifications
--------------------

This is a pretty flexible library and it supports a wide range of range specifications.

* Single numbers, which are handled as both a minimum and a maximum: `54`
* Decimal numbers are allowed by themselves or at any other time: `28.9276`
* Negative numbers always work too: `-2.3`
* Ranges using "to": `3 to 11`
* Ranges using ".." like bash syntax: `7..14`
* Ranges using hyphens (negatives work too): `5-8, -4--1`
* Ranges using other symbols: `3:12, 14~18`
* Ranges with infinity: `-infinity to 1, 2 to INF`
* Alternate infinity syntax: `*-0, 1-$`
* Comparisons: `>10 <=20`
* Equalities: `=18, ==19`
* Equation ranges: `1 <= x <= 100`
* Closed intervals, which include the endpoints: `[1,2]`
* Open intervals, which do not include endpoints: `(1,2) <3,4> {5,6} ]7,8[`
* Open intervals with mixed up markers: `(1,2> <3,4}, {5,7[, ]7,8)`
* Mixed open/close intervals using any delimiters: `(1,2] [3,4)`

Reversed ranges are also supported, so one can use `9 to 5` and get `[5,9]`. If there is a problem parsing the ranges or no ranges are found, `null` is returned. If the range is conflicting as with `>1 <1` then `null` is returned. When an octal number is presented, such a `012`, then `null` is returned.

Joining ranges can use several different delimiters. Any of the above ranges can be joined, so formats like `1 to 5, [6,9]` is perfectly acceptable.

* Spaces
* Some punctuation: `,` `;`
* Text: `and` `or`
* Symbols that represent "and" or "or": `+` `|` `||` `&` `&&`


Converting To A String
----------------------

Once a range is parsed, the conversion back to a standard string is fairly straightforward. Use the methods `rangeToEquation()` or `rangeToInterval` to get a format you prefer.

    import { rangeToEquation, rangeToInterval, textToRange } from 'text-to-range';
    const example4 = textToRange('1, 2.2 to 3.3, (4, 5)');
    console.log(example4);

    // {
    //   or: [
    //     { minInclusive: true, min: 1, max: 1, maxInclusive: true },
    //     { minInclusive: true, min: 2.2, max: 3.3, maxInclusive: true },
    //     { minInclusive: false, min: 4, max: 5, maxInclusive: false }
    //   ]
    // }

    console.log(rangeToEquation(example4));

    // 1, >=2.2 <=3.3, >4 <5

    console.log(rangeToInterval(example4));

    // 1, [2.2,3.3], (4,5)
