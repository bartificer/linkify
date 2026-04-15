document.addEventListener('DOMContentLoaded', function() {    
    // Get a list of all <pre> tags with the class 'lang-mermaid'
    const mermaidPreTags = document.querySelectorAll('pre.lang-mermaid');
    
    // Loop over all prettified Mermaid Code blocks and convert them to divs with the class 'mermaid'
    mermaidPreTags.forEach(pre => {
        const code = pre.textContent; // Get the raw code from the <pre> tag
        console.log('INFO: converting pretified Mermaid code block to div for client-side rendering:', code);
        const mermaidDiv = document.createElement('div'); // Create a new <div> element
        mermaidDiv.classList.add('mermaid'); // Add the 'mermaid' class to the <div>
        mermaidDiv.textContent = code; // Set the text content of the <div> to the raw code
        pre.parentNode.replaceChild(mermaidDiv, pre); // Replace the <pre> tag with the new <div>
    });

    // Initialize Mermaid
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({ startOnLoad: true });
    } else {
        console.error('Mermaid library is not loaded.');
    }
});