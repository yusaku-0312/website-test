document.addEventListener('DOMContentLoaded', () => {
    const listingContainer = document.getElementById('listing-container');
    const paginationContainer = document.getElementById('pagination');
    const category = document.body.dataset.category; // 'blogs' or 'works'
    const ITEMS_PER_PAGE = 9;
    let allItems = [];

    // Initialize
    init();

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        const page = event.state ? event.state.page : 1;
        renderPage(page, false); // Don't push state on popstate
    });

    async function init() {
        if (!category) {
            console.error('Data category not defined in body dataset.');
            return;
        }

        try {
            const response = await fetch('./data/data.json');
            if (!response.ok) throw new Error('Failed to load data');
            const data = await response.json();

            if (!data[category]) {
                console.error(`Category "${category}" not found in data.`);
                return;
            }

            // Sort by date descending
            allItems = data[category].sort((a, b) => new Date(b.date) - new Date(a.date));

            // Get initial page from URL or default to 1
            const urlParams = new URLSearchParams(window.location.search);
            const initialPage = parseInt(urlParams.get('page')) || 1;

            renderPage(initialPage, false); // Don't push state on initial load
        } catch (error) {
            console.error('Error initializing listing:', error);
            listingContainer.innerHTML = '<p>データの読み込みに失敗しました。</p>';
        }
    }

    /**
     * Renders the specified page of items.
     * @param {number} page - The page number to render.
     * @param {boolean} [pushState=true] - Whether to update the URL history.
     */
    function renderPage(page, pushState = true) {
        const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);

        // Validate page number
        if (page < 1) page = 1;
        if (page > totalPages && totalPages > 0) page = totalPages;

        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = allItems.slice(start, end);

        renderCards(pageItems);
        renderPagination(totalPages, page);

        if (pushState) {
            updateUrl(page);
        }
        updateCanonical(page);
    }

    function updateUrl(page) {
        const url = new URL(window.location);
        if (page === 1) {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', page);
        }
        window.history.pushState({ page: page }, '', url);
    }

    function updateCanonical(page) {
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'canonical';
            document.head.appendChild(link);
        }

        const url = new URL(window.location.href.split('?')[0]); // Base URL without query params
        if (page > 1) {
            url.searchParams.set('page', page);
        }
        link.href = url.toString();
    }

    function renderCards(items) {
        listingContainer.innerHTML = '';
        if (items.length === 0) {
            listingContainer.innerHTML = '<p>記事がありません。</p>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'card-grid';

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';

            // Safety check for description
            const rawDescription = item.description || '';
            // Truncate description if too long (e.g., 80 characters)
            const description = rawDescription.length > 80
                ? rawDescription.substring(0, 80) + '...'
                : rawDescription;

            const title = item.title || 'No Title';

            card.innerHTML = `
                <a href="${item.link}" class="card-link">
                    <img class="card-image" src="${item.thumbnail}" alt="${item.alt || title}" loading="lazy">
                    <div class="card-content">
                        <h3 class="card-title">${title}</h3>
                        <p class="card-description">${description}</p>
                        <time datetime="${item.date}" style="font-size: 0.85rem; color: #999; margin-top: 10px; display: block;">${item.date.replace(/-/g, '.')}</time>
                    </div>
                </a>
            `;
            grid.appendChild(card);
        });

        listingContainer.appendChild(grid);
    }

    function renderPagination(totalPages, current) {
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        // Prev Button
        const prevBtn = createPaginationButton('<', current > 1 ? () => renderPage(current - 1) : null);
        if (current === 1) prevBtn.classList.add('disabled');
        paginationContainer.appendChild(prevBtn);

        // Page Numbers
        for (let i = 1; i <= totalPages; i++) {
            const btn = createPaginationButton(i, () => renderPage(i));
            if (i === current) btn.classList.add('active');
            paginationContainer.appendChild(btn);
        }

        // Next Button
        const nextBtn = createPaginationButton('>', current < totalPages ? () => renderPage(current + 1) : null);
        if (current === totalPages) nextBtn.classList.add('disabled');
        paginationContainer.appendChild(nextBtn);
    }

    function createPaginationButton(text, onClick) {
        const btn = document.createElement('button');
        btn.className = 'pagination-btn';
        btn.textContent = text;
        if (onClick) {
            btn.addEventListener('click', () => {
                onClick();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        return btn;
    }
});
