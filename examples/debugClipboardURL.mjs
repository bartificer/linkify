import clipboardy from 'clipboardy';
//import linkify from '../src/index.js'; // for using the source module
import linkify from '@bartificer/linkify'; // for using the built module

let testURL = clipboardy.readSync();
linkify.fetchPageData(testURL).then(function(d){
    console.log(d.asPlainObject());
});