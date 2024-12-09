import { Column } from './Column.js';

export class Board {
  constructor(options) {
    this.columns = [];
    this.swimlanes = options.swimlanes || [];
    this.init(options);
    this.setupEventListeners();

    // Initialize search configuration
    this.searchConfig = {
      enabled: options.search?.enabled ?? false,
      placeholder: options.search?.placeholder ?? 'Search cards...',
      position: options.search?.position ?? 'top-right',
      customSearch: options.search?.customSearch || null,
      // Default searchable fields if not specified
      fields: options.search?.fields || ['title', 'description', 'tags'],
      // Optional debounce time for search (in ms)
      debounceTime: options.search?.debounceTime ?? 300
    };

    if (this.searchConfig.enabled) {
      this.initializeSearch();
    }

    // Initialize filter configuration
    this.filterConfig = {
      enabled: options.filter?.enabled ?? false,
      filters: options.filter?.filters || [],
      customFilter: options.filter?.customFilter || null,
      position: options.filter?.position ?? 'top-right',
    };

    if (this.filterConfig.enabled) {
      this.initializeFilters();
    }
  }

  init(options) {
    // Get or create container
    this.container = typeof options.container === 'string' 
      ? document.querySelector(options.container) 
      : options.container;
    
    if (!this.container) {
      throw new Error('Invalid container element');
    }

    // Create board element
    this.element = document.createElement('div');
    this.element.className = 'kanban-board';
    this.container.appendChild(this.element);

    // Apply theme
    this.theme = options.theme || 'light';
    this.element.setAttribute('data-theme', this.theme);

    // Create swimlanes if provided
    if (this.swimlanes.length > 0) {
      this.element.classList.add('with-swimlanes');
      this.createSwimlanes(options.columns);
      // Add "Add Column" button to each swimlane
      this.swimlanes.forEach(swimlane => {
        const swimlaneColumns = this.element.querySelector(`[data-swimlane-id="${swimlane.id}"] .kanban-swimlane-columns`);
        swimlaneColumns.appendChild(this.createAddColumnButton());
      });
    } else {
      // Add initial columns if no swimlanes
      if (options.columns) {
        options.columns.forEach(column => this.addColumn(column));
      }
      // Add "Add Column" button to main board
      this.element.appendChild(this.createAddColumnButton());
    }
  }

  createSwimlanes(columns) {
    this.swimlanes.forEach(swimlane => {
      const swimlaneEl = document.createElement('div');
      swimlaneEl.className = 'kanban-swimlane';
      swimlaneEl.setAttribute('data-swimlane-id', swimlane.id);
      
      const header = document.createElement('div');
      header.className = 'kanban-swimlane-header';
      header.textContent = swimlane.title;
      swimlaneEl.appendChild(header);

      const columnsContainer = document.createElement('div');
      columnsContainer.className = 'kanban-swimlane-columns';

      // Create columns for this swimlane
      columns.forEach(columnConfig => {
        const column = new Column({
          ...columnConfig,
          swimlaneId: swimlane.id
        });
        this.columns.push(column);
        columnsContainer.appendChild(column.element);
      });

      swimlaneEl.appendChild(columnsContainer);
      this.element.appendChild(swimlaneEl);
    });
  }

  addColumn(column) {
    this.columns.push(column);
    this.element.appendChild(column.element);
  }

  removeColumn(columnId) {
    const index = this.columns.findIndex(col => col.id === columnId);
    if (index !== -1) {
      this.columns[index].element.remove();
      this.columns.splice(index, 1);
    }
  }

  setupEventListeners() {
    this.element.addEventListener('click', this.handleBoardClick.bind(this));
  }

  handleBoardClick(e) {
    // Handle board level clicks
  }

createAddColumnButton() {
    const addColumnBtn = document.createElement('div');
    addColumnBtn.className = 'kanban-add-column';
    addColumnBtn.innerHTML = `
    <div class="k-meta" style="justify-content:center">
        <span class="k-meta-item"><span class="add-card-icon">+</span> Add Column</span>
    </div>
    `;

    addColumnBtn.addEventListener('click', () => this.showAddColumnModal());
    return addColumnBtn;
  }

