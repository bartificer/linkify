/**
 * @file Link generation templates.
 * @author Bart Busschots <opensource@bartificer.ie>
 * @license MIT
 */

/**
 * This module provides as class for representing the templates used to generate links from link data objects.
 * @module link-template
 * @requires module:urijs
 */

/**
 * A class representing the templates used to render link data objects as actual links.
 * @see {@link module:link-data.LinkData} for the data objects that are rendered with these templates.
 */
export class LinkTemplate{
    /**
     * @param {string} templateString - A Moustache template string.
     * @param {templateFieldFilterTuple[]} [filters=[]] - an optional set of filter functions to apply to some or all template fields.
     * @param {templateFieldExtractorFunction} [fieldExtractor] - an optional function to extract additional fields from a web page DOM object, making the extracted fields available for use in the template under the `extraFields` key.
     * @example <caption>Example of defining a template with filters</caption>
     * let template = new LinkTemplate(
     *     '<a href="{{{url}}}">{{{text}}}</a>',
     *     [
     *         ['url', linkify.util.stripUTMParameters],
     *         ['text', linkify.util.regulariseWhitespace]
     *     ]
     * );
     */
    constructor(templateString, filters, fieldExtractor){
        // TO DO - add validation
        
        /**
         * The Moustache template string.
         *
         * @private
         * @type {templateString}
         */
        this._templateString = '';
        this.templateString = templateString;
        
        /**
         * The filter functions to be applied to the various fields as a plain
         * object of arrays of {@filterFunction} callbacks indexed by:
         * * `all` - filters to be applied to all fields.
         * * `url` - filters to be applied to just the URL.
         * * `text` - filters to be applied just the link text.
         * * `description` - filters to be applied just the link description.
         *
         * @private
         * @type {Object.<"all"|"url"|"text"|"description", templateFieldFilterFunction>}
         */
        this._filters = {
            all: [],
            url: [],
            text: [],
            description: []
        };
        if(Array.isArray(filters)){
            for(let f of filters){
                if(Array.isArray(f)){
                    this.addFilter(...f);
                }
            }
        }

        /**
         * An optional function to extract additional fields from a web page DOM object, making the extracted fields available for use in the template under the `extraFields` key.
         * @private
         * @type {templateFieldExtractorFunction}
         */
        this._fieldExtractor = fieldExtractor;
    }
    
    /**
     * The Mustache template string. Will be coerced to a string with `String(templateString)`.
     * @type {string}
     */
    get templateString(){
        return this._templateString;
    }
    set templateString(templateString){
        this._templateString = String(templateString);
    }
    
    /**
     * Add a filter to be applied to one or all fields.
     *
     * If an invalid args are passed, the function does not save the filter or
     * throw an error, but it does log a warning.
     *
     * @param {"all"|"url"|"text"|"description"} fieldName
     * @param {templateFieldFilterFunction} filterFn - the filter function.
     * @returns {module:link-template.LinkTemplate} Returns a reference to self to facilitate function chaining.
     */
    addFilter(fieldName, filterFn){
        // make sure that args are at least plausibly valid
        if(typeof fieldName !== 'string' || typeof filterFn !== 'function'){
            console.warn('silently ignoring request to add filter due to invalid args');
            return this;
        }
        
        // make sure the field name is valid
        if(!this._filters[fieldName]){
            console.warn(`silently ignoring request to add filter for unknown field (${fieldName})`);
            return this;
        }
        
        // add the filter
        this._filters[fieldName].push(filterFn);
        
        // return a reference to self
        return this;
    }
    
    /**
     * Get the filter functions that should be applied to any given field.
     * 
     * @param {"all"|"url"|"text"|"description"} fieldName
     * @returns {templateFieldFilterFunction[]} returns an array of callbacks, which may be
     * empty. An empty array is also returned if an invalid field name is passed.
     */
    filtersFor(fieldName){
        fieldName = String(fieldName);
        let ans = [];
        
        if(this._filters[fieldName]){
            if(fieldName !== 'all'){
                for(let f of this._filters.all){
                    ans.push(f);
                }
            }
            for(let f of this._filters[fieldName]){
                ans.push(f);
            }
        }
        return ans;
    }

    /**
     * The optional extra fields extractor function for this template. If present, this function will be called with the DOM data for a web page when the page data object is being extracted. These fields will be passed through to the link data object, and be avaialable for use within the template as `extraFields.fieldName`.
     * 
     * For this process to work, the field extractor function **must** return an object containing key-value pairs, where the keys are the field names to be used in the template, and the values are strings.
     * @type {?templateFieldExtractorFunction}
     * @throws {TypeError} if the value set is not a function or null.
     */
    get fieldExtractor(){
        return this._fieldExtractor;
    }
    set fieldExtractor(fieldExtractor){
        if(typeof fieldExtractor === 'function' || fieldExtractor === null){
            this._fieldExtractor = fieldExtractor;
        } else {
            throw new TypeError('fieldExtractor must be a function or null');
        }
    }

    /**
     * Whether or not this template supports extra fields.
     * @readonly
     * @type {boolean}
     */
    get hasExtraFields(){
        return typeof this._fieldExtractor === 'function';
    }
};