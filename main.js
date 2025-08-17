// --- 1. Función para cargar el menú de quizzes ---
async function loadQuizMenu() {
    try {
        const response = await fetch('quizzes.json');
        if (!response.ok) throw new Error('No se pudo cargar quizzes.json');
        const quizzes = await response.json();
        const quizList = document.querySelector('.quiz-list');

        quizList.innerHTML = ''; // Limpiar botones anteriores

        quizzes.forEach(quiz => {
            const button = document.createElement('button');
            button.className = 'btn';
            button.setAttribute('data-quiz', quiz.id);
            button.textContent = quiz.title;
            button.addEventListener('click', () => loadQuiz(quiz.id));
            quizList.appendChild(button);
        });
    } catch (error) {
        console.error('Error al cargar el menú de quizzes:', error);
        document.querySelector('.quiz-list').innerHTML = `
            <p style="color: #d32f2f; text-align: center; padding: 20px;">
                ⚠️ Error al cargar los quizzes. Verifica que <strong>quizzes.json</strong> exista y tenga el formato correcto.
            </p>
        `;
    }
}

// --- 2. Cargar un quiz específico ---
async function loadQuiz(quizId) {
    try {
        const response = await fetch(`quizzes/${quizId}.json`);
        if (!response.ok) throw new Error(`Quiz no encontrado: ${quizId}.json`);
        const quizData = await response.json();
        const container = document.getElementById('quiz-container');
        const backButton = document.getElementById('back-button');
        const feedbackContainer = document.getElementById('feedback-container');

        // Mostrar el contenedor del quiz
        container.style.display = 'block';
        backButton.style.display = 'block';
        document.getElementById('menu-page').style.display = 'none';

        // Resetear estado
        correctCount = 0;
        answeredAll = false;
        feedbackContainer.style.display = 'none';

        // Título del quiz
        document.getElementById('quiz-title').textContent = quizData.title;

        // Generar preguntas
        const questionsContainer = document.getElementById('questions-container');
        questionsContainer.innerHTML = '';

        quizData.questions.forEach((q, index) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'question';
            qDiv.innerHTML = `
                <p class="question-number">Pregunta ${index + 1}</p>
                <p class="question-intro">${q.intro}</p>
                <p class="question-text"><strong>${q.question}</strong></p>
                <div class="options" data-correct='${JSON.stringify(q.correct)}'>
                    ${q.options.map((opt, i) => `
                        <label class="option-label">
                            <input type="checkbox" class="option" data-question="${index}" data-index="${i}">
                            ${opt}
                        </label><br>
                    `).join('')}
                </div>
                <button class="btn btn-check" onclick="checkAnswer(${index})">Verificar respuesta</button>
                <button class="btn btn-saber-mas" onclick="openModal(${index}, '${quizId}')">Saber más</button>
            `;
            questionsContainer.appendChild(qDiv);
        });

    } catch (error) {
        console.error('Error al cargar el quiz:', error);
        alert(`No se pudo cargar el quiz: ${quizId}. Verifica que el archivo exista en la carpeta /quizzes.`);
    }
}

// --- 3. Verificar respuesta ---
function checkAnswer(qIndex) {
    const question = document.querySelectorAll('.question')[qIndex];
    const options = question.querySelectorAll('.option');
    const correct = question.querySelector('.options').dataset.correct ? 
                    JSON.parse(question.querySelector('.options').dataset.correct) : [];

    let selected = [];
    options.forEach((opt, i) => {
        if (opt.checked) selected.push(i);
    });

    if (selected.length === 0) {
        alert('Selecciona al menos una opción.');
        return;
    }

    const isCorrect = selected.length === correct.length && 
                      selected.every(i => correct.includes(i)) && 
                      correct.every(i => selected.includes(i));

    if (isCorrect) {
        question.style.backgroundColor = '#d4edda';
        question.style.borderColor = '#c3e6cb';
        question.querySelector('.btn-check').textContent = '✅ Correcto';
    } else {
        question.style.backgroundColor = '#f8d7da';
        question.style.borderColor = '#f5c6cb';
        question.querySelector('.btn-check').textContent = '❌ Incorrecto';
    }

    // Deshabilitar opciones
    options.forEach(opt => opt.disabled = true);

    // Contar si todas las preguntas han sido respondidas
    const allAnswered = Array.from(document.querySelectorAll('.option:checked')).length > 0 &&
                        document.querySelectorAll('.option:checked').length === 
                        document.querySelectorAll('.question .option').length;

    if (allAnswered && !answeredAll) {
        calculateFinalScore();
        answeredAll = true;
    }
}

