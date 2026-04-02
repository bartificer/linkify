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
        this.url(url);
        
        // set the text
        this.text(text || this.url());
        
        // set the description
        this.description(description || this.text());
    }
    
    /**
     * Get or set the URL.
     *
     * @param {URL} [url] - A new URL as a string.
     * @returns {(string|module:@bartificer/linkify.LinkData)} When in *get*
     * mode (passed no parameters), returns a URL string, when in *set* mode
     * (passed a URL string as the first parameter), returns a reference to 
     * self to facilitate function chaining. 
     */
    url(){
        // deal with set mode
        if(arguments.length){
            this._uri = URI(String(arguments[0])).normalize();
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
     * Get or set the link text.
     * 
     * @param {string} [text] - New link text.
     * @returns {(string|module:@bartificer/linkify.LinkData)} When in *get*
     * mode (passed no parameters), returns the link text, when in *set* mode
     * (passed a string as the first parameter), returns a reference to self to
     * facilitate function chaining.
     */
    text(){
        // deal with set mode
        if(arguments.length){
            this._text = String(arguments[0]);
            return this;
        }
        
        // deal with get mode
        return this._text;
    }
    
    /**
     * Get or set the link description.
     * 
     * @param {string} [description]
     * @returns {(string|module:@bartificer/linkify.LinkData)} When in *get* 
     * mode (passed no parameters), returns the link description, when in *set*
     * mode (passed a string as the first parameter), returns a reference to 
     * self to facilitate function chaining.
     */
    description(){
        // deal with set mode
        if(arguments.length){
            this._description = String(arguments[0]);
            return this;
        }
        
        // deal with get mode
        return this._description;
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
            url: this.url(),
            text: this.text(),
            description: this.description(),
            uri: URI.parse(this._uri.toString())
        };
        ans.uri.hasPath = ans.uri.path !== '/';
        //console.log(ans);
        return ans;
    }
};