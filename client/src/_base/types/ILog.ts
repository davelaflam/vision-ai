import { DebugLevel, type ITrackable, LogType } from '@/_base/types'

export interface ILog extends ITrackable {
  data?: any
  level?: DebugLevel
  title: string
  type: LogType
}
