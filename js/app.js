// app.js
// Sistema de carga dinámica para SuperQuiz
// Versión simple y escalable para uso en GitHub Pages

// Variables globales
let currentArea = 'contabilidad';
let currentQuizId = '';
let currentQuestionIndex = 0;
let selectedOptions = [];
let score = 0;
let quizData = null;
let totalQuestions = 0;

// Función para mostrar una página específica
function showPage(pageId, area = 'contabilidad') {
    if (pageId === 'menu-page') {
        currentArea = area;
        document.getElementById('area-title').textContent = 
            area === 'contabilidad' ? 'Contabilidad' :
            area === 'analisis-economico-financiero' ? 'Análisis Económico-Financiero' :
            area === 'economia' ? 'Economía' : 'Marketing';
        
        loadAreaThemes();
    }
    
    // Ocultar todas las páginas
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Mostrar la página solicitada
    document.getElementById(pageId).classList.add('active');
}

// Carga los temas de un área
function loadAreaThemes() {
    const quizList = document.getElementById('quiz-list');
    quizList.innerHTML = '';
    
    // Primero intentamos cargar desde un index.json
    fetch(`content/${currentArea}/index.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('No existe index.json');
            }
            return response.json();
        })
        .then(data => {
            // Si existe index.json, lo usamos
            for (const [id, quiz] of Object.entries(data)) {
                const btn = document.createElement('button');
                btn.className = 'btn';
                btn.textContent = quiz.title;
                btn.onclick = () => loadQuiz(id);
                quizList.appendChild(btn);
            }
        })
        .catch(error => {
            // Si no existe index.json, buscamos los archivos JSON directamente
            const themeFiles = [
                'contabilidad-basica.json',
                'inversion-no-corriente.json',
                'analisis-financiero.json',
                'ratios-empresa.json',
                'macroeconomia.json',
                'microeconomia.json',
                'marketing-digital.json',
                'segmentacion-mercado.json'
            ];
            
            const validThemes = [];
            
            // Verificamos qué temas existen
            const checkThemes = themeFiles.map(file => 
                fetch(`content/${currentArea}/${file}`)
                    .then(res => {
                        if (res.ok) {
                            validThemes.push({
                                id: file.replace('.json', ''),
                                file: file
                            });
                        }
                    })
                    .catch(() => {})
            );
            
            Promise.all(checkThemes).then(() => {
                // Cargamos los títulos de los temas que existen
                const loadTitles = validThemes.map(theme => 
                    fetch(`content/${currentArea}/${theme.file}`)
                        .then(res => res.json())
                        .then(data => ({ 
                            id: theme.id, 
                            title: data.title 
                        }))
                        .catch(() => null)
                );
                
                Promise.all(loadTitles)
                    .then(themes => {
                        themes.filter(theme => theme).forEach(theme => {
                            const btn = document.createElement('button');
                            btn.className = 'btn';
                            btn.textContent = theme.title;
                            btn.onclick = () => loadQuiz(theme.id);
                            quizList.appendChild(btn);
                        });
                        
                        // Si no hay temas, mostramos mensaje
                        if (themes.filter(theme => theme).length === 0) {
                            const message = document.createElement('p');
                            message.textContent = 'No hay temas disponibles para esta área.';
                            message.style.padding = '20px';
                            message.style.color = '#666';
                            quizList.appendChild(message);
                        }
                    });
            });
        });
}

// Carga un quiz específico desde JSON
function loadQuiz(quizId) {
    currentQuizId = quizId;
    
    fetch(`/docs/content/${currentArea}/${quizId}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Quiz no encontrado');
            }
            return response.json();
        })
        .then(data => {
            quizData = data;
            totalQuestions = quizData.questions.length;
            document.getElementById('total-questions').textContent = totalQuestions;
            currentQuestionIndex = 0;
            score = 0;
            selectedOptions = [];
            
            // Actualizar título
            document.getElementById('quiz-title').textContent = quizData.title;
            
            // Cargar la primera pregunta
            loadQuestion();
            showPage('quiz-page');
        })
        .catch(error => {
            console.error('Error loading quiz:', error);
            alert('Error al cargar el tema. Por favor, inténtalo de nuevo.');
        });
}

// Carga una pregunta específica
function loadQuestion() {
    const question = quizData.questions[currentQuestionIndex];
    const content = document.getElementById('quiz-content');
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    
    content.innerHTML = `
        <div class="question">
            ${question.intro ? `<div class="question-intro"><p>${question.intro}</p></div>` : ''}
            <div class="question-text">${question.question}</div>
            <div class="options" id="options-${currentQuestionIndex}">
                ${question.options.map((opt, i) => `
                    <div class="option" onclick="toggleSelect(this, ${i})">${opt}</div>
                `).join('')}
            </div>
            <div class="feedback" id="feedback-${currentQuestionIndex}" style="display:none;"></div>
            <div class="question-actions">
                <button class="btn-validate" id="validate-btn">Validar respuesta</button>
                <button class="btn-saber-mas" onclick="openModal()">Saber más</button>
            </div>
        </div>
    `;
    
    // Añadir evento al botón de validación
    document.getElementById('validate-btn').addEventListener('click', validateAnswer);
}

