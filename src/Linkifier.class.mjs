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
 * @requires module:title-case
 */
import { PageData } from './PageData.class.mjs';
import { LinkData } from './LinkData.class.mjs';
import { LinkTemplate } from './LinkTemplate.class.mjs';
import * as utilities from "./utilities.mjs";
import * as defaults from "./defaults.mjs";

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import Mustache from 'mustache';
import * as titleCase from 'title-case';

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
         * @type {Set<string>}
         * @see {@link module:defaults.speciallyCapitalisedWords} for the initial list of specially capitalised words.
         */
        this._speciallyCapitalisedWords = new Set();
        defaults.speciallyCapitalisedWords.map(word => this._speciallyCapitalisedWords.add(word));

        /**
         * The loaded list of small words for title case conversions with customised capitalisations.
         * 
         * Initialised with the default list of small words from the title-case module augmented with the additionall small words defined in the defaults module.
         * 
         * @private
         * @type {Set<string>}
         * @see {@link module:defaults.smallWords} for the additional small words added from the defaults module.
         * @see {@link module:title-case} for details of the title-case dependency.
         */
        this._smallWords = new Set(defaults.importedSmallWords.SMALL_WORDS);
        defaults.extraSmallWords.map(word => this._smallWords.add(word));

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
     * A collection of utility functions, both used within the module's own code, and available for use when customising the module.
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
     * The default values used for renderig links.
     * @type {Object}
     * @readonly
     * @see {@link module:defaults} for the list of defaults defined.
     */
    static get defaults() {
        return defaults;
    }

    /**
     * The set of known of known words with special capitalisations.
     * 
     * This list is initialised with the list of specially capitalised words from the defaults module.
     * @type {Set<string>}
     * @readonly
     * @see {@link module:defaults.speciallyCapitalisedWords} for the initial list of specially capitalised words.
     */
    get speciallyCapitalisedWords(){
        return this._speciallyCapitalisedWords;
    }

    /**
     * The set of known small words for title case conversions.
     * 
     * This list is initialised with the list of small words from the title-case module augmented with the additionall small words defined in the defaults module.
     * @type {Set<string>}
     * @readonly
     * @see {@link module:defaults.smallWords} for the additional small words added from the defaults module.
     * @see {@link module:title-case} for details of the title-case dependency.
     */
    get smallWords(){
        return this._smallWords;
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
     * @param {string} url - The URL to fetch the page data for.
     * @param {extraFieldsExtractorFunction} [extraFieldsExtractor] - An optional function to extract additional fields from the web page DOM object.
     * @returns {module:page-data.PageData}
     * @throws {TypeError} A TypeError is thrown if the URL is missing or invalid, or if the extraFieldsExtractor is provided but is not a function.
     * @throws {Error} An Error is thrown if the page source cannot be fetched and an extraFieldsExtractor is provided (can't fall back to reversing the URL slug). Any errors thrown by the field extractor, if present, are also re-thrown.
     */
    async fetchPageData(url, extraFieldsExtractor){
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
            // if we have an extra field extractor, we can't fall back, so re-throw the error.
            if(typeof extraFieldsExtractor === 'function') {
                const msg = "Failed to fetch page source when extra field extraction is needed, cannot fall back to reversing the URL slug";
                console.error(`${msg}: ${err.message}`);
                throw new Error(msg, { cause: err });
            }

            // fall back to extracting the title from the URL slug
            console.warn(`Falling back to de-slugifying URL (${err.message})`);
            ans.title = this.utilities.extractSlug(url, this.speciallyCapitalisedWords, this.smallWords) || 'Untitled';
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

        // if an extra fields extractor is provided, use it to extract the extra fields and add them to the page data object
        if(typeof extraFieldsExtractor === 'function'){
            try {
                ans.extraFields = extraFieldsExtractor($);
            } catch (err) {
                const msg = "An error occurred while extracting extra fields from the page DOM";
                console.error(`${msg}: ${err.message}`);
                throw new Error(msg, { cause: err });
            }
        }

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
     * @param {string} [templateName] - An optional template name to override the normal template resolution process. The value passed must correspond to a registered template name, and will be coerced to a string with `String(templateName)`.
     * @returns {string} The generated link.
     * @throws {TypeError} A TypeError is thrown if the URL is missing or invalid.
     * @throws {ValidationError} A ValidationError is thrown if a template name is passed but is invalid or doesn't correspond to a registered template.
     * @throws {Error} An error is thrown if the resolved template supports extra fields but the page source cannot be fetched, or, if the templates's extra field extractor function throws an error, or, if the link data transformation fails.
     */
    async generateLink(url, templateName){
        // TO DO - add validation

        //
        // -- resolve the template name to use for this URL --
        //

        // default to any passed template name, otherwise resolve the default for this URL's domain
        let tplName = templateName ? String(templateName) : '';

        // if no template name was passed, resolve the default for the URL's domain
        if(!tplName){
            tplName = this.getTemplateNameForDomain((new URL(url)).hostname);
        }

        // make sure the template exists before storing the resolved template
        if(!this._linkTemplates[tplName]){
            const msg = `No template named '${tplName}' is registered`;
            console.error(msg);
            throw new ValidationError(msg);
        }
        const template = this._linkTemplates[tplName];
        
        // get the page data
        const pageData = await this.fetchPageData(url, template.hasExtraFields ? template.fieldExtractor : null); // throws errors — allow them to pass through
        
        // try transform the page data to link data
        let linkData = null;
        try {
            linkData = this.getTransformerForDomain(pageData.uri.hostname())(pageData);
            if(template.hasExtraFields){
                linkData.extraFields = pageData.extraFields;
            }
        } catch (err) {
            const msg = "An error occurred while transforming the page data to link data";
            console.error(`${msg}: ${err.message}`);
            throw new Error(msg, { cause: err });
        }

        // try apply the template field filters to the link data
        const fieldNames = LinkData.standardFieldNames;
        let templateData = {};
        try {
            // apply the field-specific filters to the appropriate standard link data fields
            templateData = linkData.asPlainObject();
            for(let fieldName of fieldNames){
                let fieldFilters = template.filtersFor(fieldName);
                for(let filterFn of fieldFilters){
                    templateData[fieldName] = filterFn(templateData[fieldName]);
                }
            }

            // apply the universal filters to all the standard link data fields
            let globalFilters = template.filtersFor('all');
            for(let filterFn of globalFilters){
                for(let fieldName of fieldNames){
                    templateData[fieldName] = filterFn(templateData[fieldName]);
                }
            }
        } catch (err) {
            const msg = "An error occurred while applying the template's field filters to the standard link data fields";
            console.error(`${msg}: ${err.message}`);
            throw new Error(msg, { cause: err });
        }
        
        // try render the link
        try {
            return Mustache.render(this._linkTemplates[tplName].templateString, templateData);
        } catch (err) {
            const msg = "An error occurred while rendering the template";
            console.error(`${msg}: ${err.message}`);
            throw new Error(msg, { cause: err });
        }
        
    }
};