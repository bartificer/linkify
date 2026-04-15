/**
 * @file The definition of the main Linkifier class which provides the link rendering functionality with the help of the other classes and modules.
 * @author Bart Busschots <opensource@bartificer.ie>
 * @license MIT
 */

/**
 * Linkifier's core link rendering functionality.
 * @module linkifier
 * @requires link-data
 * @requires link-template
 * @requires page-data
 * @requires module:node-fetch
 * @requires module:cheerio
 * @requires module:mustache
 */
import { PageData } from './PageData.class.mjs';
import { LinkData } from './LinkData.class.mjs';
import { LinkTemplate } from './LinkTemplate.class.mjs';
import * as utilities from "./utilities.mjs";
import * as defaults from "./defaults.mjs";

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import Mustache from 'mustache';

/**
 * The class providing the link rendering functionality. Instances of this class capture the settings for generating links, and, generate links using these settings.
 */
export class Linkifier {
    /**
     * Builds a Linkifier instance ready for use rendering links using the default configration.
     * @see {@link module:defaults} for the default configuration settings.
     */
    constructor(){
        /**
         * A mapping of fully qualified domain names to data transformation functions.
         *
         * @private
         * @type {Object.<string, dataTransformer>}
         */
        this._pageDataToLinkDataTransmformers = {
            '.' : defaults.dataTransformer
        };

        /**
         * A mapping of fully qualified domain names to default template names.
         * 
         * @private
         * @type {Object.<string, string>}
         */
        this._pageDataToLinkTemplateName = {
            '.' : 'html' // default to the 'html' template for all domains unless otherwise specified
        };

        /**
         * The registered link templates.
         *
         * @private
         * @type {Object.<string, module:link-template.LinkTemplate>}
         */
        this._linkTemplates = {};

        /**
         * The loaded list of words with customised capitalisations.
         * 
         * @private
         * @type {string[]}
         */
        this._speciallyCapitalisedWords = [];
        defaults.speciallyCapitalisedWords.map(word => this._speciallyCapitalisedWords.push(word));

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
     * @readonly
     * @see {@link module:utilities} for the utility functions available in this collection.
     */
    get utilities() {
        return this._utilities;
    }

    /**
     * Shorthand property for `.utilities`.
     * @see {@link module:linkifier.Linkifier#utilities}
     */
    get util(){
        return this._utilities;
    }

    /**
     * The list of known words with special capitalisations. The words should be capitalised in the descired manner.
     * @type {string[]}
     */
    get speciallyCapitalisedWords(){
        const ans = [];
        this._speciallyCapitalisedWords.map(word => ans.push(word));
        return ans;
    }
    set speciallyCapitalisedWords(words){
        // TO DO - add validation

        this._speciallyCapitalisedWords = words;
    }

    /**
     * Register a data transformer function to a domain name.
     *
     * @param {string} domain - The fully qualified domain for which this transformer should be
     * used.
     * @param {dataTransformer} transformerFn - The data transformer callback.
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
     * the domain `www.bartificer.ie` the function will first look for a
     * transformer for the domain `www.bartificer.ie`, if there's no transformer
     * registered for that domain it will look for a transformer for the domain
     * `bartificer.ie`, if there's no transformer for that domain either it will
     * return the default transformer.
     *
     * @param {string} domain - The fully qualified domain for which to get the data transformer.
     * @returns {dataTransformer}
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
     * A list of the names of the registered link templates.
     * @type {string[]}
     * @readonly
     */
    get templateNames() {
        return Object.keys(this._linkTemplates);
    }

    /**
     * The name of the default template used when rendering links.
     * @type {string}
     * @throws {ValidationError} A validation error is thrown if the template name is missing, invalid, or doesn't correspond to a registered template.
     */
    get defaultTemplateName(){
        return this._pageDataToLinkTemplateName['.'];
    }
    set defaultTemplateName(templateName){
        const tplName = String(templateName);
        if(!this._linkTemplates[tplName]){
            throw new ValidationError(`No template named '${tplName}' is registered`);
        }
        this._pageDataToLinkTemplateName['.'] = tplName;
    }
    
    /**
     * The default link template.
     * @type {module:link-template.LinkTemplate}
     * @readonly
     */
    get defaultTemplate(){
        return this._linkTemplates[this._pageDataToLinkTemplateName['.']];
    }

    /**
     * Register a link template.
     *
     * @param {string} name
     * @param {module:link-template.LinkTemplate} template
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
     * @returns {module:link-template.LinkTemplate}
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
     * @param {string} domain - The fully qualified domain name for which this template should be used by default.
     * @param {string} templateName - The name of the template to use.
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
     * the domain `www.bartificer.ie` the function will first look for a
     * transformer for the domain `www.bartificer.ie`, if there's no transformer
     * registered for that domain it will look for a transformer for the domain
     * `bartificer.ie`, if there's no transformer for that domain either it will
     * return the default transformer.
     *
     * @param {string} domain - The fully qualified domain name to get the data transformer for.
     * @returns {dataTransformer}
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
     * @param {string} url
     * @returns {module:page-data.PageData}
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
            console.warn(`Falling back to de-slugifying URL (${err.message})`);
            ans.title = this.utilities.extractSlug(url, this._speciallyCapitalisedWords) || 'Untitled';
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
     * @param {string} url
     * @param {string} [templateName='html']
     * @returns {string}
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