export class Card {
  constructor(options) {
    this.id = options.id;
    this.title = options.title;
    this.description = options.description;
    this.priority = options.priority;
    this.template = options.template;
    // User custome properties
    this.addCustomProperties(options);
    this.element = this.createCardElement();
    this.element.__cardInstance__ = this;
    this.setupDragAndDrop();
  }

  setColumn(column) {
    this.column = column;
  }

  addCustomProperties(properties) {
    delete properties.title;
    delete properties.description;
    delete properties.priority;
    delete properties.template;
    delete properties.id;
    Object.assign(this, properties);
  }

  createCardElement() {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.setAttribute('data-card-id', this.id);
    card.setAttribute('draggable', 'true');

    if (this.priority) {
      card.setAttribute('data-priority', this.priority);
    }

    if (this.template) {
      // Use template if provided
      if (this.template.header) {
        const header = document.createElement('div');
        header.className = 'kanban-card-header';
        header.innerHTML = this.template.header;
        card.appendChild(header);
      }

      if (this.template.body) {
        const body = document.createElement('div');
        body.className = 'kanban-card-body';
        body.innerHTML = this.template.body;
        card.appendChild(body);
      }

      if (this.template.footer) {
        const footer = document.createElement('div');
        footer.className = 'kanban-card-footer';
        footer.innerHTML = this.template.footer;
        card.appendChild(footer);
      }
    } else {
      // Use simple title/description format
      if (this.title) {
        const titleEl = document.createElement('div');
        titleEl.className = 'kanban-card-title';
        titleEl.textContent = this.title;
        card.appendChild(titleEl);
      }

      if (this.description) {
        const descEl = document.createElement('div');
        descEl.className = 'kanban-card-description';
        descEl.textContent = this.description;
        card.appendChild(descEl);
      }
    }

    return card;
  }

  setupDragAndDrop() {
    this.element.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      this.element.classList.add('dragging');
      e.dataTransfer.setData('text/plain', this.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    this.element.addEventListener('dragend', () => {
      this.element.classList.remove('dragging');
    });
  }
} 