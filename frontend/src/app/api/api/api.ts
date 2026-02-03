export * from './moods.service';
export * from './planner.service';
import { MoodsService } from './moods.service';
import { PlannerService } from './planner.service';
export const APIS = [MoodsService, PlannerService];
