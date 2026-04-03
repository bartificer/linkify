import { PageData } from './PageData.class.mjs';
import { LinkData } from './LinkData.class.mjs';
import { LinkTemplate } from './LinkTemplate.class.mjs';
import * as utilities from "./utilities.mjs";
import * as defaults from "./defaults.mjs";

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import Mustache from 'mustache';

export class Linkifier {
    constructor(){
        /**
         * A mapping of domain names to data transformation functions.
         *
         * @private
         * @type {Object.<FQDN, dataTransformer>}
         */
        this._pageDataToLinkDataTransmformers = {
            '.' : function(pData){
                let text = pData.title;
                if(pData.h1s.length === 1){
                    text = pData.mainHeading;
                }
                return new LinkData(pData.url, text);
            }
        };

        /**
         * A mapping of domains names to default template names.
         * 
         * @private
         * @type {Object.<FQDN, templateName>}
         */
        this._pageDataToLinkTemplateName = {
            '.' : 'html' // default to the 'html' template for all domains unless otherwise specified
        };

        /**
         * The registered link templates.
         *
         * @private
         * @type {Object.<templateName, module:@bartificer/linkify.LinkTemplate>}
         */
        this._linkTemplates = {};

        /**
         * A collection of utility functions.
         *
         * @private
         * @type {Object.<string, Function>}
         */
        this._utilities = utilities;

        //
        // -- Create and register the default templates --
        //
        for (const [name, template] of Object.entries(defaults.linkTemplates)) {
            this.registerTemplate(name, template);
        }
    }

    /**
     * @type {Object.<string, Function>}
     */
    get utilities() {
        return this._utilities;
    }

    /**
     * @see Linfifier.utilities
     */
    get util(){
        return this._utilities;
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
    registerTransformer(domain, transformerFn){
        // TO DO - add validation
    
        let fqdn = String(domain);
        if(!fqdn.match(/[.]$/)){
            fqdn += '.';
        }
        this._pageDataToLinkDataTransmformers[fqdn] = transformerFn;
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
            if(this._pageDataToLinkDataTransmformers[fqdn]){
                //console.log(`returning transformer for '${fqdn}'`);
                return this._pageDataToLinkDataTransmformers[fqdn];
            }
            //console.log(`no transformer found for '${fqdn}'`);
            fqdn = fqdn.replace(/^[^.]+[.]/, '');
        }
        //console.log('returning default transformer');
        return this._pageDataToLinkDataTransmformers['.'];
    }

    /**
     * @type {string[]} A list of the names of the registered link templates.
     */
    get templateNames() {
        return Object.keys(this._linkTemplates);
    }

    /**
     * @returns {string} The name of the default template.
     */
    get defaultTemplateName(){
        return this._pageDataToLinkTemplateName['.'];
    }

    /**
     * @param {string} templateName - The name of the default template to use.
     * @throws {ValidationError} A validation error is thrown if the template name is missing, invalid, or doesn't correspond to a registered template.
     */
    set defaultTemplateName(templateName){
        const tplName = String(templateName);
        if(!this._linkTemplates[tplName]){
            throw new ValidationError(`No template named '${tplName}' is registered`);
        }
        this._pageDataToLinkTemplateName['.'] = tplName;
    }
    
    /**
     * @type {LinkTemplate} The default link template.
     */
    get defaultTemplate(){
        return this._linkTemplates[this._pageDataToLinkTemplateName['.']];
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
        const tplName = String(name);
    
        this._linkTemplates[tplName] = template;
    }

    /**
     * Get a registered link template by name.
     *
     * @param {string} templateName
     * @returns {LinkTemplate}
     * @throws {ValidationError} A validation error is thrown unless a valid name is passed and corresponds to a registered template.
     */
    getTemplate(templateName){
        const tplName = String(templateName);

        if(!this._linkTemplates[tplName]){
            throw new ValidationError(`No template named '${tplName}' is registered`);
        }
        return this._linkTemplates[tplName];
    }

