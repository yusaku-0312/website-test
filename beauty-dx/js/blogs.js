/* ==========================================================================
   beauty-dx / blogs.js — Blog list pagination
   記事が増えた時に自動でページネーションを生成します。
   data/blogs.json を追記するだけで一覧ページに反映されます。
   ========================================================================== */

(function () {
    'use strict';

    var PER_PAGE = 5; // 1ページあたりの表示件数（featuredを除く）

    document.addEventListener('DOMContentLoaded', function () {
        var list = document.getElementById('blogs-list');
        var paginationEl = document.getElementById('blogs-pagination');
        if (!list || !paginationEl) return;

        var items = Array.from(list.querySelectorAll('.blogs-item'));
        var totalItems = items.length;
        var totalPages = Math.ceil(totalItems / PER_PAGE);

        // 1ページしかなければページネーション不要
        if (totalPages <= 1) return;

        var currentPage = 1;

        function showPage(page) {
            currentPage = page;
            var start = (page - 1) * PER_PAGE;
            var end = page * PER_PAGE;

            items.forEach(function (item, i) {
                item.hidden = !(i >= start && i < end);
            });

            renderPagination();

            // スクロールをリストの先頭へ
            list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function renderPagination() {
            paginationEl.innerHTML = '';

            // 前へ
            if (currentPage > 1) {
                var prev = createPageBtn('←', currentPage - 1, '前のページ');
                paginationEl.appendChild(prev);
            }

            // ページ番号
            for (var i = 1; i <= totalPages; i++) {
                var btn = createPageBtn(String(i), i, i + 'ページ目');
                if (i === currentPage) {
                    btn.classList.add('is-active');
                    btn.setAttribute('aria-current', 'page');
                }
                paginationEl.appendChild(btn);
            }

            // 次へ
            if (currentPage < totalPages) {
                var next = createPageBtn('→', currentPage + 1, '次のページ');
                paginationEl.appendChild(next);
            }
        }

        function createPageBtn(label, page, ariaLabel) {
            var btn = document.createElement('button');
            btn.className = 'blogs-page-btn';
            btn.textContent = label;
            btn.setAttribute('aria-label', ariaLabel);
            btn.addEventListener('click', function () {
                showPage(page);
            });
            return btn;
        }

        // 初期表示
        showPage(1);
    });

}());
