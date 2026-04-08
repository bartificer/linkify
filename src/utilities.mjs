/**
 * @file A collection of useful utility functions.
 * @author Bart Busschots <opensource@bartificer.ie>
 */

/**
 * This module provides utility functions which are both used by the core code, and, available for use by users when defining link data transformers and link templates.
 * @module utilities
 * @requires module:defaults
 * @requires module:urijs
 * @requires module:url-slug
 * @requires module:title-case
 */
import * as defaults from './defaults.mjs';
import URI from 'urijs';
import * as urlSlug from 'url-slug';
import * as titleCase from 'title-case';

/**
 * Regularise white space by replacing all sequences of whitespace characters with a single space and trimming leading and trailing whitespace.
 *
 * @param {string} text
 * @return {string}
 */
export function regulariseWhitespace(text){
    return String(text).replace(/[\s\n]+/g, ' ').trim();
};

/**
 * Strip the query string from a URL.
 *
 * @param {string} url
 * @return {string}
 */
export function stripQueryString(url){
    return URI(url).query('').toString();
};

/**
 * Remove UTM parameters from the query string in a URL.
 * 
 * @param {string} url
 * @return {string}
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
 * @returns {string}
 * @see {@link https://stackoverflow.com/a/3561711/174985}
 */
export function escapeRegex(str) {
    return String(str).replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Batch-customise word casings in a string. E.g. force `fbi` to `FBI`, `ios` to `iOS`, etc..
 * 
 * @param {string} str - the string to apply the replacemnts to.
 * @param {string[]} [words] - an array of words in their desired capitalisations. Defaults to the default list of custom capitalisations.
 * @returns {string}
 */
export function batchFixCustomWordCases(str, words){
    // coerce the first argument to a string
    let ans = String(str);

    // resolve the word list
    if(arguments.length < 2){
        // if none was passed, use the default list
        words = defaults.speciallyCapitalisedWords;
    } else {
        // TO DO — add validation
    }

    // build a mapping from the lower-case version of each word to custom version
    const lowerToCustomMap = {};
    words.map(word => lowerToCustomMap[word.toLowerCase()] = word);

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
 * Extract the slug from a URL and convert it to a title-case string.
 * 
 * @param {string} url
 * @param {string[]} [words] - a list of words with custom capitalisations to correct after title-casing.
 * @return {string}
 */
export function extractSlug(url, words){
    // TO DO - add validation

    // resolve the list of words with custom capitalisations
    if(arguments.length < 2){
        words = [];
    }

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
    titleCase.SMALL_WORDS.add('is');
    title = titleCase.titleCase(title);

    // fix any words with unusual customisations
    title = batchFixCustomWordCases(title, words);

    return title;
};