// Permite seleccionar opciones
function toggleSelect(element, optionIndex) {
    const options = document.querySelectorAll(`#options-${currentQuestionIndex} .option`);
    
    // Si es pregunta de única respuesta, deseleccionar otras
    if (quizData.questions[currentQuestionIndex].correct.length === 1) {
        options.forEach(opt => opt.classList.remove('selected'));
        element.classList.add('selected');
        selectedOptions = [optionIndex];
    } 
    // Si es pregunta de múltiple respuesta
    else {
        if (element.classList.contains('selected')) {
            element.classList.remove('selected');
            selectedOptions = selectedOptions.filter(i => i !== optionIndex);
        } else {
            element.classList.add('selected');
            selectedOptions.push(optionIndex);
        }
    }
}

// Valida la respuesta
function validateAnswer() {
    const question = quizData.questions[currentQuestionIndex];
    const feedback = document.getElementById(`feedback-${currentQuestionIndex}`);
    const validateBtn = document.getElementById('validate-btn');
    const options = document.querySelectorAll(`#options-${currentQuestionIndex} .option`);
    
    // Deshabilitar botón
    validateBtn.disabled = true;
    
    // Verificar respuestas
    const isCorrect = selectedOptions.length === question.correct.length && 
                    selectedOptions.every(val => question.correct.includes(val));
    
    // Mostrar feedback
    if (isCorrect) {
        feedback.className = 'feedback correct';
        feedback.innerHTML = '¡Correcto! La respuesta es correcta.';
        score++;
    } else {
        feedback.className = 'feedback incorrect';
        feedback.innerHTML = 'Incorrecto. Revisa las opciones seleccionadas.';
    }
    
    feedback.style.display = 'block';
    
    // Resaltar respuestas correctas e incorrectas
    options.forEach((opt, i) => {
        if (question.correct.includes(i)) {
            opt.classList.add('correct');
        }
        if (selectedOptions.includes(i) && !question.correct.includes(i)) {
            opt.classList.add('incorrect');
        }
        opt.style.pointerEvents = 'none';
    });
    
    // Cambiar botón a "Siguiente"
    setTimeout(() => {
        validateBtn.textContent = 'Siguiente pregunta';
        validateBtn.onclick = nextQuestion;
        validateBtn.disabled = false;
    }, 1500);
}

// Muestra la siguiente pregunta
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < totalQuestions) {
        loadQuestion();
    } else {
        showResults();
    }
}

// Muestra los resultados
function showResults() {
    document.getElementById('final-score').textContent = `${score}/${totalQuestions}`;
    
    // Mensaje según puntuación
    const resultMessage = document.getElementById('result-message');
    const percentage = (score / totalQuestions) * 100;
    
    if (percentage === 100) {
        resultMessage.textContent = '¡Excelente! Has respondido todas las preguntas correctamente.';
    } else if (percentage >= 75) {
        resultMessage.textContent = '¡Buen trabajo! Tienes un buen conocimiento del tema.';
    } else if (percentage >= 50) {
        resultMessage.textContent = 'Buen esfuerzo. Revisa las preguntas que has fallado para mejorar.';
    } else {
        resultMessage.textContent = 'Necesitas repasar más el tema. ¡No te rindas!';
    }
    
    showPage('results-page');
}

// Abre el modal de "Saber más"
function openModal() {
    const question = quizData.questions[currentQuestionIndex];
    const modal = document.getElementById('saberMasModal');
    const modalContent = document.getElementById('modal-content');
    
    modalContent.innerHTML = question.saber_mas;
    modal.style.display = 'flex';
}

// Cierra el modal
function closeModal() {
    document.getElementById('saberMasModal').style.display = 'none';
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Configurar evento para cerrar el modal al hacer clic fuera
    window.onclick = function(event) {
        const modal = document.getElementById('saberMasModal');
        if (event.target === modal) closeModal();
    };
    
    // Configurar botón de cierre del modal
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    
    // Si hay un hash en la URL, cargar esa área directamente
    if (window.location.hash) {
        const area = window.location.hash.substring(1);
        if (['contabilidad', 'analisis-economico-financiero', 'economia', 'marketing'].includes(area)) {
            showPage('menu-page', area);
        }
    }
});