  showAddColumnModal() {
    const modal = document.createElement('div');
    modal.className = 'k-modal-overlay';
    modal.innerHTML = `
      <div class="k-modal">
        <div class="k-modal-header">
          <h3 class="k-modal-title">Add New Column</h3>
        </div>
        <div class="k-modal-body">
          <form id="addColumnForm">
            <input type="text" class="k-input" placeholder="Column Title" required>
            <div class="k-checkbox-wrapper">
              <input type="checkbox" id="wipLimit" class="k-checkbox">
              <label for="wipLimit" class="k-checkbox-label">Enable WIP Limit</label>
            </div>
            <input type="number" class="k-input" placeholder="WIP Limit" min="1" disabled>
          </form>
        </div>
        <div class="k-modal-footer">
          <button type="button" class="k-button k-button-light" id="cancelBtn">Cancel</button>
          <button type="submit" form="addColumnForm" class="k-button k-button-primary">Add Column</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Get elements
    const form = modal.querySelector('form');
    const titleInput = form.querySelector('input[type="text"]');
    const wipCheckbox = form.querySelector('input[type="checkbox"]');
    const wipInput = form.querySelector('input[type="number"]');
    const cancelBtn = modal.querySelector('#cancelBtn');
    const modalContent = modal.querySelector('.k-modal');

    // Show modal with animation
    requestAnimationFrame(() => {
      modal.classList.add('active');
      modalContent.classList.add('active');
      titleInput.focus();
    });

    // Handle WIP limit toggle
    wipCheckbox.addEventListener('change', () => {
      wipInput.disabled = !wipCheckbox.checked;
      if (wipCheckbox.checked) {
        wipInput.focus();
      }
    });

    // Handle close
    const closeModal = () => {
      modal.classList.remove('active');
      modalContent.classList.remove('active');
      setTimeout(() => modal.remove(), 200);
    };

    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const columnConfig = {
        id: 'column-' + Date.now(),
        title: titleInput.value.trim(),
        collapsible: true
      };

      if (wipCheckbox.checked && wipInput.value) {
        columnConfig.wipLimit = parseInt(wipInput.value);
      }

      try {
        // Create and add the new column
        if (this.swimlanes.length > 0) {
          // Add to each swimlane
          this.swimlanes.forEach(swimlane => {
            const swimlaneEl = document.querySelector(`[data-swimlane-id="${swimlane.id}"]`);
            const columnsContainer = swimlaneEl.querySelector('.kanban-swimlane-columns');
            const addBtn = columnsContainer.querySelector('.kanban-add-column');
            const column = new Column({
              ...columnConfig,
              swimlaneId: swimlane.id
            });
            this.columns.push(column);
            columnsContainer.insertBefore(column.element, addBtn);
          });
        } else {
          // Add to main board
          const addBtn = this.element.querySelector('.kanban-add-column');
          const column = new Column(columnConfig);
          this.columns.push(column);
          this.element.insertBefore(column.element, addBtn);
        }

        closeModal();
      } catch (error) {
        console.error('Error adding column:', error);
      }
    });
  }

  addCardToColumn(columnIndex, card) {
    if (this.columns[columnIndex]) {
      const success = this.columns[columnIndex].addCard(card);
      if (!success) {
        console.warn('Failed to add card to column:', columnIndex);
      }
    } else {
      console.error('Column not found at index:', columnIndex);
    }
  }

  initializeSearch() {
    // Create board header
    const boardHeader = document.createElement('div');
    boardHeader.className = 'kanban-board-header';
    
    // Create left section
    const headerLeft = document.createElement('div');
    headerLeft.className = 'kanban-board-header-left';
    
    // Create right section
    const headerRight = document.createElement('div');
    headerRight.className = 'kanban-board-header-right';
    
    // Create board title if provided
    if (this.title) {
      const titleEl = document.createElement('h2');
      titleEl.className = 'kanban-board-title';
      titleEl.textContent = this.title;
      headerLeft.appendChild(titleEl);
    }
    
    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = `kanban-search ${this.searchConfig.position || 'right'}`;
    
    // Create search wrapper with icon
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'kanban-search-wrapper';
    
    // Add search icon
    const searchIcon = document.createElement('span');
    searchIcon.className = 'kanban-search-icon';
    searchIcon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;
    
    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'kanban-search-input';
    searchInput.placeholder = this.searchConfig.placeholder;
    
    // Create clear button
    const clearButton = document.createElement('button');
    clearButton.className = 'kanban-search-clear';
    clearButton.innerHTML = '×';
    clearButton.style.display = 'none';
    
    searchWrapper.appendChild(searchIcon);
    searchWrapper.appendChild(searchInput);
    searchWrapper.appendChild(clearButton);
    searchContainer.appendChild(searchWrapper);
    
    // Add search to appropriate section based on position
    if (this.searchConfig.position === 'left') {
      headerLeft.appendChild(searchContainer);
      boardHeader.appendChild(headerLeft);
      boardHeader.appendChild(headerRight);
    } else {
      headerRight.appendChild(searchContainer);
      boardHeader.appendChild(headerLeft);
      boardHeader.appendChild(headerRight);
    }
    
    // Insert header before board
    this.container.insertBefore(boardHeader, this.element);

    // Setup event listeners with debouncing
    let debounceTimeout;
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value;
      clearButton.style.display = value ? 'block' : 'none';
      searchContainer.classList.toggle('has-value', !!value);
      
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        this.performSearch(value);
      }, this.searchConfig.debounceTime);
    });

    // Clear search
    clearButton.addEventListener('click', () => {
      searchInput.value = '';
      clearButton.style.display = 'none';
      searchContainer.classList.remove('has-value');
      this.clearSearch();
      searchInput.focus();
    });
  }

  performSearch(query) {
    if (!query) {
      this.clearSearch();
      return;
    }

    const searchFn = this.searchConfig.customSearch || this.defaultSearch.bind(this);
    const results = searchFn(query, this.getAllCards());

    this.highlightSearchResults(results);
  }

  defaultSearch(query, cards) {
    query = query.toLowerCase();
    return cards.filter(card => {
      return this.searchConfig.fields.some(field => {
        const value = this.getCardFieldValue(card, field);
        return value && value.toLowerCase().includes(query);
      });
    });
  }

  getCardFieldValue(card, field) {
    if (!field) return '';
    
    // Handle nested fields (e.g., 'metadata.author')
    const fields = field.split('.');
    let value = card;
    
    for (const f of fields) {
        if (value === null || value === undefined) {
            return '';
        }
        value = value[f];
    }

    // Handle special cases
    if (field === 'tags' && Array.isArray(value)) {
        return value.join(' ');
    }

    return String(value || '');
  }

  getAllCards() {
    const cards = [];
    this.columns.forEach(column => {
      cards.push(...column.cards);
    });
    return cards;
  }

  highlightSearchResults(matchedCards) {
    // Create a Set of matched card IDs for faster lookup
    const matchedIds = new Set(matchedCards.map(card => card.id));
    const searchContainer = this.container.querySelector('.kanban-search');

    this.columns.forEach(column => {
      column.cards.forEach(card => {
        const element = card.element;
        if (!element) return;

        // Remove existing classes first
        element.classList.remove('search-match', 'search-hidden');

        // Add appropriate class based on match
        if (matchedIds.has(card.id)) {
          element.classList.add('search-match');
          // Ensure card is visible with a small delay for animation
          setTimeout(() => {
            element.style.display = '';
          }, 50);
        } else {
          // Hide non-matching cards with animation
          element.classList.add('search-hidden');
          // Actually hide the element after transition
          setTimeout(() => {
            if (element.classList.contains('search-hidden')) {
              element.style.display = 'none';
            }
          }, 200);
        }
      });

      // Update column card count if needed
      if (typeof column.updateCardCount === 'function') {
        column.updateCardCount();
      }
    });

    // Update search results count
    if (searchContainer) {
      searchContainer.setAttribute('data-matches', 
        `${matchedCards.length} of ${this.getAllCards().length}`
      );
    }

    // Dispatch search event
    this.element.dispatchEvent(new CustomEvent('board:search', {
      detail: {
        matches: matchedCards,
        total: this.getAllCards().length
      }
    }));
  }

  clearSearch() {
    const searchContainer = this.container.querySelector('.kanban-search');
    
    this.columns.forEach(column => {
      column.cards.forEach(card => {
        const element = card.element;
        if (!element) return;
        
        // Remove search-related classes
        element.classList.remove('search-match', 'search-hidden');
        element.style.display = '';
      });

      // Update column card count if needed
      if (typeof column.updateCardCount === 'function') {
        column.updateCardCount();
      }
    });

    // Clear search results count
    if (searchContainer) {
      searchContainer.removeAttribute('data-matches');
    }

    // Dispatch search clear event
    this.element.dispatchEvent(new CustomEvent('board:searchClear'));
  }

  showNotification(options) {
    const container = document.querySelector('.k-notification-container') || (() => {
      const cont = document.createElement('div');
      cont.className = 'k-notification-container';
      document.body.appendChild(cont);
      return cont;
    })();

    const notification = document.createElement('div');
    notification.className = `k-notification ${options.type || 'info'}`;
    
    const icon = {
      success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>`,
      error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`,
      warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
      info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>`
    };

