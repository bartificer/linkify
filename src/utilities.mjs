/**
 * @file A collection of useful utility functions.
 * @author Bart Busschots <opensource@bartificer.ie>
 * @license MIT
 */

/**
 * Utility functions, intended both for use within the core link generation code, and, by users defining their own custom templates, transformer functions, and filter functions.
 * 
 * This module is exposed to end-users as {@link module:linkifier.Linkifier#utilities} and {@link module:linkifier.Linkifier#util}.
 * @module utilities
 * @requires defaults
 * @requires module:urijs
 * @requires module:url-slug
 * @requires module:title-case
 * @see {@link module:linkifier.Linkifier#utilities} for the short-cut to this module exposed on the Linkifier class.
 * @see {@link module:linkifier.Linkifier#util} for the short-cut to this module exposed on the Linkifier class.
 */
import * as defaults from './defaults.mjs';
import URI from 'urijs';
import * as urlSlug from 'url-slug';
import * as titleCase from 'title-case';

/**
 * Regularise white space by replacing all sequences of whitespace characters with a single space and trimming leading and trailing whitespace.
 *
 * @param {string} text
 * @returns {string}
 */
export function regulariseWhitespace(text){
    return String(text).replace(/[\s\n]+/g, ' ').trim();
};

/**
 * Strip the query string from a URL, if present.
 *
 * @param {string} url - a URL with our without a query string.
 * @returns {string} the original URL with the query string removed, if it was present.
 */
export function stripQueryString(url){
    return URI(url).query('').toString();
};

/**
 * Remove UTM parameters from the query string in a URL, if present.
 * 
 * @param {string} url - a URL with or without UTM parameters in the query string.
 * @returns {string} the original URL with the UTM parameters removed, if they were present, but with any other query parameters preserved.
 * @see {@link https://en.wikipedia.org/wiki/UTM_parameters}
 */
