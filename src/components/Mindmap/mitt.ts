// 事件发布订阅模式
export type Handler<T = any> = (event?: T) => void;
export interface Emitter {
  all: Map<string, Handler[]>;
  on(type: string, handler: Handler): void;
  off(type: string, handler: Handler): void;
  emit<T>(type: string, evt: T): void;
}

export default function mitt (): Emitter {
  const all: Map<string, Handler[]> = new Map()

  return {
    all,

    on (type: string, handler: Handler) {
      const handlers = all.get(type)
      if (!handlers) {
        all.set(type, [handler])
      } else {
        handlers.push(handler)
      }
    },

    off (type: string, handler: Handler) {
      const handlers = all.get(type)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index !== -1) {
          handlers.splice(index, 1)
        }
      }
    },

    emit<T> (type: string, evt: T) {
      const handlers = all.get(type)
      if (handlers) {
        handlers.forEach((handler) => {
          handler(evt)
        })
      }
    }
  }
}
