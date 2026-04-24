/**
 * @file Data model for link information.
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
 * Instances of this class are created from the information extracted from web pages by data transformers.
 * @see {@link dataTransformer} for details of how instances of this class are created.
 */
export class LinkData {
    /**
     * The standard fields names that can be used within template strings to access the link data.
     * @type {string[]}
     */
    static get standardFieldNames(){
        return ['url', 'text', 'description'];
    }

    /**
     * @param {string} url - The link's URL.
     * @param {string} [text] - The link's text, defaults to the URL. The value passed is coerced to a string with `String()`.
     * @param {string} [description] - A description for the link, defaults to the link text. The value passed is coerced to a string with `String()`.
     * @param {Object.<string, string>} [extraFields={}] - An optional set of extra fields to be made available for use in templates under the `extraFields` key. All values are coerced to strings with `String()`.
     * @throws {TypeError} A TypeError is thrown if an invalid URL is passed.
     * @throws {TypeError} A TypeError is thrown if the extraFields parameter is not an object.
     */
    constructor(url, text = '', description = '', extraFields = {}){
        // TO DO - add validation
        
        /**
         * The link's URL as a URI.js object.
         *
         * @private
         * @type {module:urijs}
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

        /**
         * An object to hold any extra fields extracted from the page by a field extractor function, indexed by field name.
         * @type {Object.<string, string>}
         * @private
         */
        this._extraFields = extraFields; // throws a TypeError if extraFields is not an object, let it pass through

        // store the URL
        this.url = url; // throws a TypeError if the URL is invalid - let it pass through
        
        // set the text
        this.text = String(text) || this.url;
        
        // set the description
        this.description = String(description) || this._text;
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
     * The extra fields extracted from the page by an extra field extractor function, indexed by field name. If no field extractor was used, this will be an empty object.
     * 
     * Note that reading this property produces a shallow clone of the internal extra fields object, and that the values set for extra fields are coerced to strings with `String(value)`.
     * @type {Object.<string, string>}
     * @default {}
     * @throws {TypeError} if an attempt is made to set this property to a non-object value.
     */
    get extraFields(){
        return { ...this._extraFields }; // shallow clone is OK since values are coerced to strings by the setter
    }
    set extraFields(extraFields){
        if(typeof extraFields === 'object' && extraFields !== null){
            for (let [key, value] of Object.entries(extraFields)) {
                this._extraFields[String(key)] = String(value);
            }
        } else {
            throw new TypeError('extraFields must be a dictionary object with string keys and string values');
        }
    }

    /**
     * Add an extra field to the link data object.
     * 
     * Note that values are coerced to strings with `String(value)`.
     * @param {string} fieldName - The name of the field to add.
     * @param {string} value - The value of the field to add. This will be coerced to a string with `String(value)`.
     * @returns {module:page-data.PageData} A reference to self to facilitate function chaning.
     */
    addExtraField(fieldName, value){
        this._extraFields[String(fieldName)] = String(value);
        return this;
    }
    
    /**
     * The link data as a plain object for use in Mustache templates and the like.
     * @returns {plainLinkInformationObject} A plain object containing the link data.
     */
    asPlainObject(){
        let ans = {
            url: this.url,
            text: this.text,
            description: this.description,
            extraFields: this.extraFields,
            uri: URI.parse(this._uri.toString())
        };
        ans.uri.hasPath = ans.uri.path !== '/';
        return ans;
    }
};