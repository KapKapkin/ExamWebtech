class ExamAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';
    }
    
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}?api_key=${this.apiKey}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при выполнении запроса');
            }
            
            return await response.json();
        } catch (error) {
            throw new Error(`Ошибка сети: ${error.message}`);
        }
    }
    
    // Получить список курсов
    async getCourses() {
        return this.request('/courses');
    }
    
    // Получить информацию о курсе
    async getCourse(id) {
        return this.request(`/course/${id}`);
    }
    
    // Получить список репетиторов
    async getTutors() {
        return this.request('/tutors');
    }
    
    // Получить информацию о репетиторе
    async getTutor(id) {
        return this.request(`/tutors/${id}`);
    }
    
    // Получить список заказов
    async getOrders() {
        return this.request('/orders');
    }
    
    // Получить информацию о заказе
    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }
    
    // Создать заказ
    async createOrder(data) {
        return this.request('/orders', 'POST', data);
    }
    
    // Обновить заказ
    async updateOrder(id, data) {
        return this.request(`/orders/${id}`, 'PUT', data);
    }
    
    // Удалить заказ
    async deleteOrder(id) {
        return this.request(`/orders/${id}`, 'DELETE');
    }
}