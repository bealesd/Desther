const contentArea = document.getElementById('content-area');

document.addEventListener('click', async (event) => {



    if (event.target.tagName === 'MENU-PAGE') {
        const button = event.composedPath().find(el => el.nodeName === 'BUTTON');
        const link = button.dataset['href'];
        if (!link) return;

        if (link === 'index.html')
            document.querySelector('menu-page').style.display = 'block';
        else
            document.querySelector('menu-page').style.display = 'none';

        const css = button.dataset['css'];

        const response = await fetch(link);
        if (!response.ok) return console.log('Network response was not ok');

        const html = await response.text();
        contentArea.innerHTML = html; // Load the new content

        // Load and apply specific styles for the new content
        if (!css) return;
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = css; // Your content-specific styles
        contentArea.appendChild(styleLink);
    }
    else if(event.target.classList.contains('back-button')){
        const button = event.target;
        contentArea.innerHTML = '';
        document.querySelector('menu-page').style.display = 'block';
    }

});
