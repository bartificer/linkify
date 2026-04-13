/**
 * @file The definition of the class representing a link generation template.
 * @author Bart Busschots <opensource@bartificer.ie>
 */

/**
 * This module provides as class for representing a template used for generating links.
 * @module link-template
 * @requires module:urijs
 */

/**
 * A class representing the a template that can be used to render links.
 */
export class LinkTemplate{
    /**
     * @param {string} templateString - A Moustache template string.
     * @param {Array} [filters=[]] - An optional array of filter functions.
     * Each element in the array should itself be an array where the first
     * element is a string specifying which fields the filter should be applied
     * to (one of `'all'`, `'url'`, `'text'`, or `'description'`), and the 
     * second the filter function itself which should be a function that takes
     * a single string as an argument and returns a filtered version of that
     * string.
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
         * @type {Object.<string, filterFunction>}
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
     * Get the template string.
     *
     * @returns {string}
     */
    get templateString(){
        return this._templateString;
    }

    /**
     * Set the template string. Should be in Mustache format. All values passed
     * will be coerced to strings.
     * 
     * @param {string} templateString
     */
    set templateString(templateString){
        this._templateString = String(templateString);
    }
    
    /**
     * Add a filter to be applied to one or all fields.
     *
     * If an invalid args are passed, the function does not save the filter or
     * throw an error, but it does log a warning.
     *
     * @param {string} fieldName - One of `'all'`, `'url'`, `'text'`, or
     * `'description'`.
     * @param {function} filterFn - the filter function.
     * @returns {LinkTemplate} Returns a reference to self to facilitate function chaining.
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
     * A function get the filter functions that should be applied to any given
     * field.
     * 
     * @param {string} fieldName - one of `'url'`, `'text'`, or
     * `'description'`.
     * @returns {function[]} returns an array of callbacks, which may be
     * empty. An empty array is returned if an invalid field name is passed.
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