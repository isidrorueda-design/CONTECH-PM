import React, { useState, useEffect } from 'react';
import BcfService from '../../api/BcfService';

function IssuesTab({ projectId, onSelectTopic, onCreateTopic }) {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (projectId) {
            loadTopics();
        }
    }, [projectId]);

    const loadTopics = async () => {
        setLoading(true);
        try {
            const data = await BcfService.getTopics(projectId);
            setTopics(data);
        } catch (error) {
            console.error("Error loading topics:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="issues-tab" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="issues-header" style={{ padding: '10px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Incidencias (BCF)</h3>
                <button onClick={onCreateTopic} style={{ padding: '5px 10px', cursor: 'pointer' }}>
                    + Nueva Incidencia
                </button>
            </div>

            <div className="issues-list" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {loading ? (
                    <p>Cargando incidencias...</p>
                ) : topics.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>No hay incidencias registradas.</p>
                ) : (
                    topics.map(topic => (
                        <div
                            key={topic.guid}
                            onClick={() => onSelectTopic(topic)}
                            style={{
                                border: '1px solid #eee',
                                borderRadius: '4px',
                                padding: '10px',
                                marginBottom: '8px',
                                cursor: 'pointer',
                                backgroundColor: '#fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{topic.title}</div>
                            <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{topic.topic_status}</span>
                                <span>{topic.topic_type}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px' }}>
                                Asignado a: {topic.assigned_to || 'Sin asignar'}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default IssuesTab;
