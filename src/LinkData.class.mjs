/**
 * @file Data model for web page information.
 * @author Bart Busschots <opensource@bartificer.ie>
 * @license MIT
 */

/**
 * This module provides the class for representing the information that can be used to render a link.
 * @module link-data
 * @requires module:urijs
 */
import {default as URI} from 'urijs';

/**
 * The information that can be used to render a link.
 * 
 * Instances of this class are created from the infomration extracted from web pages by data transformers.
 * @see {@link dataTransformer} for details of how instances of this class are created.
 */
export class LinkData {
    /**
     * @param {string} url - The link's URL.
     * @param {string} [text] - The link's text, defaults to the URL.
     * @param {string} [description] - A description for the link, defaults to the link text.
     * @throws {TypeError} A TypeError is thrown if an invalid URL is passed.
     */
    constructor(url, text, description){
        // TO DO - add validation
        
        /**
         * The link's URL as a URI.js object.
         *
         * @private
         * @type {module:urijs}
         */
        this._uri = URI(); // throws a TypeError if the URL is invalid
        
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
     * The URL the link points to as a string.
     * @type {string}
     */
    get url(){
        return this._uri.toString();
    }
    set url(url){
        this._uri = URI(String(url)).normalize();
    }
    
    /**
     * The URL the link points to as a URI.js object representing the URL.
     * @type {module:urijs}
     * @readonly
     */
    get uri(){
        return this._uri.clone();
    }

    /**
     * The link text.
     * @type {string}
     */
    get text(){
        return this._text;
    }
    set text(text){
        this._text = String(text).trim();
    }
    
    /**
     * The link description.
     * @type {string}
     */
    get description(){
        return this._description;
    }
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
     * @returns {Object} A plain object containing the link data.
     * @see {@link https://medialize.github.io/URI.js/docs.html#static-parse} for details of the fields included under the `uri` key.
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