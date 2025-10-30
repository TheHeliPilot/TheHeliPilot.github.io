import { state } from './state.js';
import { showNotification } from './ui.js';

export function saveFlashcards() {
    if (state.currentUser) {
        localStorage.setItem(`flashcards_${state.currentUser.uid}`, JSON.stringify(state.flashcards));
    }
}

export function displayFlashcards(searchTerm = '', filters = {}) {
    const cardsList = document.getElementById('cardsList');
    const filteredCards = state.flashcards.filter(card => {
        if (searchTerm && !card.question.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        if (filters.notStudied && card.difficulty !== undefined) return false;
        if (filters.hard && card.difficulty !== 'hard') return false;
        if (filters.medium && card.difficulty !== 'medium') return false;
        if (filters.easy && card.difficulty !== 'easy') return false;
        if (filters.mastered && card.difficulty !== 'mastered') return false;

        return true;
    });

    cardsList.innerHTML = filteredCards.map((card, index) => `
        <div class="card-item">
            <h4>
                Question ${index + 1}
                ${card.difficulty ? `<span class="difficulty-badge difficulty-${card.difficulty}">${card.difficulty}</span>` : ''}
            </h4>
            <p>${card.question}</p>
            <div class="card-actions">
                <button onclick="editCard(${index})" class="btn-secondary">Edit</button>
                <button onclick="deleteCard(${index})" class="btn-danger">Delete</button>
            </div>
        </div>
    `).join('');

    document.getElementById('cardCount').textContent = filteredCards.length;
}

export function editCard(index) {
    state.editingCardIndex = index;
    const card = state.flashcards[index];

    document.getElementById('modalTitle').textContent = 'Edit Card';
    document.getElementById('modalQuestion').value = card.question;

    card.options.forEach((option, i) => {
        document.getElementById(`option${i}`).value = option;
    });

    document.querySelector(`input[name="correctAnswer"][value="${card.correctIndex}"]`).checked = true;
    document.getElementById('modalExplanation').value = card.explanation || '';

    document.getElementById('cardModal').classList.remove('hidden');
}

export function deleteCard(index) {
    window.showConfirm(
        'Are you sure you want to delete this card?',
        () => {
            state.flashcards.splice(index, 1);
            saveFlashcards();
            displayFlashcards();
            showNotification('Card deleted successfully');
        },
        {
            title: 'Delete Card',
            confirmText: 'Delete',
            confirmIcon: 'fa-trash',
            confirmClass: 'btn-danger'
        }
    );
}

export function importCards(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                state.flashcards = [...state.flashcards, ...imported];
                saveFlashcards();
                displayFlashcards();
                showNotification('Cards imported successfully');
            } catch (error) {
                showNotification('Error importing cards', 'error');
            }
        };
        reader.readAsText(file);
    }
}

export function exportCards() {
    const dataStr = JSON.stringify(state.flashcards, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', 'flashcards.json');
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);

    showNotification('Cards exported successfully');
}
