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
     * @example <caption>Example of defining a template with filters</caption>
     * let template = new LinkTemplate(
     *     '<a href="{{{url}}}">{{{text}}}</a>',
     *     [
     *         ['url', linkify.util.stripUTMParameters],
     *         ['text', linkify.util.regulariseWhitespace]
     *     ]
     * );
     */
    constructor(templateString, filters){
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
};