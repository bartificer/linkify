export class PageData {
    /**
     * This constructor throws a {@link ValidationError} unless a valid URL is passed.
     *
     * @param {URL} url - The page's full URL.
     * @throws {ValidationError} A validation error is thrown if an invalid URL
     * is passed.
     */
    constructor(url){
        // TO DO - add validation
        
        /**
         * The page's URL as a URI object.
         *
         * @private
         * @type {URIObject}
         */
        this._uri = URI();
        
        /**
         * The page's title.
         * 
         * @private
         * @type {string}
         */
        this._title = '';
        
        /**
         * The section headings on the page as arrays of strings indexed by
         * `h1` and `h2`.
         * 
         * @private
         * @type {plainObject}
         */
        this._headings = {
            h1: [],
            h2: []
        };
        
        // store the URL
        this.url(url);
    }
    
    /**
     * Get or set the URL.
     *
     * @param {URL} [url] - A new URL as a string.
     * @returns {(string|module:@bartificer/linkify.PageData)} When in *get*
     * mode (passed no parameters), returns a URL string, when in *set* mode 
     * (passed a URL string as the first parameter), returns a reference to
     * self to facilitate function chaining.
     * @throws {ValidationError} A validation error is thrown if an argument
     * is passed that's not a valid URL string.
     */
    url(){
        // TO DO - validate args
        
        // deal with set mode
        if(arguments.length){
            this._uri = URI(arguments[0]).normalize();
            return this;
        }
        
        // deal with get mode
        return this._uri.toString();
    }
    
    /**
     * Get the URL as a URI.js object.
     *
     * @returns {URIObject}
     */
    uri(){
        return this._uri.clone();
    }
    
    /**
     * Get the domain-part of the URL as a string.
     * 
     * @returns {domainName}
     */
    domain(){
        return this._uri.hostname();
    }
    
    /**
     * Get the path-part of the URL.
     *
     * @returns {string}
     */
    path(){
        return this._uri.path();
    }
    
    /**
     * Get or set the page title.
     * 
     * @param {string} [title] - the page's title as a string.
     * @returns {(string|module:@bartificer/linkify.PageData)} When in *get*
     * mode (passed no parameters), returns the title, when in *set* mode 
     * (passed a string as the first parameter), returns a reference to self to
     * facilitate function chaining.
     * @throws {ValidationError} A validation error is thrown if an argument
     * is passed that's not a string.
     */
    title(){
        // TO DO - validate args
        
        // deal with set mode
        if(arguments.length){
            this._title = String(arguments[0]);
            return this;
        }
        
        // deal with get mode
        return this._title;
    }
    
    /**
     * Get the page's section headings as a plain object containing arrays of
     * strings indexed by `h1` and `h2`.
     * 
     * @returns {PlainObject}.
     */
    headings(){
        let ans = {
            h1: [],
            h2: []
        };
        for(let h of this._headings.h1){
            ans.h1.push(h);
        }
        for(let h of this._headings.h2){
            ans.h2.push(h);
        }
        return ans;
    }
    
    /**
     * Get the page's top-level headings (`h1` tags).
     *
     * @returns {string[]}
     */
    topLevelHeadings(){
        var ans = [];
        for(let h of this._headings.h1){
            ans.push(h);
        }
        return ans;
    }
    
    /**
     * Get the page's secondary headings (`h2` tags).
     *
     * @returns {string[]}
     */
    secondaryHeadings(){
        var ans = [];
        for(let h of this._headings.h2){
            ans.push(h);
        }
        return ans;
    }
    
    /**
     * Get the text from the most important heading on the page. If the page
     * has `h1` tags, the first one will be used, if not, the first `h2` tag
     * will be used, and if there's none of those either, an empty string will
     * be returned.
     * 
     * @returns {string} Heading text as a string, or an empty string.
     */
    mainHeading(){
        if(this._headings.h1.length > 0){
            return this._headings.h1[0];
        }
        if(this._headings.h2.length > 0){
            return this._headings.h2[0];
        }
        return '';
    }
    
    /**
     * Add a top-level heading.
     *
     * @param {string} h1Text
     * @returns {module:@bartificer/linkify.PageData} A reference to self to 
     * facilitate function chaning.
     */
    addTopLevelHeading(h1Text){
        // TO DO - add argument validation
        this._headings.h1.push(h1Text);
        return this;
    }
    
    /**
     * Add a seconary heading.
     *
     * @param {string} h2Text
     * @returns {module:@bartificer/linkify.PageData} A reference to self to 
     * facilitate function chaning.
     */
    addSecondaryHeading(h2Text){
        // TO DO - add argument validation
        this._headings.h2.push(h2Text);
        return this;
    }
};

/**
 * A shortcut for `.topLevelHeadings()`.
 *
 * @function
 * @see module:@bartificer/linkify/PageData#topLevelHeadings
 * 
 */
PageData.prototype.h1s = PageData.prototype.topLevelHeadings;

/**
 * A shortcut for `.secondaryHeadings()`.
 *
 * @function
 * @see module:@bartificer/linkify/PageData#secondaryHeadings
 * 
 */
PageData.prototype.h2s = PageData.prototype.secondaryHeadings;

/**
 * A shortcut for `.addTopLevelHeading()`.
 *
 * @function
 * @see module:@bartificer/linkify/PageData#addTopLevelHeading
 * 
 */
PageData.prototype.h1 = PageData.prototype.addTopLevelHeading;

/**
 * A shortcut for `.addSecondaryHeading()`.
 *
 * @function
 * @see module:@bartificer/linkify/PageData#addSecondaryHeading
 * 
 */
PageData.prototype.h2 = PageData.prototype.addSecondaryHeading;