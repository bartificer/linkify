/**
 * @file The definition of the class representing a link.
 * @author Bart Busschots <opensource@bartificer.ie>
 */

/**
 * This module provides as class for representing the information that can be used when rendering a link.
 * @module link-data
 * @requires module:urijs
 */
import {default as URI} from 'urijs';

/**
 * A class for representing the information about a link, in the abstract.
 */
export class LinkData {
    /**
     * This constructor throws a {@link ValidationError} unless a valid URL is passed.
     *
     * @param {URL} url - The link's URL.
     * @param {string} [text] - The link's text, defaults to the URL.
     * @param {string} [description] - A description for the link, defaults to
     * the link text.
     * @throws {ValidationError} A validation error is thrown if an invalid URL
     * is passed.
     */
    constructor(url, text, description){
        // TO DO - add validation
        
        /**
         * The link's URL as a URI.js object.
         *
         * @private
         * @type {URIObject}
         */
        this._uri = URI();
        
        /**
         * The link text.
         * 
         * @private
         * @type {string}
         */
        this._text = '';
        
        /**
         * The link description.
         * 
         * @private
         * @type {string}
         */
        this._description = '';
        
        // store the URL
        this.url = url;
        
        // set the text
        this.text = text || this.url;
        
        // set the description
        this.description = description || this._text;
    }

    /**
     * @returns {string} a URL string 
     */
    get url(){
        return this._uri.toString();
    }
    
    /**
     * Get or set the URL.
     *
     * @param {string} url - A new URL as a string.
     */
    set url(url){
        this._uri = URI(String(url)).normalize();
    }
    
    /**
     * Get the URL as a URI.js object.
     * 
     * @returns {Object}
     */
    get uri(){
        return this._uri.clone();
    }

    /**
     * @returns {string}
     */
    get text(){
        return this._text;
    }
    
    /**
     * @param {string} [text] - New link text. The value will be coerced to a string and trimmed.
     */
    set text(text){
        this._text = String(text).trim();
    }
    
    /**
     * @returns {string} 
     */
    get description(){
        return this._description;
    }

    /**
     * @param {string} description
     */
    set description(description){
        this._description = String(description);
    }
    
    /**
     * Get the link data as a plain object of the form:
     * ```
     * {
     *     url: 'http://www.bartificer.net/',
     *     text: 'the link text',
     *     description: 'the link description',
     *     uri: {
     *         hostname: 'www.bartificer.net',
     *         path: '/',
     *         hasPath: false
     *     }
     * }
     * ```
     *
     * Note that the `uri` could contain more fields - it's initialised with
     * output from the `URI.parse()` function from the `URI` module.
     * 
     * @returns {plainObject}
     * @see {@link https://medialize.github.io/URI.js/docs.html#static-parse}
     */
    asPlainObject(){
        let ans = {
            url: this.url,
            text: this.text,
            description: this.description,
            uri: URI.parse(this._uri.toString())
        };
        ans.uri.hasPath = ans.uri.path !== '/';
        return ans;
    }
};