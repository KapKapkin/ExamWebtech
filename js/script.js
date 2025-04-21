document.addEventListener('DOMContentLoaded', function() {
    // Инициализация API
    const api = new ExamAPI('b956c9fb-854c-4c30-b6bc-98f8ac8f9c3a');
    
    // Элементы страницы
    const notificationArea = document.getElementById('notification-area');
    const coursesList = document.getElementById('courses-list');
    const coursesPagination = document.getElementById('courses-pagination');
    const tutorsList = document.getElementById('tutors-list');
    const tutorsPagination = document.getElementById('tutors-pagination');
    const courseModal = new bootstrap.Modal(document.getElementById('courseModal'));
    const tutorModal = new bootstrap.Modal(document.getElementById('tutorModal'));
    
    // Текущие данные
    let currentCourses = [];
    let currentTutors = [];
    let currentCoursePage = 1;
    let currentTutorPage = 1;
    const coursesPerPage = 3;
    const tutorsPerPage = 3;
    
    // Загрузка курсов
    function loadCourses() {
        api.getCourses()
            .then(courses => {
                currentCourses = courses;
                displayCourses(currentCoursePage);
            })
            .catch(error => showError(error.message));
    }
    
    // Отображение курсов с пагинацией
    function displayCourses(page) {
        currentCoursePage = page;
        const start = (page - 1) * coursesPerPage;
        const end = start + coursesPerPage;
        const paginatedCourses = currentCourses.slice(start, end);
        
        coursesList.innerHTML = '';
        paginatedCourses.forEach(course => {
            const courseCard = createCourseCard(course);
            coursesList.appendChild(courseCard);
        });
        
        renderPagination(coursesPagination, currentCourses.length, coursesPerPage, page, displayCourses);
    }
    
    // Создание карточки курса
    function createCourseCard(course) {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        
        const card = document.createElement('div');
        card.className = 'card h-100';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = course.name;
        
        const level = document.createElement('span');
        level.className = 'badge bg-info text-dark mb-2';
        level.textContent = course.level;
        
        const teacher = document.createElement('p');
        teacher.className = 'card-text text-muted small';
        teacher.textContent = `Преподаватель: ${course.teacher}`;
        
        const duration = document.createElement('p');
        duration.className = 'card-text';
        duration.textContent = `Продолжительность: ${course.total_length} недель, ${course.week_length} часов/неделю`;
        
        const price = document.createElement('p');
        price.className = 'card-text fw-bold';
        price.textContent = `Стоимость: ${course.course_fee_per_hour} руб./час`;
        
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary mt-2';
        btn.textContent = 'Подать заявку';
        btn.addEventListener('click', () => openCourseModal(course));
        
        cardBody.appendChild(title);
        cardBody.appendChild(level);
        cardBody.appendChild(teacher);
        cardBody.appendChild(duration);
        cardBody.appendChild(price);
        cardBody.appendChild(btn);
        card.appendChild(cardBody);
        col.appendChild(card);
        
        return col;
    }
    
    // Открытие модального окна курса
    function openCourseModal(course) {
        document.getElementById('courseModalTitle').textContent = `Заявка на курс: ${course.name}`;
        document.getElementById('course-id').value = course.id;
        document.getElementById('course-name').value = course.name;
        document.getElementById('course-teacher').value = course.teacher;
        document.getElementById('course-duration').value = `${course.total_length} недель`;
        
        // Расчет даты окончания
        const startDateSelect = document.getElementById('course-start-date');
        startDateSelect.innerHTML = '<option value="">Выберите дату</option>';
        
        // Собираем уникальные даты
        const uniqueDates = new Set();
        course.start_dates.forEach(dateStr => {
            const date = new Date(dateStr);
            uniqueDates.add(date.toISOString().split('T')[0]);
        });
        
        // Добавляем уникальные даты в выпадающий список
        Array.from(uniqueDates).forEach(dateStr => {
            const date = new Date(dateStr);
            const option = document.createElement('option');
            option.value = dateStr;
            option.textContent = date.toLocaleDateString();
            startDateSelect.appendChild(option);
        });
        
        // Сброс дополнительных полей
        document.getElementById('course-students').value = 1;
        document.getElementById('course-supplementary').checked = false;
        document.getElementById('course-personalized').checked = false;
        document.getElementById('course-excursions').checked = false;
        document.getElementById('course-assessment').checked = false;
        document.getElementById('course-interactive').checked = false;
        document.getElementById('course-total-price').value = '';
        
        // Обработчики событий
        startDateSelect.addEventListener('change', function() {
            const timeSelect = document.getElementById('course-start-time');
            timeSelect.innerHTML = '<option value="">Выберите время</option>';
            timeSelect.disabled = !this.value;
            
            if (this.value) {
                const selectedDate = new Date(this.value);
                const times = course.start_dates
                    .filter(d => {
                        const date = new Date(d);
                        return date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
                    })
                    .map(d => {
                        const date = new Date(d);
                        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    });
                
                const uniqueTimes = [...new Set(times)];
                
                uniqueTimes.forEach(time => {
                    const option = document.createElement('option');
                    option.value = time;
                    option.textContent = time;
                    timeSelect.appendChild(option);
                });
            }
        });
        
        // Исправленный обработчик кнопки расчета стоимости
        document.getElementById('calculate-price').addEventListener('click', function() {
            const courseId = document.getElementById('course-id').value;
            const startDate = document.getElementById('course-start-date').value;
            const startTime = document.getElementById('course-start-time').value;
            const students = parseInt(document.getElementById('course-students').value);
            
            if (!courseId || !startDate || !startTime || isNaN(students) || students < 1) {
                showError('Пожалуйста, заполните все обязательные поля корректно');
                return;
            }
            
            // Находим курс в текущем списке
            const selectedCourse = currentCourses.find(c => c.id == courseId);
            if (!selectedCourse) {
                showError('Курс не найден');
                return;
            }
            
            // Расчет стоимости
            const date = new Date(startDate);
            const dayOfWeek = date.getDay(); // 0 - воскресенье, 6 - суббота
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            const [hours, minutes] = startTime.split(':').map(Number);
            const isMorning = hours >= 9 && hours < 12;
            const isEvening = hours >= 18 && hours < 20;
            
            const supplementary = document.getElementById('course-supplementary').checked ? 2000 * students : 0;
            const personalized = document.getElementById('course-personalized').checked ? 1500 * selectedCourse.total_length : 0;
            const excursions = document.getElementById('course-excursions').checked ? 0.25 : 0;
            const assessment = document.getElementById('course-assessment').checked ? 300 : 0;
            const interactive = document.getElementById('course-interactive').checked ? 0.5 : 0;
            
            let totalHours = selectedCourse.total_length * selectedCourse.week_length;
            let basePrice = selectedCourse.course_fee_per_hour * totalHours;
            
            // Применение коэффициентов
            if (isWeekend) basePrice *= 1.5;
            if (isMorning) basePrice += 400 * totalHours;
            if (isEvening) basePrice += 1000 * totalHours;
            
            // Дополнительные опции
            let totalPrice = basePrice;
            totalPrice += supplementary;
            totalPrice += personalized;
            totalPrice += basePrice * excursions;
            totalPrice += assessment;
            if (interactive) totalPrice *= 1.5;
            
            // Групповая скидка
            if (students >= 5) totalPrice *= 0.85;
            
            // Ранняя регистрация (если дата начала больше чем через месяц)
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            if (date > oneMonthLater) totalPrice *= 0.9;
            
            document.getElementById('course-total-price').value = `${Math.round(totalPrice)} руб.`;
        });
        
        courseModal.show();
    }
    // Загрузка репетиторов
    function loadTutors() {
        api.getTutors()
            .then(tutors => {
                currentTutors = tutors;
                displayTutors(currentTutorPage);
            })
            .catch(error => showError(error.message));
    }
    
    // Отображение репетиторов с пагинацией
    function displayTutors(page) {
        currentTutorPage = page;
        const start = (page - 1) * tutorsPerPage;
        const end = start + tutorsPerPage;
        const paginatedTutors = currentTutors.slice(start, end);
        
        tutorsList.innerHTML = '';
        paginatedTutors.forEach(tutor => {
            const tutorRow = createTutorRow(tutor);
            tutorsList.appendChild(tutorRow);
        });
        
        renderPagination(tutorsPagination, currentTutors.length, tutorsPerPage, page, displayTutors);
    }
    
    // Создание строки таблицы репетиторов
    function createTutorRow(tutor) {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = tutor.name;
        
        const levelCell = document.createElement('td');
        levelCell.textContent = tutor.language_level;
        
        const languagesCell = document.createElement('td');
        languagesCell.textContent = tutor.languages_offered.join(', ');
        
        const experienceCell = document.createElement('td');
        experienceCell.textContent = tutor.work_experience;
        
        const priceCell = document.createElement('td');
        priceCell.textContent = tutor.price_per_hour;
        
        const actionCell = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-primary';
        btn.textContent = 'Выбрать';
        btn.addEventListener('click', () => openTutorModal(tutor));
        actionCell.appendChild(btn);
        
        row.appendChild(nameCell);
        row.appendChild(levelCell);
        row.appendChild(languagesCell);
        row.appendChild(experienceCell);
        row.appendChild(priceCell);
        row.appendChild(actionCell);
        
        return row;
    }
    
    // Открытие модального окна репетитора
    function openTutorModal(tutor) {
        document.getElementById('tutorModalTitle').textContent = `Заявка на репетитора: ${tutor.name}`;
        document.getElementById('tutor-id').value = tutor.id;
        document.getElementById('tutor-name').value = tutor.name;
        document.getElementById('tutor-price').value = `${tutor.price_per_hour} руб./час`;
        
        // Сброс полей
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('tutor-date').value = today;
        document.getElementById('tutor-time').value = '18:00';
        document.getElementById('tutor-duration').value = 1;
        document.getElementById('tutor-students').value = 1;
        document.getElementById('tutor-early').checked = false;
        document.getElementById('tutor-group').checked = false;
        document.getElementById('tutor-intensive').checked = false;
        document.getElementById('tutor-total-price').value = '';
        
        tutorModal.show();
    }
    
    // Поиск курсов
    document.getElementById('search-courses').addEventListener('click', function(e) {
        e.preventDefault();
        const searchTerm = document.getElementById('course-search').value.toLowerCase();
        const levelFilter = document.getElementById('course-level').value;
        
        api.getCourses()
            .then(courses => {
                currentCourses = courses.filter(course => {
                    const matchesSearch = course.name.toLowerCase().includes(searchTerm) || 
                                         course.description.toLowerCase().includes(searchTerm);
                    const matchesLevel = !levelFilter || course.level === levelFilter;
                    return matchesSearch && matchesLevel;
                });
                displayCourses(1);
            })
            .catch(error => showError(error.message));
    });
    
    // Поиск репетиторов
    document.getElementById('tutor-search-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const levelFilter = document.getElementById('tutor-level').value;
        const experienceFilter = parseInt(document.getElementById('tutor-experience').value) || 0;
        const languageFilter = document.getElementById('tutor-language').value;
        
        api.getTutors()
            .then(tutors => {
                currentTutors = tutors.filter(tutor => {
                    const matchesLevel = !levelFilter || tutor.language_level === levelFilter;
                    const matchesExperience = tutor.work_experience >= experienceFilter;
                    const matchesLanguage = !languageFilter || 
                                          tutor.languages_offered.includes(languageFilter) || 
                                          tutor.languages_spoken.includes(languageFilter);
                    return matchesLevel && matchesExperience && matchesLanguage;
                });
                displayTutors(1);
            })
            .catch(error => showError(error.message));
    });
    
    // Расчет стоимости курса
    document.getElementById('calculate-price').addEventListener('click', function() {
        const courseId = document.getElementById('course-id').value;
        const startDate = document.getElementById('course-start-date').value;
        const startTime = document.getElementById('course-start-time').value;
        const students = parseInt(document.getElementById('course-students').value);
        
        if (!courseId || !startDate || !startTime || !students) {
            showError('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        // Находим курс в текущем списке
        const course = currentCourses.find(c => c.id == courseId);
        if (!course) {
            showError('Курс не найден');
            return;
        }
        
        // Расчет стоимости
        const date = new Date(startDate);
        const dayOfWeek = date.getDay(); // 0 - воскресенье, 6 - суббота
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const [hours, minutes] = startTime.split(':').map(Number);
        const isMorning = hours >= 9 && hours < 12;
        const isEvening = hours >= 18 && hours < 20;
        
        const supplementary = document.getElementById('course-supplementary').checked ? 2000 * students : 0;
        const personalized = document.getElementById('course-personalized').checked ? 1500 * course.total_length : 0;
        const excursions = document.getElementById('course-excursions').checked ? 0.25 : 0;
        const assessment = document.getElementById('course-assessment').checked ? 300 : 0;
        const interactive = document.getElementById('course-interactive').checked ? 0.5 : 0;
        
        let totalHours = course.total_length * course.week_length;
        let basePrice = course.course_fee_per_hour * totalHours;
        
        // Применение коэффициентов
        if (isWeekend) basePrice *= 1.5;
        if (isMorning) basePrice += 400 * totalHours;
        if (isEvening) basePrice += 1000 * totalHours;
        
        // Дополнительные опции
        let totalPrice = basePrice;
        totalPrice += supplementary;
        totalPrice += personalized;
        totalPrice += basePrice * excursions;
        totalPrice += assessment;
        if (interactive) totalPrice *= 1.5;
        
        // Групповая скидка
        if (students >= 5) totalPrice *= 0.85;
        
        // Ранняя регистрация (если дата начала больше чем через месяц)
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        if (date > oneMonthLater) totalPrice *= 0.9;
        
        document.getElementById('course-total-price').value = `${Math.round(totalPrice)} руб.`;
    });
    
    // Отправка заявки на курс
    document.getElementById('submit-course').addEventListener('click', function() {
        const courseId = document.getElementById('course-id').value;
        const startDate = document.getElementById('course-start-date').value;
        const startTime = document.getElementById('course-start-time').value;
        const students = parseInt(document.getElementById('course-students').value);
        const totalPrice = document.getElementById('course-total-price').value;
        
        if (!courseId || !startDate || !startTime || !students || !totalPrice) {
            showError('Пожалуйста, заполните все поля и рассчитайте стоимость');
            return;
        }
        
        const price = parseInt(totalPrice.replace(/\D/g, ''));
        const supplementary = document.getElementById('course-supplementary').checked;
        const personalized = document.getElementById('course-personalized').checked;
        const excursions = document.getElementById('course-excursions').checked;
        const assessment = document.getElementById('course-assessment').checked;
        const interactive = document.getElementById('course-interactive').checked;
        
        // Проверка даты на раннюю регистрацию
        const date = new Date(startDate);
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        const earlyRegistration = date > oneMonthLater;
        
        // Проверка на групповую запись
        const groupEnrollment = students >= 5;
        
        const orderData = {
            course_id: courseId,
            date_start: startDate.split('T')[0],
            time_start: startTime,
            duration: 1, // Для курсов продолжительность берется из данных курса
            persons: students,
            price: price,
            early_registration: earlyRegistration,
            group_enrollment: groupEnrollment,
            intensive_course: false, // Для курсов не применяется
            supplementary: supplementary,
            personalized: personalized,
            excursions: excursions,
            assessment: assessment,
            interactive: interactive
        };
        
        api.createOrder(orderData)
            .then(() => {
                showSuccess('Заявка успешно отправлена!');
                courseModal.hide();
            })
            .catch(error => showError(error.message));
    });
    
    // Расчет стоимости репетитора
    document.getElementById('calculate-tutor-price').addEventListener('click', function() {
        const tutorId = document.getElementById('tutor-id').value;
        const date = document.getElementById('tutor-date').value;
        const time = document.getElementById('tutor-time').value;
        const duration = parseInt(document.getElementById('tutor-duration').value);
        const students = parseInt(document.getElementById('tutor-students').value);
        
        if (!tutorId || !date || !time || !duration || !students) {
            showError('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        // Находим репетитора в текущем списке
        const tutor = currentTutors.find(t => t.id == tutorId);
        if (!tutor) {
            showError('Репетитор не найден');
            return;
        }
        
        // Расчет стоимости
        let basePrice = tutor.price_per_hour * duration;
        
        // Дополнительные опции
        const early = document.getElementById('tutor-early').checked;
        const group = document.getElementById('tutor-group').checked;
        const intensive = document.getElementById('tutor-intensive').checked;
        
        let totalPrice = basePrice;
        if (early) totalPrice *= 0.9;
        if (group) totalPrice *= 0.85;
        if (intensive) totalPrice *= 1.2;
        
        document.getElementById('tutor-total-price').value = `${Math.round(totalPrice)} руб.`;
    });
    
    // Отправка заявки на репетитора
    document.getElementById('submit-tutor').addEventListener('click', function() {
        const tutorId = document.getElementById('tutor-id').value;
        const date = document.getElementById('tutor-date').value;
        const time = document.getElementById('tutor-time').value;
        const duration = parseInt(document.getElementById('tutor-duration').value);
        const students = parseInt(document.getElementById('tutor-students').value);
        const totalPrice = document.getElementById('tutor-total-price').value;
        
        if (!tutorId || !date || !time || !duration || !students || !totalPrice) {
            showError('Пожалуйста, заполните все поля и рассчитайте стоимость');
            return;
        }
        
        const price = parseInt(totalPrice.replace(/\D/g, ''));
        const early = document.getElementById('tutor-early').checked;
        const group = document.getElementById('tutor-group').checked;
        const intensive = document.getElementById('tutor-intensive').checked;
        
        const orderData = {
            tutor_id: tutorId,
            date_start: date,
            time_start: time,
            duration: duration,
            persons: students,
            price: price,
            early_registration: early,
            group_enrollment: group,
            intensive_course: intensive,
            supplementary: false,
            personalized: false,
            excursions: false,
            assessment: false,
            interactive: false
        };
        
        api.createOrder(orderData)
            .then(() => {
                showSuccess('Заявка на репетитора успешно отправлена!');
                tutorModal.hide();
            })
            .catch(error => showError(error.message));
    });
    
    // Вспомогательные функции
    function renderPagination(element, totalItems, itemsPerPage, currentPage, callback) {
        element.innerHTML = '';
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (totalPages <= 1) return;
        
        // Кнопка "Назад"
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.textContent = 'Назад';
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) callback(currentPage - 1);
        });
        prevLi.appendChild(prevLink);
        element.appendChild(prevLi);
        
        // Нумерация страниц
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            const link = document.createElement('a');
            link.className = 'page-link';
            link.href = '#';
            link.textContent = i;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                callback(i);
            });
            li.appendChild(link);
            element.appendChild(li);
        }
        
        // Кнопка "Вперед"
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.textContent = 'Вперед';
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) callback(currentPage + 1);
        });
        nextLi.appendChild(nextLink);
        element.appendChild(nextLi);
    }
    
    function showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        notificationArea.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }
    
    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        notificationArea.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }
    
    // Инициализация
    loadCourses();
    loadTutors();
});