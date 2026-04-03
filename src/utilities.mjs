import URI from 'urijs';
import * as urlSlug from 'url-slug';

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
 * @see https://en.wikipedia.org/wiki/UTM_parameters
 */
export function stripUTMParameters(url){
    return URI(url).removeQuery(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']).toString();
};

/**
 * Extract the slug from a URL and convert it to a title-case string.
 * 
 * @param {string} url
 * @return {string}
 */
export function extractSlug(url){
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
    // 5. Call slug reversing function with Title Case option.

    // extract the path from the URL and clean up both ends
    const uri = URI(url);
    let path = uri.path();
    path = path.replace(/^\/|\/$/g, ''); // trim leading and trailing slashes
    let slug = path.split('/').pop() || ''; // get last segment of the path
    slug = slug.replace(/\.[^/.]+$/, ''); // trim any file extension that might be present
    
    // reverse the slug into a title-case string
    return urlSlug.revert(slug, { transformer: urlSlug.TITLECASE_TRANSFORMER });
};