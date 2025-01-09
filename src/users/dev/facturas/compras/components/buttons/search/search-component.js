import "../../modal/register-purchase.js"

function loadSearchComponent() {
    fetch('./components/buttons/search/search-component.html')
        .then(response => response.text())
        .then(html => {
            const modalContainer = document.getElementById('search-container');
            modalContainer.innerHTML = html;
        })
}

loadSearchComponent();
