import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreService } from '../database/store.service';
import { MobilityLevel, Volunteer } from '../domain';

const LEVEL_ORDER: MobilityLevel[] = [
  'independent',
  'cane',
  'walker',
  'wheelchair',
  'bedridden',
];

@Injectable()
export class VolunteersService {
  constructor(private readonly store: StoreService) {}

  list() {
    return this.store.volunteers;
  }

  get(id: string): Volunteer {
    const v = this.store.volunteers.find((x) => x.id === id);
    if (!v) throw new NotFoundException('未找到该志愿者');
    return v;
  }

  /** 志愿者能否照护该行动能力的老人 */
  canCare(volunteer: Volunteer, mobility: MobilityLevel): boolean {
    return LEVEL_ORDER.indexOf(mobility) <= LEVEL_ORDER.indexOf(volunteer.maxCareLevel);
  }

  create(dto: {
    name: string;
    phone: string;
    canDrive?: boolean;
    maxCareLevel?: MobilityLevel;
    skills?: string[];
  }): Volunteer {
    const v: Volunteer = {
      id: this.store.uuid('vo'),
      name: dto.name,
      phone: dto.phone,
      canDrive: dto.canDrive ?? false,
      maxCareLevel: dto.maxCareLevel ?? 'independent',
      skills: dto.skills ?? [],
      createdAt: new Date().toISOString(),
    };
    this.store.volunteers.push(v);
    return v;
  }
}
