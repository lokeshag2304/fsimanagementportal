export type EntityType = 'subscription' | 'ssl' | 'domain' | 'hosting' | 'email' | 'counter';
export type ActionType = 'create' | 'update' | 'delete' | 'import';

export interface EntityEvent {
    entity: EntityType;
    action: ActionType;
    payload: any;
    timestamp: number;
}

export type SubscriberCallback = (event: EntityEvent) => void;

class EntityBus {
    private subscribers: Map<EntityType | 'all', Set<SubscriberCallback>> = new Map();
    private channel: BroadcastChannel | null = null;

    constructor() {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            this.channel = new BroadcastChannel('fsi_entity_bus');
            this.channel.onmessage = (event: MessageEvent<EntityEvent>) => {
                this.notifySubscribers(event.data);
            };
        }
    }

    subscribe(entity: EntityType | 'all', callback: SubscriberCallback): () => void {
        if (!this.subscribers.has(entity)) {
            this.subscribers.set(entity, new Set());
        }
        this.subscribers.get(entity)!.add(callback);

        // Return an unsubscribe function
        return () => {
            const set = this.subscribers.get(entity);
            if (set) {
                set.delete(callback);
                if (set.size === 0) {
                    this.subscribers.delete(entity);
                }
            }
        };
    }

    emit(entity: EntityType, action: ActionType, payload: any) {
        const event: EntityEvent = { entity, action, payload, timestamp: Date.now() };

        // Notify local subscribers instantly
        this.notifySubscribers(event);

        // Broadcast to other tabs instantly
        if (this.channel) {
            this.channel.postMessage(event);
        }
    }

    private notifySubscribers(event: EntityEvent) {
        // Notify specific entity subscribers
        if (this.subscribers.has(event.entity)) {
            this.subscribers.get(event.entity)!.forEach(cb => cb(event));
        }

        // Notify "all" global subscribers (e.g. Activity feed)
        if (this.subscribers.has('all')) {
            this.subscribers.get('all')!.forEach(cb => cb(event));
        }
    }
}

export const entityBus = new EntityBus();

export const emitEntityChange = (entity: EntityType, action: ActionType, payload: any) => {
    entityBus.emit(entity, action, payload);
};

export const subscribeEntity = (entity: EntityType | 'all', callback: SubscriberCallback) => {
    return entityBus.subscribe(entity, callback);
};
