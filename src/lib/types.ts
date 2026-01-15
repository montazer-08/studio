export interface Task {
    id: string;
    name: string;
    description?: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'To Do' | 'In Progress' | 'Done';
    userId: string;
    dueDate?: string;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    userId: string;
    folder?: string;
    tagIds?: string[];
    createdAt: any; // Firestore ServerTimestamp
}
  
export interface File {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadDate: any; // Firestore ServerTimestamp
    userId: string;
    storagePath: string;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    company?: string;
    status: 'Lead' | 'Customer' | 'Archived';
    userId: string;
}

export interface RoadmapItem {
    id: string;
    title: string;
    description: string;
    status: 'Planned' | 'In Progress' | 'Completed';
    source: 'Community' | 'Internal';
    order: number;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'task_created' | 'note_created' | 'file_uploaded' | 'system_message';
    message: string;
    createdAt: any; // Firestore ServerTimestamp
    isRead: boolean;
}
