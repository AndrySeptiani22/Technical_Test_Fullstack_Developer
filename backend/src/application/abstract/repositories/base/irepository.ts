import { DeepPartial, FindOptionsWhere } from "typeorm";

export type RepositoryUpdate<TEntity> = Partial<Record<keyof TEntity, unknown>>;

export interface IRepository<TEntity> {
  findOne(where: FindOptionsWhere<TEntity>): Promise<TEntity | null>;
  find(where?: FindOptionsWhere<TEntity>): Promise<TEntity[]>;
  isExists(where: FindOptionsWhere<TEntity>): Promise<boolean>;
  save(entity: DeepPartial<TEntity>): Promise<TEntity>;
  update(
    where: FindOptionsWhere<TEntity>,
    values: RepositoryUpdate<TEntity>,
  ): Promise<number>;
  delete(where: FindOptionsWhere<TEntity>): Promise<number>;
}
