import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { ProductRepository } from "@infrastructure/repositories/catalog.repository";
import { ProductUseCase } from "@application/use-cases/products/product.use-case";
import dataSource from "@infrastructure/config/db-context";
import {
  asyncRoute,
  currentUserId,
  paginationFromRequest,
} from "./endpoint-helpers";
import {
  authenticate,
  requirePermission,
} from "@presentation/middleware/shop-auth.middleware";
import { NotFoundError } from "@application/models/error/application.error";
import { parseRequest } from "@application/models/validators/common.validator";
import {
  productCreateRequestSchema,
  productIdParamsSchema,
  productUpdateRequestSchema,
  stockAdjustmentRequestSchema,
} from "@application/models/validators/catalog.validator";
import type {
  ProductCreateRequest,
  ProductIdParams,
  ProductUpdateRequest,
  StockAdjustmentRequest,
} from "@application/models/requests/catalog.request";
import {
  productListResponse,
  productResponse,
  stockMovementListResponse,
} from "@application/models/response/catalog.response";

const router = Router();
const useCase = new ProductUseCase(new ProductRepository(dataSource));

router.use(authenticate);
router.get(
  "/",
  requirePermission("products.view"),
  asyncRoute(async (req, res) => {
    const result = await useCase.list(
      paginationFromRequest(req, {
        allowedSortBy: [
          "productName",
          "productCode",
          "price",
          "stock",
          "createdAt",
        ],
        allowSearch: true,
      }),
    );
    res
      .status(StatusCodes.OK)
      .json(productListResponse(result.items, result.meta));
  }),
);
router.get(
  "/:id",
  requirePermission("products.view"),
  asyncRoute(async (req, res) => {
    const params: ProductIdParams = parseRequest(
      productIdParamsSchema,
      req.params,
    );
    const product = await useCase.getById(params.id);
    if (!product) throw new NotFoundError("Product not found.");
    res.status(200).json(productResponse("OK", product));
  }),
);
router.post(
  "/",
  requirePermission("products.create"),
  asyncRoute(async (req, res) => {
    const body: ProductCreateRequest = parseRequest(
      productCreateRequestSchema,
      req.body,
    );
    const product = await useCase.create({
      productCode: body.product_code,
      productName: body.product_name,
      stock: body.stock,
      price: body.price,
      lowStockThreshold: body.low_stock_threshold,
    });
    res
      .status(StatusCodes.CREATED)
      .json(productResponse("Product created.", product));
  }),
);
router.put(
  "/:id",
  requirePermission("products.update"),
  asyncRoute(async (req, res) => {
    const params: ProductIdParams = parseRequest(
      productIdParamsSchema,
      req.params,
    );
    const body: ProductUpdateRequest = parseRequest(
      productUpdateRequestSchema,
      req.body,
    );
    const product = await useCase.update(params.id, {
      ...(body.product_code !== undefined
        ? { productCode: body.product_code }
        : {}),
      ...(body.product_name !== undefined
        ? { productName: body.product_name }
        : {}),
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.low_stock_threshold !== undefined
        ? { lowStockThreshold: body.low_stock_threshold }
        : {}),
    });
    res.status(200).json(productResponse("Product updated.", product));
  }),
);
router.delete(
  "/:id",
  requirePermission("products.delete"),
  asyncRoute(async (req, res) => {
    const params: ProductIdParams = parseRequest(
      productIdParamsSchema,
      req.params,
    );
    await useCase.delete(params.id);
    res.status(StatusCodes.NO_CONTENT).send();
  }),
);
router.post(
  "/:id/stock-adjustments",
  requirePermission("stock.adjust"),
  asyncRoute(async (req, res) => {
    const params: ProductIdParams = parseRequest(
      productIdParamsSchema,
      req.params,
    );
    const parsed: StockAdjustmentRequest = parseRequest(
      stockAdjustmentRequestSchema,
      req.body,
    );
    const product = await useCase.adjustStock(
      params.id,
      parsed.quantity_change,
      parsed.note,
      currentUserId()!,
    );
    res.status(200).json(productResponse("Stock adjusted.", product));
  }),
);
router.get(
  "/:id/stock-movements",
  requirePermission("stock.view_movements"),
  asyncRoute(async (req, res) => {
    const params: ProductIdParams = parseRequest(
      productIdParamsSchema,
      req.params,
    );
    const pagination = paginationFromRequest(req, {
      allowedSortBy: [],
      allowSearch: false,
      allowSorting: false,
    });
    const result = await useCase.movements(params.id, pagination);
    res.status(200).json(stockMovementListResponse(result.items, result.meta));
  }),
);
export default router;
