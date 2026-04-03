import { PageData } from './PageData.class.mjs';
import { LinkData } from './LinkData.class.mjs';
import { LinkTemplate } from './LinkTemplate.class.mjs';
import * as utilities from "./utilities.mjs";

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
        // === Create and register the default templates ===
        //
        // TO DO — migrate these to a separate file
        this.registerTemplate(
            'html',
            new LinkTemplate('<a href="{{{url}}}" title="{{description}}">{{text}}</a>')
        );
        this.registerTemplate(
            'htmlNewTab',
            new LinkTemplate('<a href="{{{url}}}" title="{{description}}" target="_blank" rel="noopener">{{text}}</a>')
        );
        this.registerTemplate(
            'markdown',
            new LinkTemplate('[{{{text}}}]({{{url}}})')
        );
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
     * Register a link template.
     *
     * @param {templateName} name
     * @param {module:@bartificer/linkify.LinkTemplate} template
     * @throws {ValidationError} A validation error is thrown unless both a valid
     * name and template object are passed.
     */
    registerTemplate(name, template){
        // TO DO - add validation
    
        this._linkTemplates[name] = template;
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
        let lData = this.getTransformerForDomain(pData.uri.hostname())(pData);
        
        // render the link
        return Mustache.render(this._linkTemplates[tplName].templateString, lData.asPlainObject());
    }
};