document.addEventListener('DOMContentLoaded', function() {
    // Инициализация API
    const api = new ExamAPI('b956c9fb-854c-4c30-b6bc-98f8ac8f9c3a');
    
    // Элементы страницы
    const notificationArea = document.getElementById('notification-area');
    const ordersList = document.getElementById('orders-list');
    const ordersPagination = document.getElementById('orders-pagination');
    const orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    
    // Текущие данные
    let currentOrders = [];
    let currentOrderPage = 1;
    const ordersPerPage = 5;
    let selectedOrderId = null;
    
    // Загрузка заказов
    function loadOrders() {
        api.getOrders()
            .then(orders => {
                currentOrders = orders;
                displayOrders(currentOrderPage);
            })
            .catch(error => showError(error.message));
    }
    
    // Отображение заказов с пагинацией
    function displayOrders(page) {
        currentOrderPage = page;
        const start = (page - 1) * ordersPerPage;
        const end = start + ordersPerPage;
        const paginatedOrders = currentOrders.slice(start, end);
        
        ordersList.innerHTML = '';
        paginatedOrders.forEach((order, index) => {
            const orderRow = createOrderRow(order, start + index + 1);
            ordersList.appendChild(orderRow);
        });
        
        renderPagination(ordersPagination, currentOrders.length, ordersPerPage, page, displayOrders);
    }
    
    // Создание строки таблицы заказов
    function createOrderRow(order, number) {
        const row = document.createElement('tr');
        
        const numCell = document.createElement('td');
        numCell.textContent = number;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = order.course_id ? `Курс ID: ${order.course_id}` : `Репетитор ID: ${order.tutor_id}`;
        
        const dateCell = document.createElement('td');
        dateCell.textContent = order.date_start;
        
        const priceCell = document.createElement('td');
        priceCell.textContent = `${order.price} руб.`;
        
        const statusCell = document.createElement('td');
        statusCell.textContent = 'Новый'; // В реальном проекте статус будет из API
        
        const actionCell = document.createElement('td');
        actionCell.className = 'd-flex gap-2';
        
        // Кнопка "Подробнее"
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'btn btn-sm btn-info';
        detailsBtn.textContent = 'Подробнее';
        detailsBtn.addEventListener('click', () => showOrderDetails(order));
        
        // Кнопка "Изменить"
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-warning';
        editBtn.textContent = 'Изменить';
        editBtn.addEventListener('click', () => openEditModal(order));
        
        // Кнопка "Удалить"
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.textContent = 'Удалить';
        deleteBtn.addEventListener('click', () => {
            selectedOrderId = order.id;
            deleteModal.show();
        });
        
        actionCell.appendChild(detailsBtn);
        actionCell.appendChild(editBtn);
        actionCell.appendChild(deleteBtn);
        
        row.appendChild(numCell);
        row.appendChild(nameCell);
        row.appendChild(dateCell);
        row.appendChild(priceCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);
        
        return row;
    }
    
    // Просмотр деталей заказа
    function showOrderDetails(order) {
        const detailsContainer = document.getElementById('order-details');
        detailsContainer.innerHTML = `
            <h6>${order.course_id ? 'Курс' : 'Репетитор'}</h6>
            <p>${order.course_id ? `ID курса: ${order.course_id}` : `ID репетитора: ${order.tutor_id}`}</p>
            
            <h6 class="mt-3">Дата и время</h6>
            <p>${order.date_start} в ${order.time_start}</p>
            
            <h6 class="mt-3">Продолжительность</h6>
            <p>${order.duration} ${order.course_id ? 'недель' : 'часов'}</p>
            
            <h6 class="mt-3">Количество студентов</h6>
            <p>${order.persons}</p>
            
            <h6 class="mt-3">Стоимость</h6>
            <p>${order.price} руб.</p>
            
            <h6 class="mt-3">Дополнительные опции</h6>
            <ul>
                <li>Ранняя регистрация: ${order.early_registration ? 'Да' : 'Нет'}</li>
                <li>Групповая запись: ${order.group_enrollment ? 'Да' : 'Нет'}</li>
                <li>Интенсивный курс: ${order.intensive_course ? 'Да' : 'Нет'}</li>
                <li>Доп. материалы: ${order.supplementary ? 'Да' : 'Нет'}</li>
                <li>Индив. занятия: ${order.personalized ? 'Да' : 'Нет'}</li>
                <li>Экскурсии: ${order.excursions ? 'Да' : 'Нет'}</li>
                <li>Оценка уровня: ${order.assessment ? 'Да' : 'Нет'}</li>
                <li>Интерактивная платформа: ${order.interactive ? 'Да' : 'Нет'}</li>
            </ul>
        `;
        
        orderModal.show();
    }
    
    // Открытие модального окна редактирования
    function openEditModal(order) {
        selectedOrderId = order.id;
        const formContainer = document.getElementById('edit-order-form');
        
        // Загрузка данных для формы редактирования
        formContainer.innerHTML = `
            <div class="mb-3">
                <label for="edit-date" class="form-label">Дата</label>
                <input type="date" class="form-control" id="edit-date" value="${order.date_start}">
            </div>
            <div class="mb-3">
                <label for="edit-time" class="form-label">Время</label>
                <input type="time" class="form-control" id="edit-time" value="${order.time_start}">
            </div>
            <div class="mb-3">
                <label for="edit-duration" class="form-label">Продолжительность</label>
                <input type="number" class="form-control" id="edit-duration" value="${order.duration}" min="1" ${order.course_id ? 'max="52"' : 'max="40"'}>
            </div>
            <div class="mb-3">
                <label for="edit-persons" class="form-label">Количество студентов</label>
                <input type="number" class="form-control" id="edit-persons" value="${order.persons}" min="1" max="20">
            </div>
        `;
        
        editModal.show();
    }
    
    // Сохранение изменений
    document.getElementById('save-order').addEventListener('click', function() {
        const date = document.getElementById('edit-date').value;
        const time = document.getElementById('edit-time').value;
        const duration = parseInt(document.getElementById('edit-duration').value);
        const persons = parseInt(document.getElementById('edit-persons').value);
        
        if (!date || !time || !duration || !persons) {
            showError('Пожалуйста, заполните все поля');
            return;
        }
        
        const orderData = {
            date_start: date,
            time_start: time,
            duration: duration,
            persons: persons
        };
        
        api.updateOrder(selectedOrderId, orderData)
            .then(() => {
                showSuccess('Заявка успешно обновлена!');
                editModal.hide();
                loadOrders();
            })
            .catch(error => showError(error.message));
    });
    
    // Удаление заказа
    document.getElementById('confirm-delete').addEventListener('click', function() {
        api.deleteOrder(selectedOrderId)
            .then(() => {
                showSuccess('Заявка успешно удалена!');
                deleteModal.hide();
                loadOrders();
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
    loadOrders();
});