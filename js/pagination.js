
document.addEventListener('DOMContentLoaded', () => {
    const BLOGS_PER_PAGE = 9;
    const WORKS_PER_PAGE = 6;
    const DATA_URL = '/data/data.json'; // Adjust if needed depending on server root

    // Determine current page type
    const isBlogsPage = document.getElementById('js-blog-list');
    const isWorksPage = document.getElementById('js-works-list');

    // If neither, exit
    if (!isBlogsPage && !isWorksPage) return;

    const targetElement = isBlogsPage || isWorksPage;
    const itemType = isBlogsPage ? 'blogs' : 'works';
    const itemsPerPage = isBlogsPage ? BLOGS_PER_PAGE : WORKS_PER_PAGE;

    // Get current page from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page')) || 1;

    fetch(DATA_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const items = data[itemType];

            // Sort items by ID desc
            items.sort((a, b) => b.id - a.id);

            // Calculate pagination
            const totalItems = items.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            // Validate current page
            let validPage = currentPage;
            if (validPage < 1) validPage = 1;
            if (validPage > totalPages && totalPages > 0) validPage = totalPages;

            // Slice items for current page
            const startIndex = (validPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = items.slice(startIndex, endIndex);

            // Render Items
            renderItems(targetElement, pageItems, itemType);

            // Render Pagination
            renderPagination(validPage, totalPages);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            targetElement.innerHTML = '<p class="text-center">データの読み込みに失敗しました。</p>';
        });
});

function renderItems(container, items, type) {
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center">記事がありません。</p>';
        return;
    }

    const priorityItemCount = 3;
    const html = items.map((item, index) => {
        const loading = index < priorityItemCount ? 'eager' : 'lazy';
        const fetchPriorityAttr = index === 0 ? ' fetchpriority="high"' : '';
        if (type === 'blogs') {
            return `
                <article class="blog-card fade-in-section">
                    <a href="${item.link}" class="blog-link">
                        <div class="blog-image">
                            <img src="${item.thumbnail}" alt="${item.alt}" loading="${loading}" decoding="async"${fetchPriorityAttr}>
                        </div>
                        <div class="blog-body">
                            <div class="blog-meta">
                                <span class="blog-date">${item.date.replace(/-/g, '.')}</span>
                                <!-- Tag logic could be improved if tags were in data.json, using mocked logic or title parsing if needed. 
                                     For now, using a generic tag or parsing from description/title if applicable? 
                                     data.json doesn't have tags field. I will omit tag or use a placeholder. -->
                                <span class="blog-tag">MIRAINA</span> 
                            </div>
                            <h3 class="blog-title">${item.title}</h3>
                            <p class="blog-excerpt">${item.description}</p>
                        </div>
                    </a>
                </article>
            `;
        } else {
            return `
                <a href="${item.link}" class="work-card fade-in-section">
                    <div class="work-image">
                        <img src="${item.thumbnail}" alt="${item.alt}" loading="${loading}" decoding="async"${fetchPriorityAttr}>
                    </div>
                    <div class="work-content">
                        <div class="work-cat" style="color: #666; font-size: 0.8rem; margin-bottom: 0.5rem;">
                            <!-- Data.json does not strictly separate category, using description or date as placeholder context? -->
                            ${item.date.replace(/-/g, '.')}
                        </div>
                        <h3 class="work-title">${item.title}</h3>
                        <p class="work-desc">${item.description}</p>
                    </div>
                </a>
            `;
        }
    }).join('');

    container.innerHTML = html;

    // Trigger animations for dynamically added content
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });

    const newElements = container.querySelectorAll('.fade-in-section');
    newElements.forEach(el => observer.observe(el));
}

function renderPagination(currentPage, totalPages) {
    const paginationContainers = document.querySelectorAll('.pagination');

    // Helper to generate SEO-friendly URLs
    const getPageUrl = (page) => {
        return page === 1 ? window.location.pathname : `?page=${page}`;
    };

    paginationContainers.forEach(container => {
        let html = '';

        // Prev Button
        if (currentPage > 1) {
            html += `<a href="${getPageUrl(currentPage - 1)}" class="page-link">&lt;</a>`;
        } else {
            html += `<span class="page-link disabled">&lt;</span>`;
        }

        // Numeric Links
        // Logic for simple pagination: show all or window? Assuming small number of pages for now.
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                html += `<span class="page-link active">${i}</span>`;
            } else {
                html += `<a href="${getPageUrl(i)}" class="page-link">${i}</a>`;
            }
        }

        // Next Button
        if (currentPage < totalPages) {
            html += `<a href="${getPageUrl(currentPage + 1)}" class="page-link">&gt;</a>`;
        } else {
            html += `<span class="page-link disabled">&gt;</span>`;
        }

        container.innerHTML = html;
    });
}