    notification.innerHTML = `
      <div class="k-notification-icon" style="color: var(--${options.type || 'primary'}-color)">
        ${icon[options.type || 'info']}
      </div>
      <div class="k-notification-content">
        ${options.title ? `<h4 class="k-notification-title">${options.title}</h4>` : ''}
        <p class="k-notification-message">${options.message}</p>
      </div>
      <button class="k-notification-close">×</button>
    `;

    container.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Setup close button
    const closeBtn = notification.querySelector('.k-notification-close');
    const close = () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    };

    closeBtn.addEventListener('click', close);

    // Auto close after duration
    if (options.duration !== 0) {
      setTimeout(close, options.duration || 4000);
    }

    return notification;
  }

  initializeFilters() {
    const boardHeader = this.container.querySelector('.kanban-board-header');
    if (!boardHeader) return;

    const targetSection = this.filterConfig.position === 'left' 
      ? boardHeader.querySelector('.kanban-board-header-left')
      : boardHeader.querySelector('.kanban-board-header-right');

    // Create filter container
    const filterContainer = document.createElement('div');
    filterContainer.className = 'kanban-filter';
    
    // Create filter button with better styling
    const filterBtn = document.createElement('button');
    filterBtn.className = 'kanban-filter-btn';
    filterBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
      </svg>
      <span>Filters</span>
      <span class="filter-count"></span>
    `;

    // Create filter dropdown with better structure
    const filterDropdown = document.createElement('div');
    filterDropdown.className = 'kanban-filter-dropdown';
    
    // Add filter header
    const filterHeader = document.createElement('div');
    filterHeader.className = 'kanban-filter-header';
    filterHeader.innerHTML = `
      <h3>Filter Cards</h3>
      <button class="clear-filters">Clear all</button>
    `;
    filterDropdown.appendChild(filterHeader);

    // Add filter groups
    const filterList = document.createElement('div');
    filterList.className = 'kanban-filter-list';
    
    // Add predefined filters
    this.filterConfig.filters.forEach(filter => {
      const filterItem = this.createFilterItem(filter);
      filterList.appendChild(filterItem);
    });

    filterDropdown.appendChild(filterList);
    filterContainer.appendChild(filterBtn);
    filterContainer.appendChild(filterDropdown);
    targetSection.appendChild(filterContainer);

    // Update filter count
    const updateFilterCount = () => {
      const count = this.container.querySelectorAll('.kanban-filter-item input:checked').length;
      const countEl = filterBtn.querySelector('.filter-count');
      if (count > 0) {
        countEl.textContent = count;
        countEl.classList.add('active');
      } else {
        countEl.textContent = '';
        countEl.classList.remove('active');
      }
    };

    // Toggle dropdown
    filterBtn.addEventListener('click', () => {
      filterDropdown.classList.toggle('active');
    });

    // Clear all filters
    filterHeader.querySelector('.clear-filters').addEventListener('click', () => {
      this.container.querySelectorAll('.kanban-filter-item input:checked')
        .forEach(checkbox => {
          checkbox.checked = false;
        });
      this.applyFilters();
      updateFilterCount();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!filterContainer.contains(e.target)) {
        filterDropdown.classList.remove('active');
      }
    });

    // Listen for filter changes
    filterList.addEventListener('change', () => {
      updateFilterCount();
    });
  }

  createFilterItem(filter) {
    const item = document.createElement('div');
    item.className = 'kanban-filter-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `filter-${filter.id}`;
    checkbox.className = 'k-checkbox';
    
    const label = document.createElement('label');
    label.htmlFor = `filter-${filter.id}`;
    label.className = 'k-checkbox-label';
    
    // Add icon if provided
    if (filter.icon) {
      label.innerHTML = `
        <span class="filter-icon">${filter.icon}</span>
        <span class="filter-label">${filter.label}</span>
      `;
    } else {
      label.innerHTML = `<span class="filter-label">${filter.label}</span>`;
    }

    item.appendChild(checkbox);
    item.appendChild(label);

    checkbox.addEventListener('change', () => {
      this.applyFilters();
    });

    return item;
  }

  applyFilters() {
    const activeFilters = Array.from(
      this.container.querySelectorAll('.kanban-filter-item input:checked')
    ).map(checkbox => {
      const filterId = checkbox.id.replace('filter-', '');
      return this.filterConfig.filters.find(f => f.id === filterId);
    });

    const cards = this.getAllCards();
    const matchedCards = this.filterCards(cards, activeFilters);
    this.updateFilteredCards(matchedCards);
  }

  filterCards(cards, activeFilters) {
    if (activeFilters.length === 0) return cards;

    return cards.filter(card => {
        if (this.filterConfig.customFilter) {
            try {
                return this.filterConfig.customFilter(card, activeFilters);
            } catch (error) {
                console.warn('Custom filter error:', error);
                return true; // Include card if custom filter fails
            }
        }

        return activeFilters.every(filter => {
            try {
                // Handle custom filter function
                if (filter.operator === 'custom' && typeof filter.fn === 'function') {
                    return filter.fn(card);
                }

                const value = this.getCardFieldValue(card, filter.field);
                
                switch (filter.operator) {
                    case 'equals':
                        return value === String(filter.value);
                    case 'contains':
                        return value.toLowerCase().includes(String(filter.value).toLowerCase());
                    case 'in':
                        return Array.isArray(filter.value) && 
                               filter.value.some(v => value.toLowerCase().includes(String(v).toLowerCase()));
                    case 'startsWith':
                        return value.toLowerCase().startsWith(String(filter.value).toLowerCase());
                    case 'endsWith':
                        return value.toLowerCase().endsWith(String(filter.value).toLowerCase());
                    case 'isNotEmpty':
                        return value !== '';
                    default:
                        return true; // Include card if operator is not recognized
                }
            } catch (error) {
                console.warn('Filter error:', error, 'Filter:', filter);
                return true; // Include card if filter fails
            }
        });
    });
  }

  updateFilteredCards(matchedCards) {
    const matchedIds = new Set(matchedCards.map(card => card.id));

    this.columns.forEach(column => {
      column.cards.forEach(card => {
        const element = card.element;
        if (!element) return;

        if (matchedIds.has(card.id)) {
          element.style.display = '';
          element.classList.remove('filter-hidden');
        } else {
          element.classList.add('filter-hidden');
          setTimeout(() => {
            if (element.classList.contains('filter-hidden')) {
              element.style.display = 'none';
            }
          }, 200);
        }
      });

      if (typeof column.updateCardCount === 'function') {
        column.updateCardCount();
      }
    });

    // Dispatch filter event
    this.element.dispatchEvent(new CustomEvent('board:filter', {
      detail: {
        matches: matchedCards,
        total: this.getAllCards().length
      }
    }));
  }
} 