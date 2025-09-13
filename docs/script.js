function renderCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    calendar.innerHTML += '<div></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const isoDate = date.toISOString().split('T')[0];

    const dayDiv = document.createElement('div');
    dayDiv.dataset.date = isoDate;

    // Основной текст дня (число)
    const dayNumber = document.createElement('div');
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);

    // Текст заметки
    const noteTextarea = document.createElement('textarea');
    noteTextarea.placeholder = "Введите заметку...";
    noteTextarea.style.width = "100%";
    noteTextarea.style.height = "50px";
    noteTextarea.style.marginTop = "5px";
    noteTextarea.style.fontSize = "12px";

    // Загрузка текста из Firestore
    db.collection('contentPlanner').doc(isoDate).get().then(doc => {
      if (doc.exists && doc.data().note) {
        noteTextarea.value = doc.data().note;
      }
      if (doc.exists && doc.data().temaColor) {
        dayDiv.style.backgroundColor = colorMap[doc.data().temaColor] || '';
      }
    });

    // Автосохранение при вводе
    noteTextarea.addEventListener('input', () => {
      db.collection('contentPlanner').doc(isoDate).set({
        note: noteTextarea.value
      }, { merge: true });
    });

    dayDiv.appendChild(noteTextarea);

    // Клик по дню открывает меню действий
    dayNumber.addEventListener('click', () => openMenu(isoDate));

    calendar.appendChild(dayDiv);
  }
}
