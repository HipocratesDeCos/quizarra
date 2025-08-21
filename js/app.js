// app.js
let currentArea = 'contabilidad';
let quizData = {};

// Carga dinámica de contenido
async function loadArea(area) {
  currentArea = area;
  try {
    const response = await fetch(`content/${area}/index.json`);
    if (response.ok) {
      quizData = await response.json();
      loadAreaThemes();
    } else {
      // Si no existe index.json, cargamos los temas directamente
      loadAreaThemes();
    }
  } catch (error) {
    console.log(`No se encontró index.json para ${area}, cargando temas directamente`);
    loadAreaThemes();
  }
}

function loadAreaThemes() {
  const quizList = document.getElementById('quiz-list');
  quizList.innerHTML = '';
  
  // Si ya tenemos quizData cargado desde index.json
  if (Object.keys(quizData).length > 0) {
    for (const [id, quiz] of Object.entries(quizData)) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = quiz.title;
      btn.onclick = () => loadQuiz(id);
      quizList.appendChild(btn);
    }
    return;
  }
  
  // Si no, buscamos los archivos JSON directamente
  const areaFolder = `content/${currentArea}/`;
  const themeFiles = [
    'contabilidad-basica.json',
    'inversion-no-corriente.json'
    // Aquí se añadirían más temas cuando existan
  ];
  
  // Obtenemos los títulos de los temas
  const themePromises = themeFiles.map(file => 
    fetch(`${areaFolder}${file}`)
      .then(res => res.json())
      .then(data => ({ id: file.replace('.json', ''), title: data.title }))
      .catch(() => null)
  );
  
  Promise.all(themePromises)
    .then(themes => {
      themes.filter(theme => theme).forEach(theme => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = theme.title;
        btn.onclick = () => loadQuiz(theme.id);
        quizList.appendChild(btn);
      });
    });
}

function loadQuiz(quizId) {
  fetch(`content/${currentArea}/${quizId}.json`)
    .then(response => response.json())
    .then(quiz => {
      document.getElementById('quiz-title').textContent = quiz.title;
      const content = document.getElementById('quiz-content');
      content.innerHTML = '';
      
      quiz.questions.forEach((q, index) => {
        content.innerHTML += `
          <div class="question">
            ${q.intro ? `<div class="question-intro"><p>${q.intro}</p></div>` : ''}
            <div class="question-text">${q.question}</div>
            <div class="options" id="options-${index}">
              ${q.options.map((opt, i) => `
                <div class="option" onclick="toggleSelect(this, ${index}, ${i})">${opt}</div>
              `).join('')}
            </div>
            <div class="feedback" id="feedback-${index}" style="display:none;"></div>
            <div class="question-actions">
              <button class="btn btn-validate" onclick="validateAnswer(${index}, ${JSON.stringify(q.correct)})">Validar respuesta</button>
              <button class="btn-saber-mas" onclick="openModal(${index}, '${quizId}')">Saber más</button>
            </div>
          </div>
        `;
      });
      showPage('quiz-page');
    })
    .catch(error => {
      console.error('Error loading quiz:', error);
      alert('Error al cargar el tema. Por favor, inténtalo de nuevo.');
    });
}

// Modificar la función showPage para manejar áreas
function showPage(pageId, area = 'contabilidad') {
  if (pageId === 'menu-page') {
    loadArea(area);
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}
