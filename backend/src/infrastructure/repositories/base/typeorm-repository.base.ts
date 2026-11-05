import {
  DataSource,
  DeepPartial,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { HTTPContextAccessor } from "@infrastructure/config/http-context-accessor";
import {
  normalizePagination,
  PaginatedResult,
  PaginationQuery,
} from "@application/models/pagination/pagination.query";
import {
  IRepository,
  RepositoryUpdate,
} from "@application/abstract/repositories/base/irepository";

export abstract class TypeOrmRepositoryBase<
  TEntity extends ObjectLiteral,
> implements IRepository<TEntity> {
  protected readonly entityRepository: Repository<TEntity>;
  private readonly httpContextAccessor = new HTTPContextAccessor();

  protected constructor(
    protected readonly dataSource: DataSource,
    entity: EntityTarget<TEntity>,
  ) {
    this.entityRepository = dataSource.getRepository(entity);
  }

  findOne(where: FindOptionsWhere<TEntity>): Promise<TEntity | null> {
    return this.entityRepository.findOne({ where });
  }

  find(where?: FindOptionsWhere<TEntity>): Promise<TEntity[]> {
    return this.entityRepository.find(where ? { where } : undefined);
  }

  isExists(where: FindOptionsWhere<TEntity>): Promise<boolean> {
    return this.entityRepository.exists({ where });
  }

  save(entity: DeepPartial<TEntity>): Promise<TEntity> {
    if (this.hasAuditColumns()) {
      const auditedEntity = entity as DeepPartial<TEntity> & {
        createdAt?: Date;
        createdBy?: string | null;
        updatedAt?: Date | null;
        updatedBy?: string | null;
      };
      if (this.entityRepository.hasId(entity as TEntity)) {
        auditedEntity.updatedAt = new Date();
        auditedEntity.updatedBy = this.httpContextAccessor.getUserId();
      } else {
        auditedEntity.createdAt = new Date();
        auditedEntity.createdBy = this.httpContextAccessor.getUserId();
      }
    }
    return this.entityRepository.save(entity);
  }

  async update(
    where: FindOptionsWhere<TEntity>,
    values: RepositoryUpdate<TEntity>,
  ): Promise<number> {
    const updateValues = { ...values } as RepositoryUpdate<TEntity> & {
      updatedAt?: Date | null;
      updatedBy?: string | null;
    };
    if (this.hasAuditColumns()) {
      updateValues.updatedAt = new Date();
      updateValues.updatedBy = this.httpContextAccessor.getUserId();
    }
    const result = await this.entityRepository.update(
      where,
      updateValues as any,
    );
    return result.affected ?? 0;
  }

  async delete(where: FindOptionsWhere<TEntity>): Promise<number> {
    const result = await this.entityRepository.delete(where);
    return result.affected ?? 0;
  }

  private hasAuditColumns(): boolean {
    const columns = this.entityRepository.metadata.columns;
    return (
      columns.some((column) => column.propertyName === "createdBy") &&
      columns.some((column) => column.propertyName === "updatedBy")
    );
  }

  protected async paginate(
    queryBuilder: SelectQueryBuilder<TEntity>,
    query: PaginationQuery = {},
  ): Promise<PaginatedResult<TEntity>> {
    const pagination = normalizePagination(query);
    const [items, total] = await queryBuilder
      .skip((pagination.page - 1) * pagination.pageSize)
      .take(pagination.pageSize)
      .getManyAndCount();

    const totalPages = Math.ceil(total / pagination.pageSize);
    return {
      items,
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1,
      },
    };
  }
}
