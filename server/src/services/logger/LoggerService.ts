import { toJSON } from 'flatted'
import { DebugLevel, Log, LogType } from './types/index.js'
import dotenv from 'dotenv'

dotenv.config()

export { DebugLevel }

export class LoggerService {
  // set the debug logs if VERBOSE environment variable is present
  static areDebugLogsOn: boolean = process.env.VERBOSE && process.env.VERBOSE === 'true' ? true : false
  static logs: Log[] = []

  /**
   * @description debug log
   * @param title the title of the log message.
   * @param data optional data object to print out.
   * @param level the service level of the log.
   * @memberof LoggerService
   */
  public async debug(
    title: string,
    data: string | object | [] = {},
    level: DebugLevel = DebugLevel.SERVICE,
  ): Promise<boolean> {
    return await LoggerService.debug(title, data, level)
  }

  /**
   * @description error log
   * @param title the title of the log message
   * @param data optional data
   * @memberof LoggerService
   */
  public async error(title: string, data: string | object | [] = {}): Promise<boolean> {
    return await LoggerService.error(title, data)
  }

  /**
   * @description info log
   * @param title the title of the log.
   * @param data some optional data.
   * @memberof LoggerService
   */
  public async info(title: string, data: string | object | [] = {}): Promise<boolean> {
    return await LoggerService.info(title, data)
  }

  /**
   * @description warning log. Meaning that it's not a disaster but weird and should be investigated.
   * @param title the title of the log message.
   * @param data optional data object to print out.
   * @memberof LoggerService
   */
  public async warning(title: string, data: string | object | [] = {}): Promise<boolean> {
    return LoggerService.warning(title, data)
  }

  /**
   * @description debug log
   * @param title the title of the log
   * @param data some optional data.
   * @param level the service level of the log.
   * @memberof LoggerService
   */
  public static async debug(
    title: string,
    data: string | object | [] = {},
    level: DebugLevel = DebugLevel.SERVICE,
  ): Promise<boolean> {
    if (!this.areDebugLogsOn) {
      return true
    }

    this.logs.push(new Log({ level, title, data, type: LogType.DEBUG }))

    console.log(`🐛 ${title}`)
    return this._logData(data)
  }

  /**
   * @description error log
   * @param {string} title the title of the log message
   * @param {string|object} data additional data
   * @memberof LoggerService
   */
  public static async error(title: string, data?: string | object | []): Promise<boolean> {
    this.logs.push(new Log({ title, data, type: LogType.ERROR }))

    console.error(`🆘 ${title}`)
    this._logData(data)

    return true
  }

  /**
   * @description info log
   * @param {string} title the title of the log message
   * @param {string|object} data additional data
   * @memberof LoggerService
   */
  public static async info(title: string, data?: string | object | []): Promise<boolean> {
    this.logs.push(new Log({ title, data, type: LogType.INFO }))

    console.info(`ℹ️ ${title}`)
    this._logData(data)

    return true
  }

  /**
   * @description warning log. Meaning that it's not a disaster but weird and should be investigated.
   * @param title the title of the log message.
   * @param data optional data object to print out.
   * @memberof LoggerService
   */
  public static async warning(title: string, data: string | object | [] = {}): Promise<boolean> {
    this.logs.push(new Log({ title, data, type: LogType.WARNING }))

    console.info(`⚠️ ${title}`)
    this._logData(data)

    return true
  }

  private static async _logData(data: string | object | [] = {}): Promise<boolean> {
    if (!data) {
      return false
    }
    if (Object.keys(data).length === 0 && data.constructor === Object) {
      return false
    }

    try {
      console.info(`     ${toJSON(data)}`)
    } catch (error) {
      console.error('Failed to log some data')
      return false
    }

    return true
  }
}
