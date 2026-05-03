export const API_BASE_URL =
    (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
    'http://localhost:5000/api';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('amatalink_token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch (err: any) {
        console.error('Network error while fetching', API_BASE_URL + endpoint, err);
        throw new Error('Network error: could not reach the API. Is the backend running and CORS enabled?');
    }

    let data: any = {};
    try {
        data = await response.json();
    } catch (e) {
        const text = await response.text().catch(() => '');
        if (!response.ok) {
            console.error('Non-JSON error response', response.status, response.statusText, text);
            throw new Error(`Server error: ${response.status} ${response.statusText} - ${text}`);
        }
        return text;
    }

    if (!response.ok) {
        const errorMessage = data.message || data.error || data.msg || 'Something went wrong';
        throw new Error(errorMessage);
    }

    return data;
};

export const authApi = {
    register: (userData: any) => {
        return apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    login: (credentials: any) => apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),

    verifyEmail: (data: { email: string; code: string }) => apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getMe: () => apiFetch('/auth/me'),
    
    resendCode: (data: { email: string }) => apiFetch('/auth/resend-code', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    forgotPassword: (data: { email: string }) => apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    resetPassword: (data: any) => apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

export const milkApi = {
    addRecord: (record: any) => apiFetch('/milk/record', {
        method: 'POST',
        body: JSON.stringify(record),
    }),

    getFarmerRecords: () => apiFetch('/milk/farmer/records'),

    getCollectorRecords: () => apiFetch('/milk/collector/records'),

    getTodaySummary: () => apiFetch('/milk/collector/today'),

    getFarmers: () => apiFetch('/milk/farmers'),
};

export const notificationsApi = {
    getNotifications: () => apiFetch('/notifications'),
    markAsRead: (id: number) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
    createNotification: (data: { userId: number; title: string; message: string; type: string }) =>
        apiFetch('/notifications', { method: 'POST', body: JSON.stringify(data) }),
};

export const adminApi = {
    getStats: () => apiFetch('/admin/dashboard-stats'),
    getFarmers: () => apiFetch('/admin/farmers'),
    getCollectors: () => apiFetch('/admin/collectors'),
    getAllRecords: (params?: { date?: string; status?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiFetch(`/admin/milk-records${query ? `?${query}` : ''}`);
    },
    getRecordsByFarmer: (farmerId: number, params?: { startDate?: string; endDate?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiFetch(`/admin/milk-records/farmer/${farmerId}${query ? `?${query}` : ''}`);
    },
    confirmRecord: (recordId: number, status: string) => apiFetch(`/admin/milk-records/${recordId}/confirm`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    }),
    getUsers: () => apiFetch('/admin/users'),
    createUser: (userData: any) => apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
    updateUser: (id: number, payload: any) => apiFetch(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteUser: (id: number) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
    getMonthlyReport: (month: number, year: number) => apiFetch(`/admin/reports/monthly/${month}/${year}`),
    getWeeklyReport: (startDate: string, endDate: string) => apiFetch(`/admin/reports/weekly/${startDate}/${endDate}`),
    getYearlyReport: (year: number) => apiFetch(`/admin/reports/yearly/${year}`),
    getCustomDateRangeReport: (startDate: string, endDate: string) => apiFetch('/admin/reports/custom', { method: 'POST', body: JSON.stringify({ startDate, endDate }) }),
    getSettings: () => apiFetch('/admin/settings'),
    updateSettings: (settings: any) => apiFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) }),
    getPaginatedRecords: (params: any) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/admin/milk-records/paginated?${query}`);
    },
    removeDuplicates: () => apiFetch('/admin/remove-duplicates', { method: 'POST' }),
    exportData: (params?: any) => {
        const query = new URLSearchParams(params as any).toString();
        return apiFetch(`/admin/export?${query}`);
    },
    getPendingUsers: (role?: string) => apiFetch(`/admin/pending-users${role ? `?role=${role}` : ''}`),
    approveUser: (id: number) => apiFetch(`/admin/users/${id}/approve`, { method: 'PUT' }),
    rejectUser: (id: number) => apiFetch(`/admin/users/${id}/reject`, { method: 'PUT' }),
};

export const reportsApi = {
    exportPDF: (params: { startDate?: string; endDate?: string; farmerId?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return `${API_BASE_URL}/reports/export/pdf?${query}&token=${localStorage.getItem('amatalink_token')}`;
    },
    exportExcel: (params: { startDate?: string; endDate?: string; farmerId?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return `${API_BASE_URL}/reports/export/excel?${query}&token=${localStorage.getItem('amatalink_token')}`;
    }
};

export const paymentsApi = {
    getMethods: () => apiFetch('/payments/methods'),
    createMethod: (method: any) => apiFetch('/payments/methods', { method: 'POST', body: JSON.stringify(method) }),
    updateMethod: (id: number, method: any) => apiFetch(`/payments/methods/${id}`, { method: 'PUT', body: JSON.stringify(method) }),
    deleteMethod: (id: number) => apiFetch(`/payments/methods/${id}`, { method: 'DELETE' }),
    setMyPayment: (payload: { payment_method_id?: number; account_number?: string }) => apiFetch('/payments/me', { method: 'POST', body: JSON.stringify(payload) }),
    getFarmerMonthlySummary: () => apiFetch('/payments/farmer-monthly-summary'),
    requestPayout: (payload: { amount: number; payment_method_id: number; account_number: string }) => apiFetch('/payments/request-payout', { method: 'POST', body: JSON.stringify(payload) }),
    getPayoutRequests: (params?: { status?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiFetch(`/payments/requests${query ? `?${query}` : ''}`);
    },
    updatePayoutStatus: (id: number, status: string) => apiFetch(`/payments/requests/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    })
};

export const messagesApi = {
    getUnreadCount: () => apiFetch('/messages/unread-count'),
};
