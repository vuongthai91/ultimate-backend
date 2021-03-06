import { CACHE_MANAGER, CacheStore, Inject, Injectable } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { merge } from 'lodash';
import { generateHashedPassword } from '@graphqlcqrs/common/utils';
import { BaseRepository, Before, EntityRepository, InjectClient, InjectDb } from '@juicycleff/nest-multi-tenant';
import { UserEntity } from '../entities';

@Injectable()
@EntityRepository({
  name: 'user',
  indexes: [
    {
      fields: { 'emails.address': 1 },
      options: { unique: true, sparse: true },
    },
    {
      fields: { username: 1 },
      options: { unique: true, sparse: true},
    },
  ],
})
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(
    @InjectClient() private readonly dbc: MongoClient,
    @InjectDb() private readonly db: Db,
    @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
  ) {
    super({ client: dbc, db }, cache, null);
  }

  @Before('CREATE')
  private onSaveData(data: Partial<UserEntity>): Partial<UserEntity> {
    return {
      ...data,
      services: {
        password: {
          hashed: generateHashedPassword(data.services.password.hashed),
        },
      },
      ...this.onSave(),
    };
  }

  @Before('UPDATE')
  private onUpdateData(data: Partial<any>) {
    return merge(data, this.onUpdate());
  }
}
