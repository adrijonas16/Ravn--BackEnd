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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantDto } from './dto/create-sku.dto';
import { UpdateProductVariantDto } from './dto/update-sku.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
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
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('options/sizes')
  @ApiOperation({ summary: 'List product sizes (public)' })
  listSizes() {
    return this.productsService.listSizes();
  }

  @Get('options/colors')
  @ApiOperation({ summary: 'List product colors (public)' })
  listColors() {
    return this.productsService.listColors();
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

  // ─── Product variants (talla + color + precio + stock) ───

  // GET /products/:productId/variants — ruta anidada, público
  @Get(':productId/variants')
  @ApiOperation({ summary: 'List product variants for a product (public)' })
  findVariants(@Param('productId', ParseIntPipe) productId: number) {
    return this.productsService.findVariants(productId);
  }

  // POST /products/:productId/variants — crear variante, solo manager
  @Post(':productId/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product variant (manager only)' })
  createVariant(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(productId, dto);
  }

  // PATCH /products/:productId/variants/:productVariantId — actualizar variante, solo manager
  @Patch(':productId/variants/:productVariantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product variant (manager only)' })
  updateVariant(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('productVariantId', ParseIntPipe) productVariantId: number,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant({
      productId,
      productVariantId,
      dto,
    });
  }

  @Post(':productId/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a product image by URL (manager only)' })
  addImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateProductImageDto,
  ) {
    return this.productsService.addImage(productId, dto);
  }

  @Patch(':productId/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product image (manager only)' })
  updateImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productsService.updateImage({ productId, imageId, dto });
  }

  @Delete(':productId/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product image (manager only)' })
  removeImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.productsService.removeImage(productId, imageId);
  }
}