// --- 4. Calcular puntuación final ---
function calculateFinalScore() {
    const questions = document.querySelectorAll('.question');
    correctCount = 0;
    totalQuestions = questions.length;

    questions.forEach((q, index) => {
        const options = q.querySelectorAll('.option');
        const correct = q.querySelector('.options').dataset.correct ? 
                        JSON.parse(q.querySelector('.options').dataset.correct) : [];
        
        let selected = [];
        options.forEach((opt, i) => {
            if (opt.checked) selected.push(i);
        });

        const isCorrect = selected.length === correct.length && 
                          selected.every(i => correct.includes(i)) && 
                          correct.every(i => selected.includes(i));

        if (isCorrect) correctCount++;
    });

    showFeedback();
}

// --- 5. Mostrar retroalimentación final ---
function showFeedback() {
    const container = document.getElementById('feedback-container');
    const title = document.getElementById('feedback-title');
    const message = document.getElementById('feedback-message');
    const score = document.getElementById('feedback-score');

    const percentage = Math.round((correctCount / totalQuestions) * 100);

    if (percentage >= 80) {
        title.textContent = "🎉 ¡Excelente trabajo!";
        message.textContent = "Has dominado el tema. Sigue así.";
    } else if (percentage >= 60) {
        title.textContent = "👍 ¡Buen trabajo!";
        message.textContent = "Tienes una buena base. Repasa las que fallaste para mejorar.";
    } else {
        title.textContent = "📚 Necesitas repasar";
        message.textContent = "No te preocupes, cada error es una oportunidad para aprender. Revisa las explicaciones y vuelve a intentarlo.";
    }

    score.textContent = `Aciertos: ${correctCount} de ${totalQuestions} (${percentage}%)`;
    container.style.display = 'block';
}

// --- 6. Reiniciar el quiz ---
function restartQuiz() {
    const container = document.getElementById('quiz-container');
    const feedback = document.getElementById('feedback-container');
    const questions = document.querySelectorAll('.question');

    // Restablecer estado visual
    questions.forEach(q => {
        q.style.backgroundColor = '';
        q.style.borderColor = '';
        const options = q.querySelectorAll('.option');
        options.forEach(opt => {
            opt.checked = false;
            opt.disabled = false;
        });
        q.querySelector('.btn-check').textContent = 'Verificar respuesta';
    });

    // Ocultar retroalimentación
    feedback.style.display = 'none';

    // Resetear contadores
    correctCount = 0;
    answeredAll = false;
}

// --- 7. Modal "Saber más" ---
function openModal(qIndex) {
    const modal = document.getElementById('saberMasModal');
    const content = document.getElementById('saberMasContent');
    const question = quizData.questions[qIndex];
    content.innerHTML = `<p>${question.saber_mas}</p>`;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('saberMasModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('saberMasModal');
    if (event.target === modal) {
        closeModal();
    }
};

// --- 8. Inicialización al cargar la página ---
document.addEventListener('DOMContentLoaded', () => {
    const homeBtn = document.getElementById('home-btn');
    const backBtn = document.getElementById('back-button');

    // Cargar el menú de quizzes
    loadQuizMenu();

    // Botones de navegación
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            document.getElementById('quiz-container').style.display = 'none';
            document.getElementById('feedback-container').style.display = 'none';
            backBtn.style.display = 'none';
            document.getElementById('menu-page').style.display = 'block';
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('quiz-container').style.display = 'none';
            backBtn.style.display = 'none';
            document.getElementById('menu-page').style.display = 'block';
        });
    }
});

function showPage(pageId) {
    document.getElementById('main-page').style.display = pageId === 'main-page' ? 'block' : 'none';
    document.getElementById('menu-page').style.display = pageId === 'menu-page' ? 'block' : 'none';
}