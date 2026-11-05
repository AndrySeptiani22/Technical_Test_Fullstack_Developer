import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { CustomerRepository } from "@infrastructure/repositories/catalog.repository";
import { CustomerUseCase } from "@application/use-cases/customers/customer.use-case";
import dataSource from "@infrastructure/config/db-context";
import {
  asyncRoute,
  gridListFromRequest,
  paginationFromRequest,
} from "./endpoint-helpers";
import {
  authenticate,
  requirePermission,
} from "@presentation/middleware/shop-auth.middleware";
import { NotFoundError } from "@application/models/error/application.error";
import { parseRequest } from "@application/models/validators/common.validator";
import {
  customerCreateRequestSchema,
  customerIdParamsSchema,
  customerUpdateRequestSchema,
} from "@application/models/validators/catalog.validator";
import type {
  CustomerCreateRequest,
  CustomerIdParams,
  CustomerUpdateRequest,
} from "@application/models/requests/catalog.request";
import {
  customerListResponse,
  customerResponse,
} from "@application/models/response/catalog.response";

const router = Router();
const useCase = new CustomerUseCase(new CustomerRepository(dataSource));

router.use(authenticate);
router.get(
  "/",
  requirePermission("customers.view"),
  asyncRoute(async (req, res) => {
    const result = await useCase.list(
      paginationFromRequest(req, {
        allowedSortBy: ["customerName", "createdAt", "email"],
        allowSearch: true,
        allowedFilters: {
          customer_name: "text",
          email: "text",
          phone: "text",
          customer_address: "text",
        },
      }),
    );
    res.status(200).json(customerListResponse(result.items, result.meta));
  }),
);
router.post(
  "/filter",
  requirePermission("customers.view"),
  asyncRoute(async (req, res) => {
    const result = await useCase.list(
      gridListFromRequest(req, {
        allowedSortBy: ["customerName", "createdAt", "email"],
        allowSearch: true,
        allowedFilters: {
          customer_name: "text",
          email: "text",
          phone: "text",
          customer_address: "text",
        },
      }),
    );
    res.status(200).json(customerListResponse(result.items, result.meta));
  }),
);
router.get(
  "/:id",
  requirePermission("customers.view"),
  asyncRoute(async (req, res) => {
    const params: CustomerIdParams = parseRequest(
      customerIdParamsSchema,
      req.params,
    );
    const customer = await useCase.getById(params.id);
    if (!customer) throw new NotFoundError("Customer not found.");
    res.status(200).json(customerResponse("OK", customer));
  }),
);
router.post(
  "/",
  requirePermission("customers.create"),
  asyncRoute(async (req, res) => {
    const body: CustomerCreateRequest = parseRequest(
      customerCreateRequestSchema,
      req.body,
    );
    const customer = await useCase.create({
      customerName: body.customer_name,
      customerAddress: body.customer_address,
      gender: body.gender ?? null,
      birthDate: body.birth_date ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
    });
    res
      .status(StatusCodes.CREATED)
      .json(customerResponse("Customer created.", customer));
  }),
);
router.put(
  "/:id",
  requirePermission("customers.update"),
  asyncRoute(async (req, res) => {
    const params: CustomerIdParams = parseRequest(
      customerIdParamsSchema,
      req.params,
    );
    const body: CustomerUpdateRequest = parseRequest(
      customerUpdateRequestSchema,
      req.body,
    );
    const customer = await useCase.update(params.id, {
      ...(body.customer_name !== undefined
        ? { customerName: body.customer_name }
        : {}),
      ...(body.customer_address !== undefined
        ? { customerAddress: body.customer_address }
        : {}),
      ...(body.gender !== undefined ? { gender: body.gender } : {}),
      ...(body.birth_date !== undefined ? { birthDate: body.birth_date } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
    });
    res.status(200).json(customerResponse("Customer updated.", customer));
  }),
);
router.delete(
  "/:id",
  requirePermission("customers.delete"),
  asyncRoute(async (req, res) => {
    const params: CustomerIdParams = parseRequest(
      customerIdParamsSchema,
      req.params,
    );
    await useCase.delete(params.id);
    res.status(StatusCodes.NO_CONTENT).send();
  }),
);
export default router;
