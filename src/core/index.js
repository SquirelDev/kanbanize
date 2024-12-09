import { Board } from './Board.js';
import { Card } from './Card.js';
import { Column } from './Column.js';
window.Kanban = {
    Board,
    Card,
    Column
}
Column.Card = Card
export { Board, Card, Column };