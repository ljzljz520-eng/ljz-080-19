import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreService } from '../database/store.service';
import { Elder, MobilityLevel } from '../domain';

@Injectable()
export class EldersService {
  constructor(private readonly store: StoreService) {}

  list(keyword?: string) {
    const all = this.store.elders;
    if (!keyword) return all;
    const k = keyword.trim();
    return all.filter(
      (e) => e.name.includes(k) || e.phone?.includes(k) || e.address?.includes(k),
    );
  }

  get(id: string): Elder {
    const elder = this.store.elders.find((e) => e.id === id);
    if (!elder) throw new NotFoundException('未找到该老人档案');
    return elder;
  }

  create(dto: {
    name: string;
    gender: 'male' | 'female';
    age: number;
    phone?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    mobility: MobilityLevel;
    wheelchairSeat?: boolean;
    dietaryRestrictions?: string[];
    conditions?: string[];
  }): Elder {
    const elder: Elder = {
      id: this.store.uuid('el'),
      name: dto.name,
      gender: dto.gender,
      age: dto.age,
      phone: dto.phone,
      address: dto.address,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      mobility: dto.mobility,
      wheelchairSeat: dto.wheelchairSeat ?? false,
      dietaryRestrictions: dto.dietaryRestrictions ?? [],
      conditions: dto.conditions ?? [],
      createdAt: new Date().toISOString(),
    };
    this.store.elders.push(elder);
    return elder;
  }
}
