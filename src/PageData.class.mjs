import {default as URI} from 'urijs';

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
        this.url = url;
    }
    
    /**
     * @returns {string}
     */
    get url(){
        return this._uri.toString();
    }

    /**
     * @param {string} url - A URL as a string.
     * @throws {ValidationError} A validation error is thrown if an argument
     * is passed that's not a valid URL string.
     */
    set url(url){
        this._uri = URI(url).normalize();
    }
    
    /**
     * @returns {Object} A URI.js object.
     */
    get uri(){
        return this._uri.clone();
    }
    
    /**
     * Get the domain-part of the URL as a string.
     * 
     * @returns {string} The domain-part of the URL.
     */
    get domain(){
        return this._uri.hostname();
    }
    
    /**
     * @returns {string} The path-part of the URL.
     */
    get path(){
        return this._uri.path();
    }
    
    /**
     * @returns {string}
     */
    get title(){
        return this._title;
    }

    /**
     * @param {string} title - the page's title as a string. Values passed will be coerced to strings.
     */
    set title(title){
        this._title = String(title);
    }
    
    /**
     * Get the page's section headings.
     * 
     * @returns {Object} A plain object containing arrays of strings indexed by `h1` and `h2`.
     */
    get headings(){
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
     * The page's top-level headings (`h1` tags).
     *
     * @returns {string[]}
     */
    get topLevelHeadings(){
        var ans = [];
        for(let h of this._headings.h1){
            ans.push(h);
        }
        return ans;
    }

    /**
     * An alias for `.topLevelHeadings`.
     * @see PageData#topLevelHeadings
     */
    get h1s(){
        return this.topLevelHeadings;
    }

    /**
     * The page's secondary headings (`h2` tags).
     *
     * @returns {string[]}
     */
    get secondaryHeadings(){
        var ans = [];
        for(let h of this._headings.h2){
            ans.push(h);
        }
        return ans;
    }

    /**
     * An alias for `.secondaryHeadings`.
     * @see PageData#secondaryHeadings
    */
    get h2s(){
        return this.secondaryHeadings;
    }

    /**
     * The text from the most important heading on the page. If the page
     * has `h1` tags, the first one will be used, if not, the first `h2` tag
     * will be used, and if there's none of those either, an empty string will
     * be returned.
     * 
     * @returns {string} Heading text as a string, or an empty string.
     */
    get mainHeading(){
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
     * @returns {PageData} A reference to self to 
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
     * @returns {PageData} A reference to self to 
     * facilitate function chaning.
     */
    addSecondaryHeading(h2Text){
        // TO DO - add argument validation
        this._headings.h2.push(h2Text);
        return this;
    }

    /**
     * Get the page data as a plain object of the form:
     * ```
     * {
     *     url: 'http://www.bartificer.net/',
     *     title: 'the page title',
     *     topLevelHeadings: [ 'first h1', 'second h1' ],
     *     secondaryHeadings: [ 'first h2', 'second h2' ],
     *     mainHeading: 'first h1',
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
     * @returns {Object} A plain object containing the page data.
     * @see {@link https://medialize.github.io/URI.js/docs.html#static-parse}
     */
    asPlainObject(){
        let ans = {
            url: this.url,
            title: this.title,
            topLevelHeadings: this.topLevelHeadings,
            secondaryHeadings: this.secondaryHeadings,
            mainHeading: this.mainHeading,
            uri: URI.parse(this._uri.toString())
        };
        ans.uri.hasPath = ans.uri.path !== '/';
        return ans;
    }
};

/**
 * A shortcut for `.addTopLevelHeading()`.
 *
 * @function
 * @see PageData#addTopLevelHeading
 * 
 */
PageData.prototype.h1 = PageData.prototype.addTopLevelHeading;

/**
 * A shortcut for `.addSecondaryHeading()`.
 *
 * @function
 * @see PageData#addSecondaryHeading
 * 
 */
PageData.prototype.h2 = PageData.prototype.addSecondaryHeading;