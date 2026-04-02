import clipboardy from 'clipboardy';
import linkify from '../src/index.js';

let testURL = clipboardy.readSync();
linkify.fetchPageData(testURL).then(function(d){
    console.log(d);
});