export function stripUTMParameters(url){
    return URI(url).removeQuery(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']).toString();
};

/**
 * Escape a string for use in regular expressions.
 * 
 * _**Note:** this is not a standard Javascript feature as of April 2026, though it is coming in future versions of Javascript._
 * 
 * @param {string} str - the string to escape.
 * @returns {string} the escaped string, ready for use in a regular expression.
 * @see {@link https://stackoverflow.com/a/3561711/174985}
 */
export function escapeRegex(str) {
    return String(str).replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Batch-fix words with special capitalisations in a string. E.g. force `fbi` to `FBI`, `ios` to `iOS`, etc..
 * 
 * @param {string} str - the string to apply the capitalisation corrections to.
 * @param {Iterable<string>} [customCapWords] - the list of words with special capitalisations. Defaults to the default list {@link module:defaults.speciallyCapitalisedWords}.
 * @returns {string} the original string with all occurrences of the words in the list capitalised as per the word list. All other capitatlisations will be left un-changed.
 * @see {@link module:defaults.speciallyCapitalisedWords} for the default list of custom capitalisations.
 */
export function batchFixCustomWordCases(str, customCapWords = new Set()){
    // coerce the first argument to a string
    let ans = String(str);

    // resolve the custom capitalisation word list
    if(arguments.length < 2){
        // if none was passed, use the default list
        customCapWords = new Set(defaults.speciallyCapitalisedWords);
    } else {
        // TO DO — add validation
    }

    // build a mapping from the lower-case version of each word to custom version
    const lowerToCustomMap = {};
    customCapWords.forEach(word => lowerToCustomMap[word.toLowerCase()] = word);

    // assemble an RE from all the words
    const sortedWords = Object.keys(lowerToCustomMap).sort((a, b) => b.length - a.length); // sort for efficiency
    const wordRE = new RegExp(
        sortedWords.map(word => `\\b${escapeRegex(word)}\\b`).join('|'),
        'gi'
    );

    // replace all the matches at once using an anonymous function as the replacement
    ans = str.replace(wordRE, match => lowerToCustomMap[match.toLowerCase()]);

    return ans;
}

/**
 * Convert a string to title case, with some custom capitalisations.
 * 
 * This functions uses the {@link module:title-case} to perform the initial title-caseing, and then applies the custom capitalisations to fix any words with unusual capitalisation requirements.
 * All words this mododule defies as being so-called *small words* (e.g., "the", "a" & "an") are preserved in lower case, as well as the additional words defined in {@link module:defaults.smallWords}.
 * 
 * @param {string} str - the string to convert to title case.
 * @param {Iterable<string>} [customCapWords] - a list of words with custom capitalisations to correct after title-casing. Defaults to {@link module:defaults.speciallyCapitalisedWords}.
 * @param {Iterable<string>} [smallWords] - a list of small words to preserve in lower case during title-casing. Defaults to {@link module:defaults.smallWords}.
 * @returns {string} the original string converted to title case, with the custom capitalisations applied.
 * @see {@link module:defaults.speciallyCapitalisedWords} for the default list of custom capitalisations.
 * @see {@link module:title-case} for the Title Case module who's `titleCase()` function is used to convert to title case, and which has its own default list of small words that are preserved in lower case.
 * @see {@link module:defaults.smallWords} for the additional list of small words that are preserved in lower case.
 */
export function toTitleCase(str, customCapWords = new Set(), smallWords = new Set()){
    // coerce the first argument to a string
    let ans = String(str);

    // convert to title case
    ans = titleCase.titleCase(ans, { smallWords });

    // fix any words with unusual customisations
    ans = batchFixCustomWordCases(ans, customCapWords);

    // return the result
    return ans;
}

/**
 * Extract the slug from a URL and convert it to a title-case string.
 * 
 * @param {string} url - the URL to extract the slug from. The slug is taken to be the last segment of the path, with any file extension removed, and with the query string and fragment ignored.
 * @param {Iterable<string>} [customCapWords] - a list of words with custom capitalisations to correct after title-casing. Defaults to {@link module:defaults.speciallyCapitalisedWords}.
 * @param {Iterable<string>} [smallWords] - a list of small words to preserve in lower case during title-casing. Defaults to {@link module:defaults.smallWords}.
 * @returns {string} the slug extracted from the URL, converted to title case, with the custom capitalisations applied.
 * @see {@link module:defaults.speciallyCapitalisedWords} for the default list of custom capitalisations.
 * @see {@link toTitleCase} for the function used for the title-casing.
 */
export function extractSlug(url, customCapWords = new Set(), smallWords = new Set()){
    // TO DO - add validation

    // example URLs to try support:
    // ----------------------------
    // https://www.macobserver.com/news/apple-q2-2026-earnings-call-date-confirmed-heres-what-to-expect/
    // https://appleinsider.com/articles/26/04/01/studio-display-xdr-without-tilt-adjustable-stand-now-costs-less
    // https://www.bloomberg.com/news/articles/2026-04-03/ireland-tests-digital-id-to-verify-age-of-social-media-users?srnd=phx-technology&embedded-checkout=true
    // 
    // Based on those examples, implement the following algorithm:
    // 1. Parse the URL and extract the path (be sure not to capture the query string or fragment).
    // 2. Trim leading and trailing slashes
    // 3. Split the path on / into segments and take the last segment.
    // 4. Remove any file extension.
    // 5. Call slug reversing function with the lower-case option.
    // 6. Intelligently Title-case the title.

    // extract the path from the URL and clean up both ends
    const uri = URI(url);
    let path = uri.path();
    path = path.replace(/^\/|\/$/g, ''); // trim leading and trailing slashes
    let slug = path.split('/').pop() || ''; // get last segment of the path
    slug = slug.replace(/\.[^/.]+$/, ''); // trim any file extension that might be present
    
    // reverse the slug into a lower-case string
    let title = urlSlug.revert(slug, { 
        transformer: urlSlug.LOWERCASE_TRANSFORMER,
        camelCase: false
    });

    // convert the title to title case
    title = toTitleCase(title, customCapWords, smallWords);

    return title;
};