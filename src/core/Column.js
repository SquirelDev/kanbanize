export class Column {
  constructor(options) {
    this.id = options.id;
    this.title = options.title;
    this.wipLimit = options.wipLimit || null;
    this.cards = [];
    this.isCollapsed = false;
    
    // Add custom handlers
    this.onCardDragStart = options.onCardDragStart || null;
    this.onCardDragEnd = options.onCardDragEnd || null;
    this.onAddCard = options.onAddCard || null; // Add new card handler
    
    this.element = this.createColumnElement();
    
    if (options.collapsible) {
      this.addCollapseButton();
    }
    this.element.__column__ = this;
    this.setupDragAndDrop();
    this.setupAddCardButton(); // Add this new setup
  }

  createColumnElement() {
    const column = document.createElement('div');
    column.className = 'kanban-column';
    column.setAttribute('data-column-id', this.id);

    const header = document.createElement('div');
    header.className = 'kanban-column-header';
    
    const title = document.createElement('h3');
    title.className = 'kanban-column-title';
    title.textContent = this.title;
    
    const cardCount = document.createElement('span');
    cardCount.className = 'kanban-column-card-count';
    cardCount.textContent = '0';

    if (this.wipLimit) {
      cardCount.textContent = `0/${this.wipLimit}`;
    }

    header.appendChild(title);
    header.appendChild(cardCount);
    
    const cardContainer = document.createElement('div');
    cardContainer.className = 'kanban-column-cards';

    // Create add card button container
    const addCardContainer = document.createElement('div');
    addCardContainer.className = 'kanban-add-card-container';

    column.appendChild(header);
    column.appendChild(cardContainer);
    column.appendChild(addCardContainer);

    return column;
  }

  setupAddCardButton() {
    const container = this.element.querySelector('.kanban-add-card-container');
    if (!container) return;

    const addButton = document.createElement('button');
    addButton.className = 'kanban-add-card-button';
    addButton.innerHTML = `
      <span class="add-card-icon">+</span>
      <span class="add-card-text">Add Card</span>
    `;

    addButton.addEventListener('click', () => {
      if (this.wipLimit && this.cards.length >= this.wipLimit) {
        alert(`Cannot add more cards. WIP limit (${this.wipLimit}) reached.`);
        return;
      }
      this.showAddCardModal();
    });

    container.appendChild(addButton);
  }

  showAddCardModal() {
    const modal = document.createElement('div');
    modal.className = 'k-modal-overlay';
    modal.innerHTML = `
      <div class="k-modal">
        <div class="k-modal-header">
          <h3 class="k-modal-title">Add New Card</h3>
        </div>
        <div class="k-modal-body">
          <form id="addCardForm">
            <input type="text" class="k-input" name="title" placeholder="Card Title" required>
            <textarea class="k-input" name="description" placeholder="Card Description" rows="3"></textarea>
          </form>
        </div>
        <div class="k-modal-footer">
          <button type="button" class="k-button k-button-light" id="cancelBtn">Cancel</button>
          <button type="submit" form="addCardForm" class="k-button k-button-primary">Add Card</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    const form = modal.querySelector('form');
    const titleInput = form.querySelector('input[name="title"]');
    const cancelBtn = modal.querySelector('#cancelBtn');
    const modalContent = modal.querySelector('.k-modal');

    requestAnimationFrame(() => {
      modal.classList.add('active');
      modalContent.classList.add('active');
      titleInput.focus();
    });

    const closeModal = () => {
      modal.classList.remove('active');
      modalContent.classList.remove('active');
      setTimeout(() => modal.remove(), 200);
    };

    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const cardData = {
        title: formData.get('title'),
        description: formData.get('description'),
        columnId: this.id
      };

      try {
        let newCard;
        if (this.onAddCard) {
          // Use custom handler if provided
          newCard = await this.onAddCard(cardData, this);
        } else {
          // Default card creation
          newCard = {
            id: 'card-' + Date.now(),
            ...cardData
          };

          if (newCard) {
            // Add the new card to the column
            const card = new Column.Card(newCard);
            this.addCard(card);
          }
        }
        closeModal();
      } catch (error) {
        console.error('Error adding new card:', error);
        alert('Failed to add card. Please try again.');
      }
    });
  }

  async addCollapseButton() {
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'kanban-column-collapse-btn';
    collapseBtn.setAttribute('aria-label', 'Toggle column');
    
    try {
      // Load initial chevron-down icon
      const response = await fetch('src/assets/icons/chevron-up.svg');
      const svgText = await response.text();
      // Parse SVG string to DOM element
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      collapseBtn.appendChild(svgElement);
    } catch (error) {
      console.error('Error loading collapse icon:', error);
    }

    collapseBtn.addEventListener('click', () => this.toggleCollapse());
    
    const header = this.element.querySelector('.kanban-column-header');
    if (header) {
      header.appendChild(collapseBtn);
    }
  }

  async toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.element.classList.toggle('collapsed', this.isCollapsed);
    
    const btn = this.element.querySelector('.kanban-column-collapse-btn');
    if (btn) {
      try {
        // Load appropriate icon based on state
        const iconFile = this.isCollapsed ? 'chevron-down.svg' : 'chevron-up.svg';
        const response = await fetch(`src/assets/icons/${iconFile}`);
        console.log(iconFile);
        const svgText = await response.text();
        // Parse SVG string to DOM element
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        
        // Clear existing content and append new SVG
        btn.innerHTML = '';
        btn.appendChild(svgElement);
      } catch (error) {
        console.error('Error loading toggle icon:', error);
      }
      
      btn.setAttribute('aria-expanded', !this.isCollapsed);
    }
  }

  addCard(card) {
    if (this.wipLimit && this.cards.length >= this.wipLimit) {
      console.warn(`WIP limit (${this.wipLimit}) reached for column ${this.title}`);
      return false;
    }
    
    const cardContainer = this.element.querySelector('.kanban-column-cards');
    if (!cardContainer) {
      console.error('Card container not found');
      return false;
    }

    try {
      // Store card instance in DOM element
      card.element.__cardInstance__ = card;
      card.setColumn(this);
      // Add to array and DOM
      this.cards.push(card);
      cardContainer.appendChild(card.element);
      this.forceRecount();
      return true;
    } catch (error) {
      console.error('Error adding card:', error);
      // Clean up if there was an error
      const index = this.cards.indexOf(card);
      if (index !== -1) {
        this.cards.splice(index, 1);
      }
      if (card.element.parentNode === cardContainer) {
        card.element.remove();
      }
      this.forceRecount();
      return false;
    }
  }

  updateCardCount() {
    const countElement = this.element.querySelector('.kanban-column-card-count');
    if (!countElement) return;

    // Get actual count from DOM to ensure accuracy
    const actualCount = this.element.querySelectorAll('.kanban-card').length;
    
    // Sync the cards array with actual DOM count
    if (actualCount !== this.cards.length) {
      console.warn(`Card count mismatch in column "${this.title}". Syncing...`);
      // Rebuild cards array from DOM
      const cardElements = this.element.querySelectorAll('.kanban-card');
      this.cards = Array.from(cardElements).map(el => el.__cardInstance__).filter(Boolean);
    }

    // Update the display
    if (this.wipLimit) {
      countElement.textContent = `${this.cards.length}/${this.wipLimit}`;
      
      // Update visual indicators
      countElement.classList.remove('at-limit', 'near-limit');
      if (this.cards.length >= this.wipLimit) {
        countElement.classList.add('at-limit');
      } else if (this.cards.length >= this.wipLimit * 0.8) {
        countElement.classList.add('near-limit');
      }
    } else {
      countElement.textContent = this.cards.length;
    }
  }

  setupDragAndDrop() {
    const cardContainer = this.element.querySelector('.kanban-column-cards');

    // Handle drag start
    cardContainer.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.kanban-card');
      if (!card) return;
      
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.getAttribute('data-card-id'));
      e.dataTransfer.effectAllowed = 'move';

      // Call custom drag start handler if provided
      if (this.onCardDragStart) {
        const cardInstance = card.__cardInstance__;
        this.onCardDragStart({
          card: cardInstance,
          column: this,
          event: e,
          element: card
        });
      }
    });

    // Handle drag end
    cardContainer.addEventListener('dragend', (e) => {
      const card = e.target.closest('.kanban-card');
      if (!card) return;
      
      card.classList.remove('dragging');

      const cardE = card.__cardInstance__;
      const sourceColumn = cardE.column;
      
      if (sourceColumn && sourceColumn !== this) {
        sourceColumn.removeCard(cardE.id);
        this.addCard(cardE);
        sourceColumn.forceRecount();
        this.forceRecount();
        cardE.setColumn(this);

        // Call custom drag end handler if provided
        if (this.onCardDragEnd) {
          this.onCardDragEnd({
            card: cardE,
            sourceColumn: sourceColumn,
            targetColumn: this,
            event: e,
            element: card
          });
        }
      }

      document.querySelectorAll('.kanban-column-cards').forEach(container => {
        container.classList.remove('drag-over');
      });
    });

    // Handle drag over
    cardContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const draggingCard = document.querySelector('.dragging');
      if (!draggingCard) return;
        
      // Check WIP limit before showing drop indicator
      if (this.wipLimit && this.cards.length >= this.wipLimit) {
        cardContainer.classList.remove('drag-over');
        return;
      }

      cardContainer.classList.add('drag-over');
      const afterElement = this.getDragAfterElement(cardContainer, e.clientY);
      
      if (afterElement) {
        cardContainer.insertBefore(draggingCard, afterElement);
      } else {
        cardContainer.appendChild(draggingCard);
      }
      this.forceRecount();
    });

    // Handle drag leave
    cardContainer.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!e.currentTarget.contains(e.relatedTarget)) {
        cardContainer.classList.remove('drag-over');
      }
    });

    // Handle drop
    cardContainer.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      cardContainer.classList.remove('drag-over');
      const cardId = e.dataTransfer.getData('text/plain');
      const draggingCard = document.querySelector(`[data-card-id="${cardId}"]`);
      
      if (!draggingCard) return;

      try {
        const sourceColumn = this.findColumnByCard(draggingCard);
        if (!sourceColumn || sourceColumn === this) return;

        const cardInstance = sourceColumn.findCardInstance(draggingCard);
        if (!cardInstance) return;

        // Check WIP limit
        const currentCount = this.element.querySelectorAll('.kanban-card').length;
        if (this.wipLimit && currentCount >= this.wipLimit) {
          const message = `Cannot move card to "${this.title}". WIP limit of ${this.wipLimit} reached.`;
          alert(message);
          
          // Revert the card position
          if (sourceColumn) {
            sourceColumn.renderCards();
          }
          return;
        }

        // Remove from source column's array first
        sourceColumn.cards = sourceColumn.cards.filter(card => card.id !== cardId);
        
        // Add to target column's array
        const afterElement = this.getDragAfterElement(cardContainer, e.clientY);
        const targetIndex = afterElement 
          ? Array.from(cardContainer.children).indexOf(afterElement)
          : this.cards.length;
        
        this.cards.splice(targetIndex, 0, cardInstance);

        // Update DOM
        if (afterElement) {
          cardContainer.insertBefore(draggingCard, afterElement);
        } else {
          cardContainer.appendChild(draggingCard);
        }

        // Force a recount on both columns
        await Promise.resolve(); // Wait for DOM updates
        this.forceRecount();
        sourceColumn.forceRecount();

      } catch (error) {
        console.error('Error during drop:', error);
        // Revert any changes if there was an error
        this.renderCards();
        sourceColumn?.renderCards();
      }
    });
  }

  // Helper method to find the element to insert before
  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Helper method to safely find a card instance
  findCardInstance(cardElement) {
    if (!cardElement) return null;
    const cardId = cardElement.getAttribute('data-card-id');
    return this.cards.find(card => card.id === cardId);
  }

  // Helper method to find the column containing a card
  findColumnByCard(cardElement) {
    if (!cardElement) return null;
    const columnElement = cardElement.closest('.kanban-column');
    return columnElement?.__column__;
  }

  // Update render method to be more robust
  renderCards() {
    const cardContainer = this.element.querySelector('.kanban-column-cards');
    if (!cardContainer) return;
    
    // Store scroll position
    const scrollTop = cardContainer.scrollTop;
    
    // Clear and rebuild
    cardContainer.innerHTML = '';
    this.cards.forEach(card => {
      if (card && card.element) {
        cardContainer.appendChild(card.element);
      }
    });
    
    // Restore scroll position
    cardContainer.scrollTop = scrollTop;
  }

  removeCard(cardId) {
    const index = this.cards.findIndex(card => card.id === cardId);
    if (index !== -1) {
      const card = this.cards[index];
      if (card.element && card.element.parentNode) {
        card.element.remove();
      }
      this.cards.splice(index, 1);
      this.forceRecount();
    }
  }

  // Add new method for forced recounting
  forceRecount() {
    // Get actual count from DOM
    const cardContainer = this.element.querySelector('.kanban-column-cards');
    const countElement = this.element.querySelector('.kanban-column-card-count');
    
    if (!cardContainer || !countElement) return;

    // Count cards in DOM
    const domCards = cardContainer.querySelectorAll('.kanban-card');
    const domCount = domCards.length;

    // Rebuild cards array from DOM
    this.cards = Array.from(domCards)
      .map(el => {
        const cardId = el.getAttribute('data-card-id');
        const cardInstance = el.__cardInstance__ || this.findCardInstance(el);
        if (cardInstance) {
          el.__cardInstance__ = cardInstance; // Ensure reference is stored
          return cardInstance;
        }
        return null;
      })
      .filter(Boolean);

    // Update the display
    if (this.wipLimit) {
      countElement.textContent = `${this.cards.length}/${this.wipLimit}`;
      
      // Update visual indicators
      countElement.classList.remove('at-limit', 'near-limit');
      if (this.cards.length >= this.wipLimit) {
        countElement.classList.add('at-limit');
      } else if (this.cards.length >= this.wipLimit * 0.8) {
        countElement.classList.add('near-limit');
      }
    } else {
      countElement.textContent = this.cards.length;
    }

    // Log any mismatches for debugging
    if (this.cards.length !== domCount) {
      console.warn(`Count mismatch in column "${this.title}": Array: ${this.cards.length}, DOM: ${domCount}`);
    }
  }
} 