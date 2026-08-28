import { DynamicModule, Inject, Module } from '@nestjs/common';

function getQueueToken(name: string) {
  return `BullQueue_${name}`;
}

@Module({})
export class BullModule {
  static forRootAsync(): DynamicModule {
    return { module: BullModule };
  }

  static registerQueue(...queues: Array<{ name: string }>): DynamicModule {
    return {
      module: BullModule,
      providers: queues.map((queue) => ({
        provide: getQueueToken(queue.name),
        useValue: { add: () => Promise.resolve(undefined) },
      })),
      exports: queues.map((queue) => getQueueToken(queue.name)),
    };
  }
}

export function InjectQueue(name: string) {
  return Inject(getQueueToken(name));
}

export function Processor() {
  return () => undefined;
}

export abstract class WorkerHost {
  abstract process(...args: unknown[]): Promise<void> | void;
}
