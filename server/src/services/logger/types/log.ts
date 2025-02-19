import { v4 as uuid } from 'uuid'

import { type ILog } from '@/services/logger/types/ILog'
import { DebugLevel } from '@/services/logger/types/DebugLevel'
import { LogType } from '@/services/logger/types/LogType'

export class Log implements ILog {
  public createdAt?: Date | string
  public data?: any
  public id?: string
  public level?: DebugLevel
  public title: string
  public type: LogType

  public constructor(log: ILog) {
    this.id = log.id ? log.id : uuid()

    this.createdAt = log.createdAt ? log.createdAt : new Date()
    this.data = log.data
    this.level = log.level
    this.title = log.title
    this.type = log.type
  }
}