    /**
     * Register a default template for use with a given domain. This template will
     * override the overall default for this domain and all its subdomains.
     *
     * @param {domainName} domain - The domain for which this template should be used by default.
     * @param {templateName} templateName - The name of the template to use.
     * @throws {ValidationError} A validation error is thrown if either parameter
     * is missing or invalid.
     */
    registerDefaultTemplateMapping(domain, templateName){
        // TO DO - add validation
    
        let fqdn = String(domain);
        if(!fqdn.match(/[.]$/)){
            fqdn += '.';
        }
        this._pageDataToLinkTemplateName[fqdn] = templateName;
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
    getTemplateNameForDomain(domain){
        // TO DO - add validation
    
        let fqdn = String(domain);
        if(!fqdn.match(/[.]$/)){
            fqdn += '.';
        }
    
        // return the most exact match
        while(fqdn.match(/[.][^.]+[.]$/)){
            if(this._pageDataToLinkTemplateName[fqdn]){
                let tplName = this._pageDataToLinkTemplateName[fqdn];

                // make sure the template exists
                if(!this._linkTemplates[tplName]){
                    console.warn(`No template named '${tplName}' is registered, falling back to global default '${this._pageDataToLinkTemplateName['.']}'`);
                    return this._pageDataToLinkTemplateName['.'];
                }

                //console.log(`returning template name for '${fqdn}'`);
                return this._pageDataToLinkTemplateName[fqdn];
            }
            //console.log(`no template name found for '${fqdn}'`);
            fqdn = fqdn.replace(/^[^.]+[.]/, '');
        }
        //console.log('returning default template name');
        return this._pageDataToLinkTemplateName['.'];
    }

    /**
     * Fetch the page data for a given URL.
     *
     * @async
     * @param {URL} url
     * @returns {PageData}
     * @throws {ValidationError} A validation error is thrown unless a valid URL is
     * passed.
     */
    async fetchPageData(url){
        // TO DO - add validation
        
        let ans = new PageData(url);
        
        // then try load the contents form the web
        let webDownloadResponseBody = '';
        try {
            let webDownloadResponse = await fetch(url);
            if(!webDownloadResponse.ok){
                throw new Error(`HTTP ${webDownloadResponse.status}: ${webDownloadResponse.statusText}`);
            }
            webDownloadResponseBody = await webDownloadResponse.text();
        } catch (err) {
            // fall back to extracting the title from the URL slug
            console.warn(`Failed to fetch page data for '${url}': ${err.message}`);
            console.warn('Falling back to reversing the URL slug for the title');
            ans.title = this.utilities.extractSlug(url) || 'Untitled';
            return ans;
        }
        let $ = cheerio.load(webDownloadResponseBody);
        ans.title = $('title').text().trim();
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
     * Generate a link given a URL. By default the registered template for the
     * URL's domain will be used, or, if none is registered, the overall
     * default will be used (`html`).
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

        //
        // -- resolve the template name to use for this URL --
        //
        let tplName = '';

        // resolve the template — if a template name is passed, try use it,
        // otherwise resolve the default for this URL's domain
        if(templateName && typeof templateName === 'string'){
            tplName = templateName;

            // make sure the template exists
            if(!this._linkTemplates[tplName]){
                console.warn(`No template named '${tplName}' is registered, falling back to global default '${this._pageDataToLinkTemplateName['.']}'`);
                tplName = this._pageDataToLinkTemplateName['.'];
            }
        } else {
            tplName = this.getTemplateNameForDomain((new URL(url)).hostname);
        }
        const template = this._linkTemplates[tplName];
        
        // get the page data        
        const pageData = await this.fetchPageData(url);
        
        // transform the page data to link data
        const linkData = this.getTransformerForDomain(pageData.uri.hostname())(pageData);

        // apply field-specific filters to the link data
        const fieldNames = ['url', 'text', 'description'];
        const templateData = linkData.asPlainObject();
        for(let fieldName of fieldNames){
            let fieldFilters = template.filtersFor(fieldName);
            for(let filterFn of fieldFilters){
                templateData[fieldName] = filterFn(templateData[fieldName]);
            }
        }

        // apply the universal filters to all the link data fields
        let globalFilters = template.filtersFor('all');
        for(let filterFn of globalFilters){
            for(let fieldName of fieldNames){
                templateData[fieldName] = filterFn(templateData[fieldName]);
            }
        }
        
        // render the link
        return Mustache.render(this._linkTemplates[tplName].templateString, templateData);
    }
};