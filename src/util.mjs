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