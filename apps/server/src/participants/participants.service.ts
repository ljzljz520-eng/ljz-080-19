import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataStore } from '../database/data-store';
import { Participant } from '../domain';

@Injectable()
export class ParticipantsService {
  constructor(private readonly store: DataStore) {}

  list(): Promise<Participant[]> {
    return this.store.list<Participant>('participants');
  }

  async get(id: string): Promise<Participant> {
    const all = await this.list();
    const found = all.find((p) => p.id === id);
    if (!found) throw new Error('老人档案不存在');
    return found;
  }

  async create(data: Omit<Participant, 'id'>): Promise<Participant> {
    const row: Participant = { id: randomUUID(), ...data };
    return this.store.insert('participants', row);
  }
}
