# Kanbanize

A lightweight, framework-agnostic Kanban UI library with advanced features.

## Installation

To install the package, use npm:
```bash
npm install kanbanize
```

## Usage

```javascript
import { Board, Card } from 'kanbanize';
// Initialize a new board
const board = new Board({
    container: '#kanban-container',
    theme: 'light',
    swimlanes: [
        { id: 'swimlane-1', title: 'Swimlane 1' }
    ],
    columns: [
        { id: 'column-1', title: 'To Do' },
        { id: 'column-2', title: 'In Progress' }
    ],
    search: {
        enabled: true,
        placeholder: 'Search cards...'
    },
    filter: {
        enabled: true,
        filters: [
            { id: 'priority-high', label: 'High Priority', field: 'priority', operator: 'equals', value: 'high' }
        ]
    }
});

// Add a card to a column
const card = new Card({
    id: 'card-1',
    title: 'Sample Card',
    description: 'This is a sample card.',
    priority: 'high'
});
board.addCardToColumn(0, card);

```

## Classes and Properties

### Board

The `Board` class represents the Kanban board.

**Constructor Options:**

- `container`: (string | HTMLElement) The container element or selector for the board.
- `theme`: (string) The theme of the board, either 'light' or 'dark'.
- `swimlanes`: (Array) An array of swimlane configurations.
- `columns`: (Array) An array of column configurations.
- `search`: (Object) Configuration for search functionality.
- `filter`: (Object) Configuration for filter functionality.

**Methods:**

- `addCardToColumn(columnIndex, card)`: Adds a card to a specified column.
- `initializeSearch()`: Initializes the search functionality.
- `initializeFilters()`: Initializes the filter functionality.

## Swimlane

The `Swimlane` class represents a swimlane in the Kanban board.

**Options:**

- `id`: (string) The unique identifier for the swimlane.
- `title`: (string) The title of the swimlane.


## Column

The `Column` class represents a column in the Kanban board.

**Constructor Options:**

- `id`: (string) The unique identifier for the column.
- `title`: (string) The title of the column.
- `wipLimit`: (number) The work-in-progress limit for the column.
- `collapsible`: (boolean) Whether the column is collapsible.

**Methods:**

- `addCard(card)`: Adds a card to the column.
- `removeCard(cardId)`: Removes a card from the column.
- `toggleCollapse()`: Toggles the collapsed state of the column.

## Search

The `Search` class represents the search functionality of the Kanban board.

**Options:**

- `enabled`: (boolean) Whether the search functionality is enabled.
- `placeholder`: (string) The placeholder text for the search input.
- `position`: (string) The position of the search input, either 'top-right' or 'bottom-right'.
- `customSearch`: (function) A custom search function.
- `fields`: (array) The fields to search.
- `debounceTime`: (number) The debounce time for the search.

# fields

The `fields` option is an array of fields to search. The default fields are `title`, `description`, and `tags`.

## Filter

The `Filter` class represents the filter functionality of the Kanban board.

**Options:**

- `enabled`: (boolean) Whether the filter functionality is enabled.
- `filters`: (array) The filters to apply.
- `position`: (string) The position of the filter, either 'top-right' or 'bottom-right'.
- `fields`: (array) The fields to filter.

# filters

The `filters` option is an array of filters. 
- `icon`: (string) The icon to display in the filter.
- `label`: (string) The label to display in the filter.
- `field`: (string) The field to filter.
- `operator`: (string) The operator to filter. equals, contains, in, startsWith, endsWith, isNotEmpty, custom
- `value`: (string) The value to filter. (for non custom filters)
- `fn`: (function) A custom filter function. (for custom filters)

### Card

The `Card` class represents a card in the Kanban board.

**Constructor Options:**

- `id`: (string) The unique identifier for the card.
- `title`: (string) The title of the card.
- `description`: (string) The description of the card.
- `priority`: (string) The priority of the card.
- `template`: (Object) Custom HTML templates for the card's header, body, and footer.

**Methods:**

- `setColumn(column)`: Sets the column for the card.

## template

The `template` option is an object that contains custom HTML templates for the card's header, body, and footer.

- `header`: (string) The HTML template for the card's header.
- `body`: (string) The HTML template for the card's body.
- `footer`: (string) The HTML template for the card's footer.

## Features

- Drag and drop functionality
- Swimlanes support
- WIP limits
- Search and filtering
- Dark mode support
- Customizable templates

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.