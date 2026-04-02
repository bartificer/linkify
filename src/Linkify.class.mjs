export class Linkify {
    constructor(){
        /**
         * A mapping of domain names to data transformation functions.
         *
         * @private
         * @type {Object.<FQDN, dataTransformer>}
         */
        this._pageDataToLinkDataTransmformers = {
            '.' : function(pData){
                let text = pData.title();
                if(pData.h1s().length === 1){
                    text = pData.mainHeading();
                }
                return new module.exports.LinkData(pData.url(), text.trim());
            }
        };

        /**
         * The registered link templates.
         *
         * @private
         * @type {Object.<templateName, module:@bartificer/linkify.LinkTemplate>}
         */
        this._linkTemplates = {};
    }

    /**
     * Register a data transformer function for a given domain.
     *
     * @param {domainName} domain - The domain for which this transformer should be
     * used.
     * @param {dataTransformer} transformerFn - The data transformer callback.
     * @throws {ValidationError} A validation error is thrown if either parameter
     * is missing or invalid.
     */
    registerTransformer = function(domain, transformerFn){
        // TO DO - add validation
    
        let fqdn = String(domain);
        if(!fqdn.match(/[.]$/)){
            fqdn += '.';
        }
        pageDataToLinkDataTransmformers[fqdn] = transformerFn;
    
    }

    /**
     * Get the data transformer function for a given domain.
     *
     * Note that domains are searched from the subdomain up. For example, if passed
     * the domain `www.bartificer.net` the function will first look for a
     * transformer for the domain `www.bartificer.net`, if there's no transformer
     * registered for that domain it will look for a transformer for the domain
     * `bartificer.net`, if there's no transformer for that domain either it will
     * return the default transformer.
     *
     * @param {domainName} domain - The domain to get the data transformer for.
     * @returns {dataTransformer}
     * @throws {ValidationError} A validation error is thrown unless a valid domain
     * name is passed.
     */
    getTransformerForDomain(domain){
        // TO DO - add validation
    
        let fqdn = String(domain);
        if(!fqdn.match(/[.]$/)){
            fqdn += '.';
        }
    
        // return the most exact match
        while(fqdn.match(/[.][^.]+[.]$/)){
            if(pageDataToLinkDataTransmformers[fqdn]){
                //console.log(`returning transformer for '${fqdn}'`);
                return pageDataToLinkDataTransmformers[fqdn];
            }
            //console.log(`no transformer found for '${fqdn}'`);
            fqdn = fqdn.replace(/^[^.]+[.]/, '');
        }
        //console.log('returning default transformer');
        return pageDataToLinkDataTransmformers['.'];
    }

    /**
     * Register a link template.
     *
     * @param {templateName} name
     * @param {module:@bartificer/linkify.LinkTemplate} template
     * @throws {ValidationError} A validation error is thrown unless both a valid
     * name and template object are passed.
     */
    registerTemplate(name, template){
        // TO DO - add validation
    
        linkTemplates[name] = template;
    }

    /**
     * Fetch the page data for a given URL.
     *
     * @async
     * @param {URL} url
     * @returns {module:@bartificer/linkify.PageData}
     * @throws {ValidationError} A validation error is thrown unless a valid URL is
     * passed.
     */
    async fetchPageData(url){
        // TO DO - add validation
        
        let ans = new this.PageData(url);
        
        // then try load the contents form the web
        let webDownloadResponse = await fetch(url);
        webDownloadResponseBody = await webDownloadResponse.text();
        let $ = cheerio.load(webDownloadResponseBody);
        ans.title($('title').text().trim());
        $('h1').each(function(){
            ans.h1($(this).text().trim());
        });
        $('h2').each(function(){
            ans.h2($(this).text().trim());
        });
        
        // return the answer
        return ans;
    }

    /**
     * Generate a link given a URL.
     *
     * @async
     * @param {URL} url
     * @param {templateName} [templateName='html']
     * @returns {string}
     * @throws {ValidationError} A validation error is thrown unless a valid URL is
     * passed.
     */
    async generateLink(url, templateName){
        // TO DO - add validation
        
        let tplName = templateName && typeof templateName === 'string' ? templateName : 'html';
        
        // get the page data
        let pData = await this.fetchPageData(url);
        
        // transform the page data to link data
        let lData = module.exports.getTransformerForDomain(pData.uri().hostname())(pData);
        
        // render the link
        return Mustache.render(linkTemplates[tplName].templateString(), lData.asPlainObject());
    }
};