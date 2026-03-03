import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class ParseDatePipe implements PipeTransform<string | undefined, string> {
  transform(value: string | undefined): string {
    if (!value) return new Date().toISOString().split('T')[0];
    if (!DATE_REGEX.test(value) || isNaN(Date.parse(value))) {
      throw new BadRequestException(`Data inválida: "${value}". Use o formato YYYY-MM-DD`);
    }
    return value;
  }
}
