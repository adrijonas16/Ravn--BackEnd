import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

// @ApiTags agrupa estos endpoints bajo "Products" en la documentación Swagger
@ApiTags('Products')
// @Controller define el prefijo de ruta: todas las rutas empiezan con /products
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // --- ENDPOINTS PÚBLICOS (sin autenticación) ---

  // @Get() sin parámetro = GET /products
  @Get()
  @ApiOperation({ summary: 'List products with pagination (public)' })
  // @ApiQuery documenta los query params en Swagger (ej: /products?page=2&search=azul)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    // @Query extrae parámetros de la URL (ej: ?page=2). Valores por defecto: page=1, limit=20
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('categoryId') categoryId?: number,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll({ page, limit, categoryId, search });
  }

  // GET /products/:productId — ParseIntPipe convierte el string de la URL a número
  @Get(':productId')
  @ApiOperation({ summary: 'Get product details (public)' })
  findOne(@Param('productId', ParseIntPipe) productId: number) {
    return this.productsService.findOne(productId);
  }

  // --- ENDPOINTS PROTEGIDOS (solo managers) ---

  // POST /products — crear producto
  @Post()
  // UseGuards aplica guardias en orden: primero verifica JWT, luego verifica el rol
  @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles limita el acceso solo a usuarios con rol 'manager'
  @Roles('manager')
  // @ApiBearerAuth indica en Swagger que necesita token Bearer en el header
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product (manager only)' })
  // @Body extrae el cuerpo del request y lo valida contra CreateProductDto
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // PATCH /products/:productId — actualización parcial
  @Patch(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (manager only)' })
  update(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(productId, dto);
  }

  // DELETE /products/:productId — soft delete (no borra realmente)
  @Delete(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  // HttpCode(204) = respuesta sin contenido, indica éxito sin devolver datos
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product (manager only)' })
  remove(@Param('productId', ParseIntPipe) productId: number) {
    return this.productsService.remove(productId);
  }

  // ─── SKUs (variantes de producto: talla + color + precio + stock) ───

  // GET /products/:productId/skus — ruta anidada, público
  @Get(':productId/skus')
  @ApiOperation({ summary: 'List SKUs for a product (public)' })
  findSkus(@Param('productId', ParseIntPipe) productId: number) {
    return this.productsService.findSkus(productId);
  }

  // POST /products/:productId/skus — crear variante, solo manager
  @Post(':productId/skus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a SKU (manager only)' })
  createSku(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateSkuDto,
  ) {
    return this.productsService.createSku(productId, dto);
  }

  // PATCH /products/:productId/skus/:skuId — actualizar variante, solo manager
  @Patch(':productId/skus/:skuId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a SKU (manager only)' })
  updateSku(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('skuId', ParseIntPipe) skuId: number,
    @Body() dto: UpdateSkuDto,
  ) {
    return this.productsService.updateSku(productId, skuId, dto);
  }
}
