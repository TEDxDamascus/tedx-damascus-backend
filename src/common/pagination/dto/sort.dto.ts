import { IsOptional, IsString } from 'class-validator';

export class SortDto {
  @IsOptional()
  @IsString()
  sort?: string;

  parseSort(): { field: string; order: 'ASC' | 'DESC' } | null {
    if (!this.sort) return null;

    const [field, order] = this.sort.split(':');

    return {
      field,
      order: order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
    };
  }
}