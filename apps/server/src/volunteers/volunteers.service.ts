import { Injectable } from '@nestjs/common';
import { DataStore } from '../database/data-store';
import { Volunteer } from '../domain';

@Injectable()
export class VolunteersService {
  constructor(private readonly store: DataStore) {}

  list(): Promise<Volunteer[]> {
    return this.store.list<Volunteer>('volunteers');
  }
}
