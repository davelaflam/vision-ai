import { DebugLevel } from '@/services/logger/types/DebugLevel'
import { ITrackable } from '@/services/logger/types/ITrackable'
import { LogType } from '@/services/logger/types/LogType'

export interface ILog extends ITrackable {
  data?: any
  level?: DebugLevel
  title: string
  type: LogType
}
