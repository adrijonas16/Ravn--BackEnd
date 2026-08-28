// ExceptionFilter: interfaz para crear filtros de excepciones personalizados
// @Catch(): decorador que indica qué excepciones atrapar
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

// ─── FILTRO GLOBAL DE EXCEPCIONES ───
// @Catch() sin argumentos: atrapa TODAS las excepciones (HttpException, errores de BD, TypeError, etc.)
// Sin este filtro, NestJS devolvería errores con formatos diferentes según el tipo
// Este filtro garantiza que TODOS los errores tengan el mismo formato JSON: { statusCode, message, error }
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  // catch() se ejecuta cada vez que ocurre una excepción no manejada en la app
  // exception: el error que se lanzó | host: acceso al request/response
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Log del error real para debugging
    if (!(exception instanceof HttpException)) {
      console.error('Unhandled exception:', exception);
    }

    // Valores por defecto: si es un error inesperado, devuelve 500
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    // Si es una HttpException de NestJS (ej: NotFoundException, BadRequestException)
    // extrae el status y mensaje real del error
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      // NestJS a veces devuelve el error como objeto o como string — manejamos ambos casos
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message ?? exception.message;
        error = (res as any).error ?? 'Error';
      } else {
        message = res;
      }
    }

    // Respuesta uniforme: siempre el mismo formato para que el frontend sepa qué esperar
    response.status(status).json({ statusCode: status, message, error });
  }
}
