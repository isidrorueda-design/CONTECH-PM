import api from './axiosConfig';

const BcfService = {
    // --- Topics ---
    getTopics: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/topics`);
        return response.data;
    },
    createTopic: async (projectId, topicData) => {
        const response = await api.post(`/projects/${projectId}/topics`, topicData);
        return response.data;
    },
    updateTopic: async (topicId, topicData) => {
        const response = await api.put(`/topics/${topicId}`, topicData);
        return response.data;
    },
    getTopic: async (topicId) => {
        const response = await api.get(`/topics/${topicId}`);
        return response.data;
    },
    // --- Comments ---
    addComment: async (topicId, commentData) => {
        const response = await api.post(`/topics/${topicId}/comments`, commentData);
        return response.data;
    },
    // --- Viewpoints ---
    addViewpoint: async (topicId, viewpointData) => {
        const response = await api.post(`/topics/${topicId}/viewpoints`, viewpointData);
        return response.data;
    },
    getViewpoint: async (viewpointId) => {
        const response = await api.get(`/viewpoints/${viewpointId}`);
        return response.data;
    },
    // --- Extensions (Status, Types, etc.) ---
    getExtensions: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/extensions`);
        return response.data;
    }
};

export default BcfService;
